package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port            string
	DatabaseURL     string
	RedisAddr       string
	RedisPassword   string
	RedisDB         int
	CookieSecure    bool
	SessionTTLHours int
	OTPTTLMinutes   int
	DevMode         bool
	SMTPHost        string
	SMTPPort        int
	SMTPUser        string
	SMTPPassword    string
	SMTPFrom        string
	AllowedOrigins  []string
	PublicOrigin    string
}

func get(key, def string) string {
	if v, osSet := os.LookupEnv(key); osSet && v != "" {
		return v
	}
	return def
}

func getInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func Load() *Config {
	return &Config{
		Port:            get("PORT", "8080"),
		DatabaseURL:     get("DATABASE_URL", "postgres://aifa:aifa_secret@localhost:5432/aifa?sslmode=disable"),
		RedisAddr:       get("REDIS_ADDR", "localhost:6379"),
		RedisPassword:   get("REDIS_PASSWORD", ""),
		RedisDB:         getInt("REDIS_DB", 0),
		CookieSecure:    get("COOKIE_SECURE", "false") == "true",
		SessionTTLHours: getInt("SESSION_TTL_HOURS", 24*30),
		OTPTTLMinutes:   getInt("OTP_TTL_MINUTES", 10),
		DevMode:         get("DEV_MODE", "true") == "true",
		SMTPHost:        get("SMTP_HOST", ""),
		SMTPPort:        getInt("SMTP_PORT", 587),
		SMTPUser:        get("SMTP_USER", ""),
		SMTPPassword:    get("SMTP_PASSWORD", ""),
		SMTPFrom:        get("SMTP_FROM", "AIFA <no-reply@aifa.one>"),
		AllowedOrigins:  strings.Split(get("ALLOWED_ORIGINS", "http://localhost:3000"), ","),
		PublicOrigin:    get("PUBLIC_ORIGIN", "http://localhost:3000"),
	}
}
