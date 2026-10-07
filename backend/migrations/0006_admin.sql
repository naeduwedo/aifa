-- admin console: categories, editorial columns, managed site pages, settings.

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_zh TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  ord INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',          -- active | hidden
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_columns (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_zh TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  desc_zh TEXT NOT NULL DEFAULT '',
  desc_en TEXT NOT NULL DEFAULT '',
  author_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  ord INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',          -- active | hidden
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_pages (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_zh TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  summary_zh TEXT NOT NULL DEFAULT '',
  summary_en TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',                  -- paragraphs separated by blank lines
  status TEXT NOT NULL DEFAULT 'draft',           -- draft | published
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'null'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE articles ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS column_id BIGINT REFERENCES site_columns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS articles_category_idx ON articles (category_id);
CREATE INDEX IF NOT EXISTS articles_column_idx ON articles (column_id);

-- bootstrap administrator (sign-in by email OTP); keep out of the columnist roster
INSERT INTO users (email, display_name, title, bio, role, verified, locale, is_author)
VALUES ('admin@aifa.one', '站点管理员', 'Administrator', 'Console access.', 'admin', TRUE, 'zh', FALSE)
ON CONFLICT (email) DO NOTHING;
UPDATE users SET role='admin', verified=TRUE WHERE lower(email)='admin@aifa.one';

INSERT INTO categories (slug, name_zh, name_en, ord) VALUES
  ('strategy', '战略', 'Strategy', 1),
  ('technology', '科技', 'Technology', 2),
  ('markets', '市场', 'Markets', 3),
  ('policy', '政策', 'Policy', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO site_settings (key, value) VALUES
  ('site_name', to_jsonb('AIFA'::text)),
  ('tagline_zh', to_jsonb('每日商业精选'::text)),
  ('tagline_en', to_jsonb('A daily business briefing'::text)),
  ('announcement_zh', to_jsonb(''::text)),
  ('announcement_en', to_jsonb(''::text)),
  ('footer_note', to_jsonb(''::text)),
  ('maintenance', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
