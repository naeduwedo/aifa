package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/aifa.one/backend/internal/middleware"
	"github.com/aifa.one/backend/internal/model"
)

// Shelf lists what the reader saved.
func (a *API) Shelf(w http.ResponseWriter, r *http.Request) {
	u := middleware.UserFrom(r)
	if u == nil {
		writeJSON(w, 200, map[string]any{"account": nil, "items": []any{}, "subscriptions": []any{}})
		return
	}
	items, err := a.Store.ListSaves(r.Context(), u.ID)
	if err != nil || items == nil {
		items = []model.ShelfItem{}
	}
	// attach article cards for saved essays
	for i := range items {
		if items[i].Kind == "article" {
			if detail, err := a.Store.ArticleDetail(r.Context(), items[i].TargetID); err == nil {
				card := model.Card{
					ArticleID: detail.ID,
					Slug:      detail.Slug,
					Title:     detail.Title,
					Date:      detail.Date,
					Href:      "/u/" + detail.Slug,
					Summary:   detail.Intro,
					Status:    "published",
					CoverImage: detail.CoverImage,
				}
				items[i].Card = &card
			}
		}
	}
	subs, err := a.Store.ListSubscriptions(r.Context(), u.ID)
	if err != nil || subs == nil {
		subs = []model.AuthorProfile{}
	}
	writeJSON(w, 200, map[string]any{"account": publicUser(u), "items": items, "subscriptions": subs})
}

// SaveAdd puts a piece on the bookshelf.
func (a *API) SaveAdd(w http.ResponseWriter, r *http.Request) {
	u := middleware.UserFrom(r)
	if u == nil {
		writeErr(w, 401, "sign in required")
		return
	}
	var req struct {
		Kind     string `json:"kind"`
		TargetID string `json:"targetId"`
		PageNo   int    `json:"pageNo"`
		Progress int    `json:"progress"`
	}
	if err := decode(r, &req); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	if req.Kind == "" {
		req.Kind = "article"
	}
	if req.TargetID == "" {
		writeErr(w, 400, "targetId required")
		return
	}
	if err := a.Store.UpsertSave(r.Context(), u.ID, req.Kind, req.TargetID, req.PageNo, req.Progress); err != nil {
		writeErr(w, 500, "could not save")
		return
	}
	writeJSON(w, 200, map[string]any{"saved": true})
}

// SaveRemove drops a piece from the bookshelf.
func (a *API) SaveRemove(w http.ResponseWriter, r *http.Request) {
	u := middleware.UserFrom(r)
	if u == nil {
		writeErr(w, 401, "sign in required")
		return
	}
	kind := r.PathValue("kind")
	target := r.PathValue("target")
	if err := a.Store.DeleteSave(r.Context(), u.ID, kind, target); err != nil {
		writeErr(w, 500, "could not remove")
		return
	}
	writeJSON(w, 200, map[string]any{"saved": false})
}

// Progress stores reading position.
func (a *API) Progress(w http.ResponseWriter, r *http.Request) {
	u := middleware.UserFrom(r)
	if u == nil {
		writeErr(w, 401, "sign in required")
		return
	}
	var req struct {
		Slug     string `json:"slug"`
		Page     int    `json:"page"`
		Percent  int    `json:"percent"`
		Finished bool   `json:"finished"`
	}
	if err := decode(r, &req); err != nil || req.Slug == "" {
		writeErr(w, 400, "invalid body")
		return
	}
	if err := a.Store.SaveProgress(r.Context(), u.ID, req.Slug, req.Page, req.Percent, req.Finished); err != nil {
		writeErr(w, 404, "article not found")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

// Subscribe toggles a column subscription.
func (a *API) Subscribe(w http.ResponseWriter, r *http.Request) {
	u := middleware.UserFrom(r)
	if u == nil {
		writeErr(w, 401, "sign in required")
		return
	}
	authorID, _ := strconv.ParseInt(r.PathValue("no"), 10, 64)
	profile, err := a.Store.AuthorByNo(r.Context(), authorID)
	if err != nil {
		writeErr(w, 404, "author not found")
		return
	}
	if r.Method == http.MethodDelete {
		a.Store.Unsubscribe(r.Context(), u.ID, profile.ID)
		writeJSON(w, 200, map[string]any{"subscribed": false})
		return
	}
	if err := a.Store.Subscribe(r.Context(), u.ID, profile.ID); err != nil {
		writeErr(w, 500, "could not subscribe")
		return
	}
	writeJSON(w, 200, map[string]any{"subscribed": true})
}

// Comments lists a thread.
func (a *API) Comments(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	list, err := a.Store.Comments(r.Context(), slug)
	if err != nil {
		writeErr(w, 404, "article not found")
		return
	}
	if list == nil {
		list = []model.Comment{}
	}
	writeJSON(w, 200, map[string]any{"comments": list})
}

// AddComment posts one comment.
func (a *API) AddComment(w http.ResponseWriter, r *http.Request) {
	u := middleware.UserFrom(r)
	if u == nil {
		writeErr(w, 401, "sign in required to comment")
		return
	}
	var req struct {
		Body     string `json:"body"`
		ParentID int64  `json:"parentId"`
	}
	if err := decode(r, &req); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	req.Body = strings.TrimSpace(req.Body)
	if req.Body == "" {
		writeErr(w, 400, "empty comment")
		return
	}
	if len([]rune(req.Body)) > 300 {
		writeErr(w, 400, "comment is limited to 300 characters")
		return
	}
	c, err := a.Store.AddComment(r.Context(), r.PathValue("slug"), u.ID, req.ParentID, req.Body)
	if err != nil {
		writeErr(w, 404, "article not found")
		return
	}
	writeJSON(w, 200, map[string]any{"comment": c})
}

// DeleteComment removes the reader's own comment.
func (a *API) DeleteComment(w http.ResponseWriter, r *http.Request) {
	u := middleware.UserFrom(r)
	if u == nil {
		writeErr(w, 401, "sign in required")
		return
	}
	id, _ := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err := a.Store.DeleteComment(r.Context(), id, u.ID); err != nil {
		writeErr(w, 404, "not found")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}
