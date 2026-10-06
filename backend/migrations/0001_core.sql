-- 0001_core.sql : accounts, sessions, articles, bookshelf

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    user_no       BIGSERIAL,
    email         TEXT NOT NULL,
    display_name  TEXT NOT NULL DEFAULT '',
    title         TEXT NOT NULL DEFAULT '',
    avatar_url    TEXT NOT NULL DEFAULT '',
    bio           TEXT NOT NULL DEFAULT '',
    role          TEXT NOT NULL DEFAULT 'reader',   -- reader | author | admin
    verified      BOOLEAN NOT NULL DEFAULT FALSE,
    locale        TEXT NOT NULL DEFAULT 'en',
    is_author     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_user_no_key ON users (user_no);

CREATE TABLE IF NOT EXISTS sessions (
    id          BIGSERIAL PRIMARY KEY,
    token_hash  TEXT NOT NULL,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_agent  TEXT NOT NULL DEFAULT '',
    ip          TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_key ON sessions (token_hash);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);

CREATE TABLE IF NOT EXISTS articles (
    id             BIGSERIAL PRIMARY KEY,
    slug           TEXT NOT NULL,               -- short address, e.g. "a4"
    author_id      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    date           DATE NOT NULL,
    status         TEXT NOT NULL DEFAULT 'draft', -- draft | scheduled | published
    issue_no       INT NOT NULL DEFAULT 0,
    kicker_zh      TEXT NOT NULL DEFAULT '',
    kicker_en      TEXT NOT NULL DEFAULT '',
    title_zh       TEXT NOT NULL,
    title_en       TEXT NOT NULL,
    dek_zh         TEXT NOT NULL DEFAULT '',
    dek_en         TEXT NOT NULL DEFAULT '',
    cover_image    TEXT NOT NULL DEFAULT '',
    cover_accent   TEXT NOT NULL DEFAULT '#111111',
    back_cover     JSONB NOT NULL DEFAULT '{}'::jsonb,
    reading_zh     INT NOT NULL DEFAULT 0,
    reading_en     INT NOT NULL DEFAULT 0,
    interaction    JSONB NOT NULL DEFAULT '{"assistant":true,"comments":true,"share":true}'::jsonb,
    view_count     BIGINT NOT NULL DEFAULT 0,
    published_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_key ON articles (slug);
CREATE INDEX IF NOT EXISTS articles_date_idx ON articles (date DESC);
CREATE INDEX IF NOT EXISTS articles_status_date_idx ON articles (status, date DESC);

CREATE TABLE IF NOT EXISTS article_pages (
    id          BIGSERIAL PRIMARY KEY,
    article_id  BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    page_no     INT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'content',  -- cover | content | back_cover
    section_zh  TEXT NOT NULL DEFAULT '',
    section_en  TEXT NOT NULL DEFAULT '',
    title_zh    TEXT NOT NULL DEFAULT '',
    title_en    TEXT NOT NULL DEFAULT '',
    dek_zh      TEXT NOT NULL DEFAULT '',
    dek_en      TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS article_pages_article_idx ON article_pages (article_id, page_no);
CREATE UNIQUE INDEX IF NOT EXISTS article_pages_unique ON article_pages (article_id, page_no);

CREATE TABLE IF NOT EXISTS blocks (
    id          BIGSERIAL PRIMARY KEY,
    article_id  BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    page_id     BIGINT NOT NULL REFERENCES article_pages(id) ON DELETE CASCADE,
    block_no    TEXT NOT NULL,
    ord         INT NOT NULL DEFAULT 0,
    type        TEXT NOT NULL,
    variant     TEXT NOT NULL DEFAULT '',
    class_name  TEXT NOT NULL DEFAULT 'text',
    width       TEXT NOT NULL DEFAULT 'full',
    rows        INT NOT NULL DEFAULT 0,
    preset      TEXT NOT NULL DEFAULT '',
    content     JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS blocks_page_idx ON blocks (page_id, ord);
CREATE INDEX IF NOT EXISTS blocks_article_idx ON blocks (article_id);

CREATE TABLE IF NOT EXISTS article_sources (
    id           BIGSERIAL PRIMARY KEY,
    article_id   BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    source_key   TEXT NOT NULL,
    url          TEXT NOT NULL DEFAULT '',
    name_zh      TEXT NOT NULL DEFAULT '',
    name_en      TEXT NOT NULL DEFAULT '',
    title_zh     TEXT NOT NULL DEFAULT '',
    title_en     TEXT NOT NULL DEFAULT '',
    published_at TEXT NOT NULL DEFAULT '',
    ord          INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS article_sources_article_idx ON article_sources (article_id, ord);

-- bookshelf -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saves (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL DEFAULT 'article',  -- article | collection | resource
    target_id   TEXT NOT NULL,
    page_no     INT NOT NULL DEFAULT 0,
    progress    INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS saves_unique ON saves (user_id, kind, target_id);
CREATE INDEX IF NOT EXISTS saves_user_idx ON saves (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS subscriptions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_unique ON subscriptions (user_id, author_id);

CREATE TABLE IF NOT EXISTS reading_progress (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id  BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    page_no     INT NOT NULL DEFAULT 1,
    percent     INT NOT NULL DEFAULT 0,
    finished    BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS reading_progress_unique ON reading_progress (user_id, article_id);
