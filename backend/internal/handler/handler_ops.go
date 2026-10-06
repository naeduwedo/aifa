package handler

import (
	"encoding/json"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"github.com/aifa.one/backend/internal/middleware"
	"github.com/aifa.one/backend/internal/model"
	"github.com/aifa.one/backend/internal/store"
)

// canned adviser replies keyed by topic; the frontend shows them as "common questions"
var consultGreetings = map[string]model.Text{
	"academy": model.Text{
		Zh: "你好，这里是学院咨询台。请告诉我们你在为谁选课：中学生、职场人，还是证书与学分方向。",
		En: "Hello, this is the Academy advisory desk. Tell us who you are choosing for: a teenager, yourself, or a certificate and credits path.",
	},
	"go-global": model.Text{
		Zh: "你好，这里是出海咨询台。想了解年度出海行程，还是企业落地与市场进入的建议？",
		En: "Hello, this is the Go Global advisory desk. Are you asking about this year's delegation trip, or about entering a new market with your company?",
	},
}

// CreateConsult starts an advisory conversation.
func (a *API) CreateConsult(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Topic   string `json:"topic"`
		Service string `json:"service"`
		Email   string `json:"email"`
	}
	if err := decode(r, &req); err != nil || req.Topic == "" {
		writeErr(w, 400, "invalid body")
		return
	}
	if req.Topic != "academy" && req.Topic != "go-global" {
		req.Topic = "academy"
	}
	var userID int64
	if u := middleware.UserFrom(r); u != nil {
		userID = u.ID
		if req.Email == "" {
			req.Email = u.Email
		}
	}
	id, err := a.Store.CreateConsult(r.Context(), req.Topic, req.Service, req.Email, userID)
	if err != nil {
		writeErr(w, 500, "could not open the conversation")
		return
	}
	greeting := consultGreetings[req.Topic]
	msg, err := a.Store.AddConsultMessage(r.Context(), id, "adviser", greeting.At(lang(r)))
	if err == nil {
		a.Cache.PushConsult(r.Context(), id, msg)
	}
	writeJSON(w, 200, map[string]any{"threadId": id, "greeting": greeting})
}

// ConsultMessages reads a conversation.
func (a *API) ConsultMessages(w http.ResponseWriter, r *http.Request) {
	id, _ := parseID(r.PathValue("id"))
	thread, err := a.Store.GetConsult(r.Context(), id)
	if err != nil {
		writeErr(w, 404, "conversation not found")
		return
	}
	msgs, err := a.Store.ListConsultMessages(r.Context(), id)
	if err != nil || msgs == nil {
		msgs = []store.ConsultMessage{}
	}
	writeJSON(w, 200, map[string]any{
		"thread": thread, "messages": msgs, "greeting": consultGreetings[thread.Topic],
	})
}

// ConsultReply adds a visitor message and answers from the FAQ when it matches.
func (a *API) ConsultReply(w http.ResponseWriter, r *http.Request) {
	id, _ := parseID(r.PathValue("id"))
	thread, err := a.Store.GetConsult(r.Context(), id)
	if err != nil {
		writeErr(w, 404, "conversation not found")
		return
	}
	if thread.Status == "closed" {
		writeErr(w, 409, "conversation closed")
		return
	}
	var req struct {
		Body string `json:"body"`
	}
	if err := decode(r, &req); err != nil || strings.TrimSpace(req.Body) == "" {
		writeErr(w, 400, "empty message")
		return
	}
	m, err := a.Store.AddConsultMessage(r.Context(), id, "visitor", strings.TrimSpace(req.Body))
	if err != nil {
		writeErr(w, 500, "could not save")
		return
	}
	a.Cache.PushConsult(r.Context(), id, m)

	// a real adviser replies asynchronously; here we acknowledge immediately
	time.Sleep(150 * time.Millisecond)
	ack := store.ConsultMessage{
		ThreadID: id, Author: "adviser",
		Body:      "Thanks — an AIFA adviser has your message and will reply here shortly.",
		CreatedAt: time.Now().UTC(),
	}
	if lang(r) == "zh" {
		ack.Body = "已收到，AIFA 顾问会在这里尽快回复你。"
	}
	if saved, err := a.Store.AddConsultMessage(r.Context(), id, "adviser", ack.Body); err == nil {
		ack = saved
		a.Cache.PushConsult(r.Context(), id, ack)
	}
	writeJSON(w, 200, map[string]any{"message": m, "reply": ack})
}

// ConsultClose locks the thread.
func (a *API) ConsultClose(w http.ResponseWriter, r *http.Request) {
	id, _ := parseID(r.PathValue("id"))
	if err := a.Store.CloseConsult(r.Context(), id); err != nil {
		writeErr(w, 404, "conversation not found")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

// Newsletter registers an email on the research list.
func (a *API) Newsletter(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
		Topic string `json:"topic"`
	}
	if err := decode(r, &req); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if _, err := mail.ParseAddress(req.Email); err != nil {
		writeErr(w, 400, "invalid email")
		return
	}
	if req.Topic == "" {
		req.Topic = "research"
	}
	if err := a.Store.SubscribeNewsletter(r.Context(), req.Email, req.Topic); err != nil {
		writeErr(w, 500, "could not subscribe")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

// ResearchLead stores download details and returns the asset list.
func (a *API) ResearchLead(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	var req struct {
		Email    string `json:"email"`
		Name     string `json:"name"`
		Company  string `json:"company"`
		JobTitle string `json:"jobTitle"`
	}
	if err := decode(r, &req); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if _, err := mail.ParseAddress(req.Email); err != nil {
		writeErr(w, 400, "invalid email")
		return
	}
	if err := a.Store.AddResearchLead(r.Context(), slug, req.Email, req.Name, req.Company, req.JobTitle); err != nil {
		writeErr(w, 500, "could not record the request")
		return
	}
	list, _ := a.Store.Research(r.Context())
	for _, res := range list {
		if res.Slug == slug {
			writeJSON(w, 200, map[string]any{"ready": true, "assets": res.Assets, "title": res.Title})
			return
		}
	}
	writeJSON(w, 200, map[string]any{"ready": true, "assets": []any{}})
}

// Feedback stores a message from the About page.
func (a *API) Feedback(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Body        string   `json:"body"`
		Identity    string   `json:"identity"`
		ContextURL  string   `json:"contextUrl"`
		Attachments []string `json:"attachments"`
	}
	if err := decode(r, &req); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	req.Body = strings.TrimSpace(req.Body)
	if req.Body == "" {
		writeErr(w, 400, "empty message")
		return
	}
	if req.Identity != "signed" {
		req.Identity = "anonymous"
	}
	var userID *int64
	if u := middleware.UserFrom(r); u != nil && req.Identity == "signed" {
		userID = &u.ID
	}
	if len(req.Attachments) > 4 {
		req.Attachments = req.Attachments[:4]
	}
	att, _ := json.Marshal(req.Attachments)
	if err := a.Store.AddFeedback(r.Context(), req.Body, req.Identity, req.ContextURL,
		r.UserAgent(), userID, string(att)); err != nil {
		writeErr(w, 500, "could not send")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

// Track counts page views in Redis; a background job flushes them into Postgres.
func (a *API) Track(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Path string `json:"path"`
		Lang string `json:"lang"`
	}
	if err := decode(r, &req); err != nil || req.Path == "" {
		writeErr(w, 400, "invalid body")
		return
	}
	if req.Lang != "zh" {
		req.Lang = "en"
	}
	a.Cache.CountView(r.Context(), req.Path, req.Lang)
	writeJSON(w, 200, map[string]any{"ok": true})
}

func parseID(v string) (int64, error) {
	var n int64
	for i := 0; i < len(v); i++ {
		if v[i] < '0' || v[i] > '9' {
			continue
		}
		n = n*10 + int64(v[i]-'0')
	}
	return n, nil
}
