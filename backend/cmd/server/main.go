package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/aifa.one/backend/internal/auth"
	"github.com/aifa.one/backend/internal/cache"
	"github.com/aifa.one/backend/internal/config"
	"github.com/aifa.one/backend/internal/db"
	"github.com/aifa.one/backend/internal/handler"
	"github.com/aifa.one/backend/internal/middleware"
	"github.com/aifa.one/backend/internal/store"
)

func main() {
	cfg := config.Load()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("postgres: %v", err)
	}
	defer pool.Close()

	migDir := os.Getenv("MIGRATIONS_DIR")
	if migDir == "" {
		migDir = findMigrations()
	}
	if err := db.Migrate(ctx, pool, migDir); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	rdb, err := cache.Connect(cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		log.Fatalf("redis: %v", err)
	}

	st := store.New(pool)
	sessionAuth := auth.New(rdb, cfg)
	api := &handler.API{Cfg: cfg, Store: st, Cache: rdb, Auth: sessionAuth}

	// flush redis view counters into postgres
	go func() {
		t := time.NewTicker(time.Minute)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				day := time.Now().UTC().AddDate(0, 0, -1).Format("2006-01-02")
				if counts, err := rdb.TakeViews(ctx, day); err == nil && len(counts) > 0 {
					st.RecordViews(ctx, day, counts)
				}
				if counts, err := rdb.TakeViews(ctx, time.Now().UTC().Format("2006-01-02")); err == nil && len(counts) > 0 {
					st.RecordViews(ctx, time.Now().UTC().Format("2006-01-02"), counts)
				}
			}
		}
	}()

	base := []func(http.Handler) http.Handler{
		middleware.Logger,
		middleware.WithStore(st),
		middleware.CORS(cfg.AllowedOrigins),
		middleware.OptionalAuth(sessionAuth),
	}

	mux := http.NewServeMux()

	// ---- public content
	mux.Handle("GET /api/health", middleware.Chain(http.HandlerFunc(api.Health), base...))
	mux.Handle("GET /api/home", middleware.Chain(http.HandlerFunc(api.Home), base...))
	mux.Handle("GET /api/daily", middleware.Chain(http.HandlerFunc(api.DailyByDate), base...))
	mux.Handle("GET /api/articles", middleware.Chain(http.HandlerFunc(api.Search), base...))
	mux.Handle("GET /api/articles/{slug}", middleware.Chain(http.HandlerFunc(api.Article), base...))
	mux.Handle("GET /api/articles/{slug}/comments", middleware.Chain(http.HandlerFunc(api.Comments), base...))
	mux.Handle("GET /api/columns", middleware.Chain(http.HandlerFunc(api.Columns), base...))
	mux.Handle("GET /api/authors/{no}", middleware.Chain(http.HandlerFunc(api.Author), base...))
	mux.Handle("GET /api/research", middleware.Chain(http.HandlerFunc(api.Research), base...))
	mux.Handle("GET /api/academy", middleware.Chain(http.HandlerFunc(api.Academy), base...))
	mux.Handle("GET /api/go-global", middleware.Chain(http.HandlerFunc(api.GoGlobal), base...))
	mux.Handle("GET /api/about", middleware.Chain(http.HandlerFunc(api.About), base...))
	mux.Handle("GET /api/settings", middleware.Chain(http.HandlerFunc(api.PublicSettings), base...))
	mux.Handle("GET /api/site-pages", middleware.Chain(http.HandlerFunc(api.PublicSitePages), base...))
	mux.Handle("GET /api/site-pages/{slug}", middleware.Chain(http.HandlerFunc(api.PublicSitePage), base...))
	mux.Handle("GET /api/categories", middleware.Chain(http.HandlerFunc(api.PublicCategories), base...))

	// ---- auth
	authLimit := []func(http.Handler) http.Handler{
		middleware.RateLimit(rdb, 30, time.Minute),
	}
	mux.Handle("POST /api/auth/otp", middleware.Chain(http.HandlerFunc(api.RequestCode), append(base, authLimit...)...))
	mux.Handle("POST /api/auth/register", middleware.Chain(http.HandlerFunc(api.Register), append(base, authLimit...)...))
	mux.Handle("POST /api/auth/verify", middleware.Chain(http.HandlerFunc(api.VerifyCode), append(base, authLimit...)...))
	mux.Handle("POST /api/auth/logout", middleware.Chain(http.HandlerFunc(api.Logout), base...))
	mux.Handle("GET /api/auth/me", middleware.Chain(http.HandlerFunc(api.Me), base...))
	mux.Handle("PATCH /api/auth/profile", middleware.Chain(
		protect(api.UpdateProfile), base...))

	// ---- reader / bookshelf / comments
	mux.Handle("GET /api/shelf", middleware.Chain(http.HandlerFunc(api.Shelf), base...))
	mux.Handle("POST /api/shelf", middleware.Chain(protect(api.SaveAdd), base...))
	mux.Handle("DELETE /api/shelf/{kind}/{target}", middleware.Chain(protect(api.SaveRemove), base...))
	mux.Handle("POST /api/progress", middleware.Chain(protect(api.Progress), base...))
	mux.Handle("POST /api/authors/{no}/subscribe", middleware.Chain(protect(api.Subscribe), base...))
	mux.Handle("DELETE /api/authors/{no}/subscribe", middleware.Chain(protect(api.Subscribe), base...))
	mux.Handle("POST /api/articles/{slug}/comments", middleware.Chain(protect(api.AddComment), base...))
	mux.Handle("DELETE /api/comments/{id}", middleware.Chain(protect(api.DeleteComment), base...))

	// ---- writer article publishing
	mux.Handle("POST /api/articles", middleware.Chain(protectAuthor(api.CreateArticle), base...))
	mux.Handle("PATCH /api/articles/{id}", middleware.Chain(protectAuthor(api.UpdateArticle), base...))
	mux.Handle("DELETE /api/articles/{id}", middleware.Chain(protectAuthor(api.DeleteArticle), base...))
	mux.Handle("GET /api/articles/edit", middleware.Chain(protectAuthor(api.EditArticle), base...))
	mux.Handle("GET /api/articles/mine", middleware.Chain(protectAuthor(api.MyArticles), base...))

	// ---- admin console
	mux.Handle("GET /api/admin/stats", middleware.Chain(protectAdmin(api.AdminStats), base...))
	mux.Handle("GET /api/admin/users", middleware.Chain(protectAdmin(api.AdminUsers), base...))
	mux.Handle("PATCH /api/admin/users/{id}", middleware.Chain(protectAdmin(api.AdminUpdateUser), base...))
	mux.Handle("DELETE /api/admin/users/{id}", middleware.Chain(protectAdmin(api.AdminDeleteUser), base...))
	mux.Handle("GET /api/admin/categories", middleware.Chain(protectAdmin(api.AdminCategories), base...))
	mux.Handle("POST /api/admin/categories", middleware.Chain(protectAdmin(api.AdminCreateCategory), base...))
	mux.Handle("PATCH /api/admin/categories/{id}", middleware.Chain(protectAdmin(api.AdminUpdateCategory), base...))
	mux.Handle("DELETE /api/admin/categories/{id}", middleware.Chain(protectAdmin(api.AdminDeleteCategory), base...))
	mux.Handle("GET /api/admin/columns", middleware.Chain(protectAdmin(api.AdminColumns), base...))
	mux.Handle("POST /api/admin/columns", middleware.Chain(protectAdmin(api.AdminCreateColumn), base...))
	mux.Handle("PATCH /api/admin/columns/{id}", middleware.Chain(protectAdmin(api.AdminUpdateColumn), base...))
	mux.Handle("DELETE /api/admin/columns/{id}", middleware.Chain(protectAdmin(api.AdminDeleteColumn), base...))
	mux.Handle("GET /api/admin/articles", middleware.Chain(protectAdmin(api.AdminArticles), base...))
	mux.Handle("DELETE /api/admin/articles/{id}", middleware.Chain(protectAdmin(api.AdminDeleteArticle), base...))
	mux.Handle("GET /api/admin/pages", middleware.Chain(protectAdmin(api.AdminSitePages), base...))
	mux.Handle("POST /api/admin/pages", middleware.Chain(protectAdmin(api.AdminCreateSitePage), base...))
	mux.Handle("PATCH /api/admin/pages/{id}", middleware.Chain(protectAdmin(api.AdminUpdateSitePage), base...))
	mux.Handle("DELETE /api/admin/pages/{id}", middleware.Chain(protectAdmin(api.AdminDeleteSitePage), base...))
	mux.Handle("GET /api/admin/settings", middleware.Chain(protectAdmin(api.AdminGetSettings), base...))
	mux.Handle("PUT /api/admin/settings", middleware.Chain(protectAdmin(api.AdminPutSettings), base...))

	// ---- advisory, newsletter, feedback, analytics
	mux.Handle("POST /api/consult", middleware.Chain(http.HandlerFunc(api.CreateConsult), append(base, middleware.RateLimit(rdb, 20, time.Minute))...))
	mux.Handle("GET /api/consult/{id}", middleware.Chain(http.HandlerFunc(api.ConsultMessages), base...))
	mux.Handle("POST /api/consult/{id}", middleware.Chain(http.HandlerFunc(api.ConsultReply), append(base, middleware.RateLimit(rdb, 40, time.Minute))...))
	mux.Handle("POST /api/consult/{id}/close", middleware.Chain(http.HandlerFunc(api.ConsultClose), base...))
	mux.Handle("POST /api/newsletter", middleware.Chain(http.HandlerFunc(api.Newsletter), append(base, middleware.RateLimit(rdb, 10, time.Hour))...))
	mux.Handle("POST /api/research/{slug}/lead", middleware.Chain(http.HandlerFunc(api.ResearchLead), append(base, middleware.RateLimit(rdb, 10, time.Hour))...))
	mux.Handle("POST /api/feedback", middleware.Chain(http.HandlerFunc(api.Feedback), append(base, middleware.RateLimit(rdb, 8, time.Hour))...))
	mux.Handle("POST /api/track", middleware.Chain(http.HandlerFunc(api.Track), append(base, middleware.RateLimit(rdb, 120, time.Minute))...))

	// ---- CORS preflight for every api route
	mux.Handle("OPTIONS /api/", middleware.Chain(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}), middleware.CORS(cfg.AllowedOrigins)))

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}
	go func() {
		log.Printf("aifa api listening on :%s (dev=%v)", cfg.Port, cfg.DevMode)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server: %v", err)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(shutdownCtx)
}

// protect wraps a handler that must run for a signed-in reader.
func protect(fn http.HandlerFunc) http.Handler { return middleware.RequireAuth(fn) }

// protectAuthor wraps a handler that must run for a staff writer or admin.
func protectAuthor(fn http.HandlerFunc) http.Handler { return middleware.RequireAuthor(fn) }

// protectAdmin wraps a handler that must run for an administrator.
func protectAdmin(fn http.HandlerFunc) http.Handler { return middleware.RequireAdmin(fn) }
func findMigrations() string {
	candidates := []string{"migrations", "backend/migrations", "../migrations", "../../migrations"}
	if exe, err := os.Executable(); err == nil {
		candidates = append(candidates, filepath.Join(filepath.Dir(exe), "migrations"))
	}
	for _, c := range candidates {
		if st, err := os.Stat(c); err == nil && st.IsDir() {
			return c
		}
	}
	return "migrations"
}
