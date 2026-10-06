-- 0003_social.sql : comments, consult, newsletter, feedback

CREATE TABLE IF NOT EXISTS comments (
    id          BIGSERIAL PRIMARY KEY,
    article_id  BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    block_id    TEXT NOT NULL DEFAULT '',
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id   BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted     BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS comments_article_idx ON comments (article_id, created_at DESC);

CREATE TABLE IF NOT EXISTS consult_threads (
    id          BIGSERIAL PRIMARY KEY,
    topic       TEXT NOT NULL,               -- academy | go-global
    service     TEXT NOT NULL DEFAULT '',
    user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    email       TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'open', -- open | closed
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consult_threads_user_idx ON consult_threads (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS consult_messages (
    id         BIGSERIAL PRIMARY KEY,
    thread_id  BIGINT NOT NULL REFERENCES consult_threads(id) ON DELETE CASCADE,
    author     TEXT NOT NULL,                -- visitor | adviser
    body       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consult_messages_thread_idx ON consult_messages (thread_id, id);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id         BIGSERIAL PRIMARY KEY,
    email      TEXT NOT NULL,
    topic      TEXT NOT NULL DEFAULT 'research',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_unique ON newsletter_subscribers (email, topic);

CREATE TABLE IF NOT EXISTS feedback_messages (
    id           BIGSERIAL PRIMARY KEY,
    body         TEXT NOT NULL,
    identity     TEXT NOT NULL DEFAULT 'anonymous',
    user_id      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    context_url  TEXT NOT NULL DEFAULT '',
    user_agent   TEXT NOT NULL DEFAULT '',
    attachments  JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_views (
    id         BIGSERIAL PRIMARY KEY,
    path       TEXT NOT NULL,
    lang       TEXT NOT NULL DEFAULT 'en',
    seen_on    DATE NOT NULL DEFAULT CURRENT_DATE,
    hits       BIGINT NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS page_views_unique ON page_views (path, lang, seen_on);
