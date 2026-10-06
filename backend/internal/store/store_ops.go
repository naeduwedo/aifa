package store

import (
	"context"
	"time"
)

func parseTime(s string) (time.Time, error) {
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}
	return time.Parse("2006-01-02 15:04:05.999999-07", s)
}

// ---------------------------------------------------------------- consult

type ConsultThread struct {
	ID        int64  `json:"id"`
	Topic     string `json:"topic"`
	Service   string `json:"service"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
}

func (s *Store) CreateConsult(ctx context.Context, topic, service, email string, userID int64) (int64, error) {
	var id int64
	err := s.DB.QueryRow(ctx, `
		INSERT INTO consult_threads (topic, service, user_id, email)
		VALUES ($1,$2,NULLIF($3,0),$4) RETURNING id`, topic, service, userID, email).Scan(&id)
	return id, err
}

func (s *Store) GetConsult(ctx context.Context, id int64) (*ConsultThread, error) {
	var t ConsultThread
	var uid *int64
	err := s.DB.QueryRow(ctx, `
		SELECT id, topic, service, status, created_at::text, user_id
		FROM consult_threads WHERE id=$1`, id).
		Scan(&t.ID, &t.Topic, &t.Service, &t.Status, &t.CreatedAt, &uid)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *Store) CloseConsult(ctx context.Context, id int64) error {
	_, err := s.DB.Exec(ctx, `UPDATE consult_threads SET status='closed', updated_at=now() WHERE id=$1`, id)
	return err
}

type ConsultMessage struct {
	ID        int64     `json:"id"`
	ThreadID  int64     `json:"threadId"`
	Author    string    `json:"author"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
}

func (s *Store) AddConsultMessage(ctx context.Context, threadID int64, author, body string) (ConsultMessage, error) {
	var m ConsultMessage
	var created string
	err := s.DB.QueryRow(ctx, `
		INSERT INTO consult_messages (thread_id, author, body) VALUES ($1,$2,$3)
		RETURNING id, created_at::text`, threadID, author, body).Scan(&m.ID, &created)
	if err != nil {
		return m, err
	}
	m.ThreadID = threadID
	m.Author = author
	m.Body = body
	m.CreatedAt, _ = parseTime(created)
	s.DB.Exec(ctx, `UPDATE consult_threads SET updated_at=now() WHERE id=$1`, threadID)
	return m, nil
}

func (s *Store) ListConsultMessages(ctx context.Context, threadID int64) ([]ConsultMessage, error) {
	rows, err := s.DB.Query(ctx, `
		SELECT id, thread_id, author, body, created_at::text
		FROM consult_messages WHERE thread_id=$1 ORDER BY id`, threadID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ConsultMessage
	for rows.Next() {
		var m ConsultMessage
		var created string
		if err := rows.Scan(&m.ID, &m.ThreadID, &m.Author, &m.Body, &created); err != nil {
			return nil, err
		}
		m.CreatedAt, _ = parseTime(created)
		out = append(out, m)
	}
	return out, rows.Err()
}

// ---------------------------------------------------------------- signups

func (s *Store) SubscribeNewsletter(ctx context.Context, email, topic string) error {
	_, err := s.DB.Exec(ctx, `
		INSERT INTO newsletter_subscribers (email, topic) VALUES ($1,$2)
		ON CONFLICT DO NOTHING`, email, topic)
	return err
}

func (s *Store) AddResearchLead(ctx context.Context, slug, email, name, company, job string) error {
	var id *int64
	s.DB.QueryRow(ctx, `SELECT id FROM research_resources WHERE slug=$1`, slug).Scan(&id)
	_, err := s.DB.Exec(ctx, `
		INSERT INTO research_leads (resource_id, email, name, company, job_title)
		VALUES ($1,$2,$3,$4,$5)`, id, email, name, company, job)
	return err
}

func (s *Store) AddFeedback(ctx context.Context, body, identity, url, ua string, userID *int64, attachments string) error {
	_, err := s.DB.Exec(ctx, `
		INSERT INTO feedback_messages (body, identity, context_url, user_agent, user_id, attachments)
		VALUES ($1,$2,$3,$4,$5,$6::jsonb)`, body, identity, url, ua, userID, attachments)
	return err
}

func (s *Store) RecordViews(ctx context.Context, day string, counts map[string]string) error {
	for k, v := range counts {
		// key format: path|lang
		path, lang := k, "en"
		for i := 0; i < len(k); i++ {
			if k[i] == '|' {
				path, lang = k[:i], k[i+1:]
				break
			}
		}
		if _, err := s.DB.Exec(ctx, `
			INSERT INTO page_views (path, lang, seen_on, hits) VALUES ($1,$2,$3::date,$4)
			ON CONFLICT (path, lang, seen_on) DO UPDATE SET hits = page_views.hits + $4`,
			path, lang, day, v); err != nil {
			return err
		}
	}
	return nil
}
