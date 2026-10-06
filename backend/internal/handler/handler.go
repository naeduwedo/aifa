package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/aifa.one/backend/internal/auth"
	"github.com/aifa.one/backend/internal/cache"
	"github.com/aifa.one/backend/internal/config"
	"github.com/aifa.one/backend/internal/middleware"
	"github.com/aifa.one/backend/internal/model"
	"github.com/aifa.one/backend/internal/store"
	"github.com/jackc/pgx/v5"
)

type API struct {
	Cfg   *config.Config
	Store *store.Store
	Cache *cache.Cache
	Auth  *auth.Service
}

func writeJSON(w http.ResponseWriter, status int, v any) { middleware.JSON(w, status, v) }
func writeErr(w http.ResponseWriter, status int, msg string) {
	middleware.Error(w, status, msg)
}
func decode(r *http.Request, dst any) error { return middleware.Decode(r, dst) }

// lang picks the response language, defaulting to English.
func lang(r *http.Request) string {
	if l := r.URL.Query().Get("lang"); l == "zh" || l == "en" {
		return l
	}
	return "en"
}

// --------------------------------------------------------------- content

// Home assembles the cover screen payload.
func (a *API) Home(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	schedule, err := a.Store.DailySchedule(ctx)
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}

	target := r.URL.Query().Get("date")
	if target == "" {
		target = time.Now().UTC().Format("2006-01-02")
		// fall back to the newest published issue when today has none
		if list, err := a.Store.DailyForDate(ctx, target); err != nil || len(list) == 0 {
			if latest, err := a.Store.LatestPublishedDate(ctx); err == nil && latest != "" {
				target = latest
			}
		}
	}

	entries := []model.DailyEntry{}
	if list, err := a.Store.DailyForDate(ctx, target); err == nil {
		for _, art := range list {
			entries = append(entries, a.Store.DailyCard(ctx, art))
		}
	}

	todayIndex := 0
	for i, s := range schedule {
		if s.Date == target {
			todayIndex = i
		}
	}

	tomorrow := map[string]any{"date": "", "authors": []any{}}
	if todayIndex+1 < len(schedule) {
		tomorrow["date"] = schedule[todayIndex+1].Date
	} else if len(schedule) > 0 {
		last, _ := time.Parse("2006-01-02", schedule[len(schedule)-1].Date)
		tomorrow["date"] = last.AddDate(0, 0, 1).Format("2006-01-02")
	}

	sections := []model.Section{}
	if profiles, err := a.Store.ColumnProfiles(ctx); err == nil {
		for _, p := range profiles {
			sections = append(sections, model.Section{
				ID:             "columns",
				Label:          model.Text{Zh: "专栏", En: "Columns"},
				Articles:       []model.Card{},
				ColumnProfiles: []model.AuthorProfile{p},
			})
		}
	}

	payload := model.HomePayload{
		Daily:      entries,
		TodayIndex: todayIndex,
		Tomorrow:   tomorrow,
		Weekly:     []any{},
		Notice:     false,
		Sections:   sections,
		Schedule:   schedule,
		Account:    middleware.UserFrom(r),
	}
	writeJSON(w, 200, payload)
}

// DailyByDate returns the issues of one calendar day (used by the arrows).
func (a *API) DailyByDate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	date := r.URL.Query().Get("date")
	out := []model.DailyEntry{}
	if list, err := a.Store.DailyForDate(ctx, date); err == nil {
		for _, art := range list {
			out = append(out, a.Store.DailyCard(ctx, art))
		}
	}
	writeJSON(w, 200, map[string]any{"date": date, "daily": out})
}

// Article returns one issue with pages, blocks and sources.
func (a *API) Article(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	detail, err := a.Store.ArticleDetail(r.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErr(w, 404, "article not found")
			return
		}
		writeErr(w, 500, err.Error())
		return
	}
	u := middleware.UserFrom(r)
	comments, _ := a.Store.Comments(r.Context(), slug)
	if comments == nil {
		comments = []model.Comment{}
	}
	detail.Comments = comments

	resp := map[string]any{"article": detail}
	if u != nil {
		page, percent, finished, _ := a.Store.Progress(r.Context(), u.ID, slug)
		resp["progress"] = map[string]any{"page": page, "percent": percent, "finished": finished}
		saves, _ := a.Store.ListSaves(r.Context(), u.ID)
		saved := false
		for _, s := range saves {
			if s.Kind == "article" && s.TargetID == slug {
				saved = true
			}
		}
		resp["saved"] = saved
	}
	writeJSON(w, 200, resp)
}

// Columns lists the column roster.
func (a *API) Columns(w http.ResponseWriter, r *http.Request) {
	profiles, err := a.Store.ColumnProfiles(r.Context())
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	if profiles == nil {
		profiles = []model.AuthorProfile{}
	}
	writeJSON(w, 200, map[string]any{"columnProfiles": profiles})
}

// Author serves the public author page /u/:no
func (a *API) Author(w http.ResponseWriter, r *http.Request) {
	no, _ := strconv.ParseInt(r.PathValue("no"), 10, 64)
	p, err := a.Store.AuthorByNo(r.Context(), no)
	if err != nil {
		writeErr(w, 404, "author not found")
		return
	}
	writeJSON(w, 200, p)
}

func (a *API) Research(w http.ResponseWriter, r *http.Request) {
	list, err := a.Store.Research(r.Context())
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"resources": list})
}

func (a *API) Academy(w http.ResponseWriter, r *http.Request) {
	list, err := a.Store.Academy(r.Context())
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"shelves": list})
}

func (a *API) GoGlobal(w http.ResponseWriter, r *http.Request) {
	list, err := a.Store.GoGlobal(r.Context())
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"activities": list})
}

func (a *API) About(w http.ResponseWriter, r *http.Request) {
	videos, _ := a.Store.Videos(r.Context())
	articles := []model.Card{}
	if list, err := a.Store.PublishedList(r.Context(), 1); err == nil {
		for _, art := range list {
			articles = append(articles, a.Store.Card(r.Context(), art))
		}
	}
	writeJSON(w, 200, map[string]any{"videos": videos, "articles": articles})
}

// Search powers the shelf and site-wide quick lookup.
func (a *API) Search(w http.ResponseWriter, r *http.Request) {
	q := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
	out := []model.Card{}
	if list, err := a.Store.PublishedList(r.Context(), 100); err == nil {
		for _, art := range list {
			card := a.Store.Card(r.Context(), art)
			hay := strings.ToLower(card.Title.En + " " + card.Title.Zh)
			if q == "" || strings.Contains(hay, q) {
				out = append(out, card)
			}
		}
	}
	writeJSON(w, 200, map[string]any{"results": out})
}

// Health is used by docker healthchecks and the frontend boot probe.
func (a *API) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{"ok": true, "time": time.Now().UTC()})
}

var _ = json.Marshal
