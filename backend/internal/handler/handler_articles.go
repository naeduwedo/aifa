package handler

import (
	"net/http"
	"strconv"

	"github.com/aifa.one/backend/internal/middleware"
	"github.com/aifa.one/backend/internal/store"
)

// canEditArticle: admins may touch anything, writers only their own drafts.
func canEditArticle(r *http.Request, meta *store.ArticleMeta) bool {
	u := middleware.UserFrom(r)
	if u == nil {
		return false
	}
	if u.Role == "admin" {
		return true
	}
	return meta.AuthorID != nil && *meta.AuthorID == u.ID
}

// CreateArticle publishes a new issue for the signed-in writer.
func (a *API) CreateArticle(w http.ResponseWriter, r *http.Request) {
	u := middleware.UserFrom(r)
	var in store.ArticleInput
	if err := decode(r, &in); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	if msg, ok := prepareArticleInput(&in); !ok {
		writeErr(w, 400, msg)
		return
	}
	if u.Role == "admin" {
		if in.AuthorID == nil {
			in.AuthorID = &u.ID
		}
	} else {
		in.AuthorID = &u.ID
	}
	id, err := a.Store.CreateArticle(r.Context(), in)
	if err != nil {
		if isUniqueErr(err) {
			writeErr(w, 409, "slug already taken")
			return
		}
		writeErr(w, 500, "create failed")
		return
	}
	writeJSON(w, 200, map[string]any{"id": id, "slug": in.Slug})
}

// UpdateArticle replaces metadata, pages, blocks and sources.
func (a *API) UpdateArticle(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		writeErr(w, 400, "invalid id")
		return
	}
	meta, err := a.Store.ArticleMeta(r.Context(), id)
	if err != nil {
		writeErr(w, 404, "article not found")
		return
	}
	if !canEditArticle(r, meta) {
		writeErr(w, 403, "not your article")
		return
	}
	var in store.ArticleInput
	if err := decode(r, &in); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	if msg, ok := prepareArticleInput(&in); !ok {
		writeErr(w, 400, msg)
		return
	}
	if middleware.UserFrom(r).Role == "admin" && in.AuthorID == nil {
		in.AuthorID = meta.AuthorID
	} else if middleware.UserFrom(r).Role != "admin" {
		in.AuthorID = meta.AuthorID
	}
	if err := a.Store.UpdateArticle(r.Context(), id, in); err != nil {
		if isUniqueErr(err) {
			writeErr(w, 409, "slug already taken")
			return
		}
		writeErr(w, 500, "update failed")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "slug": in.Slug})
}

// DeleteArticle removes an issue the writer owns (admins: any).
func (a *API) DeleteArticle(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		writeErr(w, 400, "invalid id")
		return
	}
	meta, err := a.Store.ArticleMeta(r.Context(), id)
	if err != nil {
		writeErr(w, 404, "article not found")
		return
	}
	if !canEditArticle(r, meta) {
		writeErr(w, 403, "not your article")
		return
	}
	if err := a.Store.AdminDeleteArticle(r.Context(), id); err != nil {
		writeErr(w, 500, "delete failed")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

// EditArticle returns everything the editor form needs for one issue.
func (a *API) EditArticle(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.URL.Query().Get("id"), 10, 64)
	if err != nil || id <= 0 {
		writeErr(w, 400, "invalid id")
		return
	}
	meta, err := a.Store.ArticleMeta(r.Context(), id)
	if err != nil {
		writeErr(w, 404, "article not found")
		return
	}
	if !canEditArticle(r, meta) {
		writeErr(w, 403, "not your article")
		return
	}
	detail, err := a.Store.ArticleDetail(r.Context(), meta.Slug)
	if err != nil {
		writeErr(w, 404, "article not found")
		return
	}
	writeJSON(w, 200, map[string]any{"article": detail, "meta": meta})
}

// MyArticles lists the writer's own issues in any status.
func (a *API) MyArticles(w http.ResponseWriter, r *http.Request) {
	u := middleware.UserFrom(r)
	list, err := a.Store.AdminArticles(r.Context(), r.URL.Query().Get("status"), "", &u.ID)
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"articles": list})
}
