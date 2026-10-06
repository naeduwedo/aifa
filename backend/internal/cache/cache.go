package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type Cache struct {
	Client *redis.Client
}

func Connect(addr, password string, db int) (*Cache, error) {
	client := redis.NewClient(&redis.Options{Addr: addr, Password: password, DB: db})
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis ping: %w", err)
	}
	return &Cache{Client: client}, nil
}

// ---- one time codes (email sign-in) -------------------------------------

func (c *Cache) SaveOTP(ctx context.Context, email, code string, ttl time.Duration) error {
	key := "otp:" + email
	if err := c.Client.Set(ctx, key, code, ttl).Err(); err != nil {
		return err
	}
	// send attempts are limited separately so a code cannot be brute forced
	return c.Client.Set(ctx, "otp:attempts:"+email, 0, ttl).Err()
}

func (c *Cache) VerifyOTP(ctx context.Context, email, code string) (bool, error) {
	attemptsKey := "otp:attempts:" + email
	n, err := c.Client.Incr(ctx, attemptsKey).Result()
	if err != nil {
		return false, err
	}
	if n > 5 {
		c.Client.Del(ctx, "otp:"+email, attemptsKey)
		return false, nil
	}
	stored, err := c.Client.Get(ctx, "otp:"+email).Result()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if stored != code {
		return false, nil
	}
	c.Client.Del(ctx, "otp:"+email, attemptsKey)
	return true, nil
}

// ---- sessions ------------------------------------------------------------

func (c *Cache) SaveSession(ctx context.Context, token string, payload any, ttl time.Duration) error {
	b, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	return c.Client.Set(ctx, "session:"+token, b, ttl).Err()
}

func (c *Cache) LoadSession(ctx context.Context, token string, dest any) error {
	b, err := c.Client.Get(ctx, "session:"+token).Bytes()
	if err != nil {
		return err
	}
	return json.Unmarshal(b, dest)
}

func (c *Cache) TouchSession(ctx context.Context, token string, ttl time.Duration) error {
	return c.Client.Expire(ctx, "session:"+token, ttl).Err()
}

func (c *Cache) DeleteSession(ctx context.Context, token string) error {
	return c.Client.Del(ctx, "session:"+token).Err()
}

// ---- rate limiting -------------------------------------------------------

func (c *Cache) RateLimit(ctx context.Context, key string, limit int, window time.Duration) (bool, error) {
	k := "rl:" + key
	n, err := c.Client.Incr(ctx, k).Result()
	if err != nil {
		return false, err
	}
	if n == 1 {
		c.Client.Expire(ctx, k, window)
	}
	return n <= int64(limit), nil
}

// ---- page view counters --------------------------------------------------

func (c *Cache) CountView(ctx context.Context, path, lang string) error {
	return c.Client.HIncrBy(ctx, "views:"+time.Now().UTC().Format("2006-01-02"), path+"|"+lang, 1).Err()
}

func (c *Cache) TakeViews(ctx context.Context, day string) (map[string]string, error) {
	key := "views:" + day
	vals, err := c.Client.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, err
	}
	if len(vals) > 0 {
		c.Client.Del(ctx, key)
	}
	return vals, nil
}

// ---- page payload cache --------------------------------------------------

func (c *Cache) GetJSON(ctx context.Context, key string, dest any) bool {
	b, err := c.Client.Get(ctx, key).Bytes()
	if err != nil {
		return false
	}
	return json.Unmarshal(b, dest) == nil
}

func (c *Cache) SetJSON(ctx context.Context, key string, v any, ttl time.Duration) {
	b, err := json.Marshal(v)
	if err != nil {
		return
	}
	c.Client.Set(ctx, key, b, ttl)
}

func (c *Cache) Invalidate(ctx context.Context, pattern string) {
	iter := c.Client.Scan(ctx, 0, pattern, 100).Iterator()
	for iter.Next(ctx) {
		c.Client.Del(ctx, iter.Val())
	}
}

// ---- advisory chat: keep the live transcript hot -------------------------

func (c *Cache) PushConsult(ctx context.Context, threadID int64, payload any) error {
	b, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	key := fmt.Sprintf("consult:%d", threadID)
	c.Client.LPush(ctx, key, b)
	c.Client.LTrim(ctx, key, 0, 99)
	c.Client.Expire(ctx, key, 24*time.Hour)
	return nil
}

func (c *Cache) RecentConsult(ctx context.Context, threadID int64, n int64) []json.RawMessage {
	key := fmt.Sprintf("consult:%d", threadID)
	vals, err := c.Client.LRange(ctx, key, 0, n-1).Result()
	if err != nil {
		return nil
	}
	out := make([]json.RawMessage, 0, len(vals))
	for i := len(vals) - 1; i >= 0; i-- {
		out = append(out, json.RawMessage(vals[i]))
	}
	return out
}
