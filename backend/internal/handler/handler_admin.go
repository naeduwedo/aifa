package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"

	"github.com/aifa.one/backend/internal/middleware"
	"github.com/aifa.one/backend/internal/model"
	"github.com/aifa.one/backend/internal/store"
)

var slugRe = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,79}$`)

func pathID(r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	return id, err == nil && id > 0
}

func isUniqueErr(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

// ------------------------------------------------------------------ stats

func (a *API) AdminStats(w http.ResponseWriter, r *http.Request) {
	stats, err := a.Store.AdminStats(r.Context())
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	recentArticles := []model.Card{}
	if list, err := a.Store.AdminArticles(r.Context(), "", "", nil); err == nil {
		for _, it := range list {
			if len(recentArticles) >= 6 {
				break
			}
			recentArticles = append(recentArticles, model.Card{
				ArticleID: "article-" + strconv.FormatInt(it.ID, 10),
				Slug:      it.Slug,
				Title:     it.Title,
				Date:      it.Date,
				Author:    model.Text{En: it.AuthorName},
				Status:    it.Status,
				Summary:   it.Category,
			})
		}
	}
	recentUsers := []store.AdminUser{}
	if users, err := a.Store.AdminUsers(r.Context(), ""); err == nil {
		for _, u := range users {
			if len(recentUsers) >= 6 {
				break
			}
			recentUsers = append(recentUsers, u)
		}
	}
	writeJSON(w, 200, map[string]any{
		"stats":         stats,
		"recentArticles": recentArticles,
		"recentUsers":    recentUsers,
	})
}

// ------------------------------------------------------------------ users

func (a *API) AdminUsers(w http.ResponseWriter, r *http.Request) {
	users, err := a.Store.AdminUsers(r.Context(), r.URL.Query().Get("q"))
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"users": users})
}

func (a *API) AdminUpdateUser(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		writeErr(w, 400, "invalid id")
		return
	}
	var patch store.UserPatch
	if err := decode(r, &patch); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	if patch.Role != nil {
		switch *patch.Role {
		case "reader", "author", "admin":
		default:
			writeErr(w, 400, "invalid role")
			return
		}
	}
	me := middleware.UserFrom(r)
	if me != nil && id == me.ID {
		if (patch.Role != nil && *patch.Role != me.Role) || (patch.IsAuthor != nil && *patch.IsAuthor != me.IsAuthor) {
			writeErr(w, 400, "cannot change your own role")
			return
		}
	}
	if err := a.Store.AdminUpdateUser(r.Context(), id, patch); err != nil {
		writeErr(w, 500, "update failed")
		return
	}
	users, _ := a.Store.AdminUsers(r.Context(), "")
	for _, u := range users {
		if u.ID == id {
			writeJSON(w, 200, map[string]any{"user": u})
			return
		}
	}
	writeJSON(w, 200, map[string]any{"user": nil})
}

func (a *API) AdminDeleteUser(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		writeErr(w, 400, "invalid id")
		return
	}
	if me := middleware.UserFrom(r); me != nil && id == me.ID {
		writeErr(w, 400, "cannot delete your own account")
		return
	}
	if err := a.Store.AdminDeleteUser(r.Context(), id); err != nil {
		writeErr(w, 500, "delete failed")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

// ------------------------------------------------------------- categories

func (a *API) AdminCategories(w http.ResponseWriter, r *http.Request) {
	list, err := a.Store.AdminCategories(r.Context())
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"categories": list})
}

type categoryBody struct {
	Slug   string     `json:"slug"`
	Name   model.Text `json:"name"`
	Ord    int        `json:"ord"`
	Status string     `json:"status"`
}

func validSlug(slug string) bool { return slugRe.MatchString(slug) }

func (a *API) AdminCreateCategory(w http.ResponseWriter, r *http.Request) {
	var body categoryBody
	if err := decode(r, &body); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	body.Slug = strings.ToLower(strings.TrimSpace(body.Slug))
	if !validSlug(body.Slug) {
		writeErr(w, 400, "invalid slug")
		return
	}
	if body.Status == "" {
		body.Status = "active"
	}
	if body.Status != "active" && body.Status != "hidden" {
		writeErr(w, 400, "invalid status")
		return
	}
	id, err := a.Store.AdminCreateCategory(r.Context(), body.Slug, body.Name.Zh, body.Name.En, body.Ord, body.Status)
	if err != nil {
		if isUniqueErr(err) {
			writeErr(w, 409, "slug already taken")
			return
		}
		writeErr(w, 500, "create failed")
		return
	}
	writeJSON(w, 200, map[string]any{"id": id})
}

func (a *API) AdminUpdateCategory(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		writeErr(w, 400, "invalid id")
		return
	}
	var body categoryBody
	if err := decode(r, &body); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	body.Slug = strings.ToLower(strings.TrimSpace(body.Slug))
	if !validSlug(body.Slug) {
		writeErr(w, 400, "invalid slug")
		return
	}
	if err := a.Store.AdminUpdateCategory(r.Context(), id, body.Slug, body.Name.Zh, body.Name.En, body.Ord, body.Status); err != nil {
		if isUniqueErr(err) {
			writeErr(w, 409, "slug already taken")
			return
		}
		writeErr(w, 500, "update failed")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (a *API) AdminDeleteCategory(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		writeErr(w, 400, "invalid id")
		return
	}
	if err := a.Store.AdminDeleteCategory(r.Context(), id); err != nil {
		writeErr(w, 500, "delete failed")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

// ------------------------------------------------------------ site columns

func (a *API) AdminColumns(w http.ResponseWriter, r *http.Request) {
	list, err := a.Store.AdminColumns(r.Context())
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"columns": list})
}

func (a *API) AdminCreateColumn(w http.ResponseWriter, r *http.Request) {
	var patch store.ColumnPatch
	if err := decode(r, &patch); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	patch.Slug = strings.ToLower(strings.TrimSpace(patch.Slug))
	if !validSlug(patch.Slug) {
		writeErr(w, 400, "invalid slug")
		return
	}
	if patch.Status == "" {
		patch.Status = "active"
	}
	id, err := a.Store.AdminCreateColumn(r.Context(), patch)
	if err != nil {
		if isUniqueErr(err) {
			writeErr(w, 409, "slug already taken")
			return
		}
		writeErr(w, 500, "create failed")
		return
	}
	writeJSON(w, 200, map[string]any{"id": id})
}

func (a *API) AdminUpdateColumn(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		writeErr(w, 400, "invalid id")
		return
	}
	var patch store.ColumnPatch
	if err := decode(r, &patch); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	patch.Slug = strings.ToLower(strings.TrimSpace(patch.Slug))
	if !validSlug(patch.Slug) {
		writeErr(w, 400, "invalid slug")
		return
	}
	if err := a.Store.AdminUpdateColumn(r.Context(), id, patch); err != nil {
		if isUniqueErr(err) {
			writeErr(w, 409, "slug already taken")
			return
		}
		writeErr(w, 500, "update failed")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (a *API) AdminDeleteColumn(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		writeErr(w, 400, "invalid id")
		return
	}
	if err := a.Store.AdminDeleteColumn(r.Context(), id); err != nil {
		writeErr(w, 500, "delete failed")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

// ---------------------------------------------------------------- articles

func (a *API) AdminArticles(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	list, err := a.Store.AdminArticles(r.Context(), q.Get("status"), q.Get("q"), nil)
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"articles": list})
}

func (a *API) AdminDeleteArticle(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		writeErr(w, 400, "invalid id")
		return
	}
	if err := a.Store.AdminDeleteArticle(r.Context(), id); err != nil {
		writeErr(w, 500, "delete failed")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

// prepareArticleInput validates and normalises the shared write payload.
func prepareArticleInput(in *store.ArticleInput) (string, bool) {
	in.Slug = strings.ToLower(strings.TrimSpace(in.Slug))
	if !validSlug(in.Slug) {
		return "slug must be lowercase letters, digits or dashes", false
	}
	if strings.TrimSpace(in.Title.Zh) == "" && strings.TrimSpace(in.Title.En) == "" {
		return "title is required", false
	}
	if in.Status == "" {
		in.Status = "draft"
	}
	switch in.Status {
	case "draft", "scheduled", "published":
	default:
		return "invalid status", false
	}
	if in.Date == "" {
		in.Date = time.Now().UTC().Format("2006-01-02")
	}
	if _, err := time.Parse("2006-01-02", in.Date); err != nil {
		return "date must be YYYY-MM-DD", false
	}
	if len(in.Pages) == 0 {
		return "article needs at least one page", false
	}
	if in.ReadingZh <= 0 {
		in.ReadingZh = 5
	}
	if in.ReadingEn <= 0 {
		in.ReadingEn = 4
	}
	for pi := range in.Pages {
		p := &in.Pages[pi]
		if p.Role == "" {
			p.Role = "content"
		}
		switch p.Role {
		case "cover", "content", "back_cover":
		default:
			return "invalid page role", false
		}
		for bi := range p.Blocks {
			b := &p.Blocks[bi]
			if len(b.Content) == 0 {
				b.Content = json.RawMessage(`{}`)
				continue
			}
			if !json.Valid(b.Content) {
				return "block content must be valid JSON", false
			}
		}
	}
	return "", true
}

// ------------------------------------------------------------- site pages

func (a *API) AdminSitePages(w http.ResponseWriter, r *http.Request) {
	list, err := a.Store.AdminSitePages(r.Context())
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"pages": list})
}

func (a *API) AdminCreateSitePage(w http.ResponseWriter, r *http.Request) {
	var body store.SitePagePatch
	if err := decode(r, &body); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	body.Slug = strings.ToLower(strings.TrimSpace(body.Slug))
	if !validSlug(body.Slug) {
		writeErr(w, 400, "invalid slug")
		return
	}
	if body.Status == "" {
		body.Status = "draft"
	}
	if body.Status != "draft" && body.Status != "published" {
		writeErr(w, 400, "invalid status")
		return
	}
	id, err := a.Store.AdminCreateSitePage(r.Context(), body)
	if err != nil {
		if isUniqueErr(err) {
			writeErr(w, 409, "slug already taken")
			return
		}
		writeErr(w, 500, "create failed")
		return
	}
	writeJSON(w, 200, map[string]any{"id": id})
}

func (a *API) AdminUpdateSitePage(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		writeErr(w, 400, "invalid id")
		return
	}
	var body store.SitePagePatch
	if err := decode(r, &body); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	body.Slug = strings.ToLower(strings.TrimSpace(body.Slug))
	if !validSlug(body.Slug) {
		writeErr(w, 400, "invalid slug")
		return
	}
	if err := a.Store.AdminUpdateSitePage(r.Context(), id, body); err != nil {
		if isUniqueErr(err) {
			writeErr(w, 409, "slug already taken")
			return
		}
		writeErr(w, 500, "update failed")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (a *API) AdminDeleteSitePage(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		writeErr(w, 400, "invalid id")
		return
	}
	if err := a.Store.AdminDeleteSitePage(r.Context(), id); err != nil {
		writeErr(w, 500, "delete failed")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

// --------------------------------------------------------------- settings

// settingKeys is the whitelist the console may write.
var settingKeys = map[string]bool{
	"site_name": true, "tagline_zh": true, "tagline_en": true,
	"announcement_zh": true, "announcement_en": true, "footer_note": true,
	"maintenance": true,
}

func (a *API) AdminGetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := a.Store.GetSettings(r.Context())
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"settings": settings})
}

func (a *API) AdminPutSettings(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Settings map[string]any `json:"settings"`
	}
	if err := decode(r, &req); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	filtered := map[string]any{}
	for k, v := range req.Settings {
		if !settingKeys[k] {
			continue
		}
		if s, ok := v.(string); ok && len(s) > 2000 {
			writeErr(w, 400, "value too long")
			return
		}
		filtered[k] = v
	}
	if len(filtered) == 0 {
		writeErr(w, 400, "no known settings provided")
		return
	}
	if err := a.Store.PutSettings(r.Context(), filtered); err != nil {
		writeErr(w, 500, "save failed")
		return
	}
	settings, _ := a.Store.GetSettings(r.Context())
	writeJSON(w, 200, map[string]any{"settings": settings})
}

// ------------------------------------------------------------- public reads

func (a *API) PublicSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := a.Store.GetSettings(r.Context())
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"settings": settings})
}

func (a *API) PublicSitePages(w http.ResponseWriter, r *http.Request) {
	list, err := a.Store.PublicSitePages(r.Context())
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	for i := range list {
		list[i].Body = ""
	}
	writeJSON(w, 200, map[string]any{"pages": list})
}

func (a *API) PublicSitePage(w http.ResponseWriter, r *http.Request) {
	page, err := a.Store.PublicSitePage(r.Context(), r.PathValue("slug"))
	if err != nil {
		writeErr(w, 404, "page not found")
		return
	}
	writeJSON(w, 200, map[string]any{"page": page})
}

func (a *API) PublicCategories(w http.ResponseWriter, r *http.Request) {
	list, err := a.Store.Categories(r.Context())
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"categories": list})
}
