-- 0002_catalog.sql : research, academy, go-global

CREATE TABLE IF NOT EXISTS research_resources (
    id           BIGSERIAL PRIMARY KEY,
    slug         TEXT NOT NULL,
    category_zh  TEXT NOT NULL DEFAULT '',
    category_en  TEXT NOT NULL DEFAULT '',
    title_zh     TEXT NOT NULL,
    title_en     TEXT NOT NULL,
    desc_zh      TEXT NOT NULL DEFAULT '',
    desc_en      TEXT NOT NULL DEFAULT '',
    purpose_zh   TEXT NOT NULL DEFAULT '',
    purpose_en   TEXT NOT NULL DEFAULT '',
    scope_zh     TEXT NOT NULL DEFAULT '',
    scope_en     TEXT NOT NULL DEFAULT '',
    edition      TEXT NOT NULL DEFAULT '',
    published_at DATE,
    page_count   INT NOT NULL DEFAULT 0,
    access_level TEXT NOT NULL DEFAULT 'free',
    featured     BOOLEAN NOT NULL DEFAULT FALSE,
    cover        JSONB NOT NULL DEFAULT '{}'::jsonb,
    assets       JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS research_slug_key ON research_resources (slug);

CREATE TABLE IF NOT EXISTS research_leads (
    id          BIGSERIAL PRIMARY KEY,
    resource_id BIGINT REFERENCES research_resources(id) ON DELETE SET NULL,
    email       TEXT NOT NULL,
    name        TEXT NOT NULL DEFAULT '',
    company     TEXT NOT NULL DEFAULT '',
    job_title   TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academy_shelves (
    id          TEXT PRIMARY KEY,
    idx         TEXT NOT NULL,
    title_zh    TEXT NOT NULL,
    title_en    TEXT NOT NULL,
    desc_zh     TEXT NOT NULL DEFAULT '',
    desc_en     TEXT NOT NULL DEFAULT '',
    ord         INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS academy_courses (
    id            TEXT PRIMARY KEY,
    shelf_id      TEXT NOT NULL REFERENCES academy_shelves(id) ON DELETE CASCADE,
    name_zh       TEXT NOT NULL,
    name_en       TEXT NOT NULL,
    inst_zh       TEXT NOT NULL DEFAULT '',
    inst_en       TEXT NOT NULL DEFAULT '',
    position_zh   TEXT NOT NULL DEFAULT '',
    position_en   TEXT NOT NULL DEFAULT '',
    tag_zh        TEXT NOT NULL DEFAULT '',
    tag_en        TEXT NOT NULL DEFAULT '',
    fields        JSONB NOT NULL DEFAULT '[]'::jsonb,
    price         JSONB NOT NULL DEFAULT '{}'::jsonb,
    cover         JSONB NOT NULL DEFAULT '{}'::jsonb,
    action        TEXT NOT NULL DEFAULT 'consultation',
    relationship  TEXT NOT NULL DEFAULT 'certified-partner',
    ord           INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS academy_courses_shelf_idx ON academy_shelves (ord);
CREATE INDEX IF NOT EXISTS academy_courses_ord_idx ON academy_courses (shelf_id, ord);

CREATE TABLE IF NOT EXISTS go_global_activities (
    id        TEXT PRIMARY KEY,
    ord       INT NOT NULL DEFAULT 0,
    copy      JSONB NOT NULL DEFAULT '{}'::jsonb,
    services  JSONB NOT NULL DEFAULT '[]'::jsonb,
    hero      JSONB NOT NULL DEFAULT '{}'::jsonb,
    images    JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS site_videos (
    id       TEXT PRIMARY KEY,
    ord      INT NOT NULL DEFAULT 0,
    title_zh TEXT NOT NULL,
    title_en TEXT NOT NULL,
    summary_zh TEXT NOT NULL DEFAULT '',
    summary_en TEXT NOT NULL DEFAULT '',
    video    TEXT NOT NULL DEFAULT '',
    cover    TEXT NOT NULL DEFAULT ''
);
