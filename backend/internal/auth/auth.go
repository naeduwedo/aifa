package auth

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"net/smtp"
	"time"

	"github.com/aifa.one/backend/internal/cache"
	"github.com/aifa.one/backend/internal/config"
)

const SessionCookie = "aifa_session"

type SessionPayload struct {
	UserID int64  `json:"userId"`
	Email  string `json:"email"`
	Locale string `json:"locale"`
}

type Service struct {
	Cache *cache.Cache
	Cfg   *config.Config
}

func New(c *cache.Cache, cfg *config.Config) *Service { return &Service{Cache: c, Cfg: cfg} }

func randomToken(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}

// IssueOTP creates a 6 digit code, stores it in Redis and delivers it by mail.
func (s *Service) IssueOTP(ctx context.Context, email string) (string, error) {
	code := ""
	b := make([]byte, 4)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	n := int(binary.BigEndian.Uint32(b)) % 1000000
	code = fmt.Sprintf("%06d", n)

	ttl := time.Duration(s.Cfg.OTPTTLMinutes) * time.Minute
	if err := s.Cache.SaveOTP(ctx, email, code, ttl); err != nil {
		return "", err
	}
	subject := "Your AIFA sign-in code"
	body := fmt.Sprintf("Your AIFA sign-in code is %s. It expires in %d minutes.\n\nIf you did not request it, ignore this email.", code, s.Cfg.OTPTTLMinutes)
	if err := s.deliver(email, subject, body); err != nil {
		log.Printf("otp mail: %v", err)
	}
	return code, nil
}

func (s *Service) deliver(to, subject, body string) error {
	if s.Cfg.SMTPHost == "" {
		if s.Cfg.DevMode {
			log.Printf("[dev mail] to=%s subject=%q\n%s", to, subject, body)
			return nil
		}
		return errors.New("smtp not configured")
	}
	addr := fmt.Sprintf("%s:%d", s.Cfg.SMTPHost, s.Cfg.SMTPPort)
	msg := []byte(fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		s.Cfg.SMTPFrom, to, subject, body))
	var auth smtp.Auth
	if s.Cfg.SMTPUser != "" {
		auth = smtp.PlainAuth("", s.Cfg.SMTPUser, s.Cfg.SMTPPassword, s.Cfg.SMTPHost)
	}
	return smtp.SendMail(addr, auth, s.Cfg.SMTPFrom, []string{to}, msg)
}

// DevOTP exposes the last issued code so the local demo can sign in without SMTP.
func (s *Service) DevOTP(ctx context.Context, email string) string {
	v, err := s.Cache.Client.Get(ctx, "otp:"+email).Result()
	if err != nil {
		return ""
	}
	return v
}

func (s *Service) VerifyOTP(ctx context.Context, email, code string) (bool, error) {
	return s.Cache.VerifyOTP(ctx, email, code)
}

func (s *Service) CreateSession(ctx context.Context, p SessionPayload) (string, error) {
	token := randomToken(32)
	ttl := time.Duration(s.Cfg.SessionTTLHours) * time.Hour
	if err := s.Cache.SaveSession(ctx, token, p, ttl); err != nil {
		return "", err
	}
	return token, nil
}

func (s *Service) ReadSession(ctx context.Context, token string) (*SessionPayload, error) {
	if token == "" {
		return nil, errors.New("missing token")
	}
	var p SessionPayload
	if err := s.Cache.LoadSession(ctx, token, &p); err != nil {
		return nil, err
	}
	ttl := time.Duration(s.Cfg.SessionTTLHours) * time.Hour
	s.Cache.TouchSession(ctx, token, ttl)
	return &p, nil
}

func (s *Service) DestroySession(ctx context.Context, token string) error {
	return s.Cache.DeleteSession(ctx, token)
}

func Equal(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}
