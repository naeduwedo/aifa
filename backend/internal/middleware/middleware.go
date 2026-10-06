package middleware

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/aifa.one/backend/internal/auth"
	"github.com/aifa.one/backend/internal/cache"
	"github.com/aifa.one/backend/internal/model"
	"github.com/aifa.one/backend/internal/store"
)

type ctxKey string

const (
	UserKey    ctxKey = "user"
	SessionKey ctxKey = "session"
	TokenKey   ctxKey = "token"
)

func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func Error(w http.ResponseWriter, status int, msg string) {
	JSON(w, status, map[string]string{"error": msg})
}

func Decode(r *http.Request, dst any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}

func Chain(h http.Handler, mws ...func(http.Handler) http.Handler) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}

// Logger prints one line per request.
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start).Round(time.Millisecond))
	})
}

// CORS allows the Next.js dev server and any configured origin.
func CORS(origins []string) func(http.Handler) http.Handler {
	allowed := map[string]bool{}
	for _, o := range origins {
		allowed[strings.TrimSuffix(o, "/")] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" && allowed[strings.TrimSuffix(origin, "/")] {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			}
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RateLimit keys off client ip + route prefix.
func RateLimit(c *cache.Cache, limit int, window time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := clientIP(r)
			key := ip + "|" + r.URL.Path
			ok, err := c.RateLimit(r.Context(), key, limit, window)
			if err == nil && !ok {
				Error(w, http.StatusTooManyRequests, "too many requests")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// OptionalAuth attaches the signed-in user when a valid session cookie exists.
func OptionalAuth(a *auth.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c, err := r.Cookie(auth.SessionCookie)
			if err == nil && c.Value != "" {
				if p, err := a.ReadSession(r.Context(), c.Value); err == nil {
					ctx := context.WithValue(r.Context(), TokenKey, c.Value)
					ctx = context.WithValue(ctx, SessionKey, p)
					if st, err := storeFrom(r); err == nil {
						if u, err := st.GetUserByID(r.Context(), p.UserID); err == nil {
							ctx = context.WithValue(ctx, UserKey, u)
						}
					}
					r = r.WithContext(ctx)
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireAuth answers 401 when nobody is signed in.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if UserFrom(r) == nil {
			Error(w, http.StatusUnauthorized, "sign in required")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func WithStore(st *store.Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r = r.WithContext(context.WithValue(r.Context(), ctxKey("store"), st))
			next.ServeHTTP(w, r)
		})
	}
}

func storeFrom(r *http.Request) (*store.Store, error) {
	if v, ok := r.Context().Value(ctxKey("store")).(*store.Store); ok && v != nil {
		return v, nil
	}
	return nil, errNoStore
}

var errNoStore = context.Canceled

func Store(r *http.Request) *store.Store {
	v, _ := r.Context().Value(ctxKey("store")).(*store.Store)
	return v
}

func UserFrom(r *http.Request) *model.User {
	v, _ := r.Context().Value(UserKey).(*model.User)
	return v
}

func SessionFrom(r *http.Request) *auth.SessionPayload {
	v, _ := r.Context().Value(SessionKey).(*auth.SessionPayload)
	return v
}

func TokenFrom(r *http.Request) string {
	v, _ := r.Context().Value(TokenKey).(string)
	return v
}

func clientIP(r *http.Request) string {
	if x := r.Header.Get("X-Forwarded-For"); x != "" {
		return strings.Split(x, ",")[0]
	}
	return strings.Split(r.RemoteAddr, ":")[0]
}
