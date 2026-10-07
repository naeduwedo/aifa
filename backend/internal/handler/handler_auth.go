package handler

import (
	"errors"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"github.com/aifa.one/backend/internal/auth"
	"github.com/aifa.one/backend/internal/middleware"
	"github.com/aifa.one/backend/internal/model"
	"github.com/aifa.one/backend/internal/store"
)

type otpRequest struct {
	Email  string `json:"email"`
	Locale string `json:"locale"`
}

type otpVerify struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

// RequestCode starts the passwordless sign-in flow.
func (a *API) RequestCode(w http.ResponseWriter, r *http.Request) {
	var req otpRequest
	if err := decode(r, &req); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if _, err := mail.ParseAddress(req.Email); err != nil {
		writeErr(w, 400, "invalid email")
		return
	}
	ok, err := a.Cache.RateLimit(r.Context(), "otp-request:"+req.Email, 5, 15*time.Minute)
	if err == nil && !ok {
		writeErr(w, 429, "too many codes requested, try later")
		return
	}
	code, err := a.Auth.IssueOTP(r.Context(), req.Email)
	if err != nil {
		writeErr(w, 500, "could not send the code")
		return
	}
	resp := map[string]any{"sent": true}
	if a.Cfg.DevMode {
		resp["devCode"] = code
	}
	writeJSON(w, 200, resp)
}

type registerRequest struct {
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
	Locale      string `json:"locale"`
}

// Register starts the sign-up flow: it issues an OTP and remembers the
// display name until VerifyCode creates the account.
func (a *API) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := decode(r, &req); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.DisplayName = strings.TrimSpace(req.DisplayName)
	if _, err := mail.ParseAddress(req.Email); err != nil {
		writeErr(w, 400, "invalid email")
		return
	}
	if req.DisplayName == "" || len(req.DisplayName) > 60 {
		writeErr(w, 400, "display name is required")
		return
	}
	if _, err := a.Store.GetUserByEmail(r.Context(), req.Email); err == nil {
		writeErr(w, 409, "account already exists — sign in instead")
		return
	} else if !errors.Is(err, store.ErrNotFound) {
		writeErr(w, 500, "lookup failed")
		return
	}
	ok, err := a.Cache.RateLimit(r.Context(), "otp-request:"+req.Email, 5, 15*time.Minute)
	if err == nil && !ok {
		writeErr(w, 429, "too many codes requested, try later")
		return
	}
	code, err := a.Auth.IssueOTP(r.Context(), req.Email)
	if err != nil {
		writeErr(w, 500, "could not send the code")
		return
	}
	a.Cache.SavePendingRegister(r.Context(), req.Email, req.DisplayName, 15*time.Minute)
	resp := map[string]any{"sent": true}
	if a.Cfg.DevMode {
		resp["devCode"] = code
	}
	writeJSON(w, 200, resp)
}

// VerifyCode exchanges the code for a session cookie.
func (a *API) VerifyCode(w http.ResponseWriter, r *http.Request) {
	var req otpVerify
	if err := decode(r, &req); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	ok, err := a.Auth.VerifyOTP(r.Context(), req.Email, req.Code)
	if err != nil {
		writeErr(w, 500, "verification failed")
		return
	}
	if !ok {
		writeErr(w, 401, "wrong or expired code")
		return
	}

	u, err := a.Store.GetUserByEmail(r.Context(), req.Email)
	if err == store.ErrNotFound {
		locale := lang(r)
		displayName := ""
		if pending := a.Cache.PendingRegister(r.Context(), req.Email); pending != "" {
			displayName = pending
			defer a.Cache.ClearPendingRegister(r.Context(), req.Email)
		}
		u, err = a.Store.CreateUser(r.Context(), req.Email, locale, displayName)
		if err != nil {
			writeErr(w, 500, "could not create account")
			return
		}
	} else if err != nil {
		writeErr(w, 500, "lookup failed")
		return
	}

	token, err := a.Auth.CreateSession(r.Context(), auth.SessionPayload{
		UserID: u.ID, Email: u.Email, Locale: u.Locale,
	})
	if err != nil {
		writeErr(w, 500, "could not start session")
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     auth.SessionCookie,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   a.Cfg.CookieSecure,
		MaxAge:   a.Cfg.SessionTTLHours * 3600,
	})
	writeJSON(w, 200, map[string]any{"account": publicUser(u)})
}

func publicUser(u *model.User) map[string]any {
	return map[string]any{
		"id": u.ID, "userNo": u.UserNo, "email": u.Email,
		"displayName": u.DisplayName, "title": u.Title,
		"avatarUrl": u.AvatarURL, "bio": u.Bio,
		"verified": u.Verified,
		"role": u.Role, "isAuthor": u.IsAuthor, "locale": u.Locale,
	}
}

// Me returns the current account or null.
func (a *API) Me(w http.ResponseWriter, r *http.Request) {
	u := middleware.UserFrom(r)
	if u == nil {
		writeJSON(w, 200, map[string]any{"account": nil})
		return
	}
	writeJSON(w, 200, map[string]any{"account": publicUser(u)})
}

// Logout clears the session cookie.
func (a *API) Logout(w http.ResponseWriter, r *http.Request) {
	if t := middleware.TokenFrom(r); t != "" {
		a.Auth.DestroySession(r.Context(), t)
	}
	http.SetCookie(w, &http.Cookie{
		Name: auth.SessionCookie, Value: "", Path: "/", HttpOnly: true, MaxAge: -1,
	})
	writeJSON(w, 200, map[string]any{"ok": true})
}

// UpdateProfile stores the display name / title shown next to comments.
func (a *API) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	u := middleware.UserFrom(r)
	if u == nil {
		writeErr(w, 401, "sign in required")
		return
	}
	var req struct {
		DisplayName string `json:"displayName"`
		Title       string `json:"title"`
		Bio         string `json:"bio"`
		AvatarURL   string `json:"avatarUrl"`
	}
	if err := decode(r, &req); err != nil {
		writeErr(w, 400, "invalid body")
		return
	}
	err := a.Store.UpdateProfile(r.Context(), u.ID,
		strings.TrimSpace(req.DisplayName),
		strings.TrimSpace(req.Title),
		strings.TrimSpace(req.Bio),
		strings.TrimSpace(req.AvatarURL))
	if err != nil {
		writeErr(w, 500, "update failed")
		return
	}
	updated, _ := a.Store.GetUserByID(r.Context(), u.ID)
	writeJSON(w, 200, map[string]any{"account": publicUser(updated)})
}
