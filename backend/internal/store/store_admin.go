package store

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/aifa.one/backend/internal/model"
)

// ------------------------------------------------------------------ stats

type AdminStats struct {
	Users       int64 `json:"users"`
	Authors     int64 `json:"authors"`
	Articles    int64 `json:"articles"`
	Published   int64 `json:"published"`
	Drafts      int64 `json:"drafts"`
	Comments    int64 `json:"comments"`
	Subscribers int64 `json:"subscribers"`
	Columns     int64 `json:"columns"`
	Categories  int64 `json:"categories"`
	SitePages   int64 `json:"sitePages"`
	ViewsToday  int64 `json:"viewsToday"`
}

func (s *Store) AdminStats(ctx context.Context) (AdminStats, error) {
	var st AdminStats
	err := s.DB.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM users),
			(SELECT COUNT(*) FROM users WHERE is_author=TRUE),
			(SELECT COUNT(*) FROM articles),
			(SELECT COUNT(*) FROM articles WHERE status='published'),
			(SELECT COUNT(*) FROM articles WHERE status<>'published'),
			(SELECT COUNT(*) FROM comments WHERE deleted=FALSE),
			(SELECT COUNT(*) FROM subscriptions),
			(SELECT COUNT(*) FROM site_columns),
			(SELECT COUNT(*) FROM categories),
			(SELECT COUNT(*) FROM site_pages),
			(SELECT COALESCE(SUM(hits),0) FROM page_views WHERE seen_on=current_date)`).
		Scan(&st.Users, &st.Authors, &st.Articles, &st.Published, &st.Drafts,
			&st.Comments, &st.Subscribers, &st.Columns, &st.Categories,
			&st.SitePages, &st.ViewsToday)
	return st, err
}

// ------------------------------------------------------------------ users

type AdminUser struct {
	ID          int64     `json:"id"`
	UserNo      int64     `json:"userNo"`
	Email       string    `json:"email"`
	DisplayName string    `json:"displayName"`
	Title       string    `json:"title"`
	AvatarURL   string    `json:"avatarUrl"`
	Bio         string    `json:"bio"`
	Role        string    `json:"role"`
	Locale      string    `json:"locale"`
	Verified    bool      `json:"verified"`
	IsAuthor    bool      `json:"isAuthor"`
	CreatedAt   time.Time `json:"createdAt"`
	Articles    int64     `json:"articles"`
}

func (s *Store) AdminUsers(ctx context.Context, q string) ([]AdminUser, error) {
	rows, err := s.DB.Query(ctx, `
		SELECT u.id, u.user_no, u.email, u.display_name, u.title, u.avatar_url, u.bio,
			u.role, u.locale, u.verified, u.is_author, u.created_at,
			(SELECT COUNT(*) FROM articles a WHERE a.author_id=u.id)
		FROM users u
		WHERE $1='' OR u.email ILIKE '%'||$1||'%' OR u.display_name ILIKE '%'||$1||'%'
		ORDER BY u.id DESC LIMIT 200`, strings.TrimSpace(q))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AdminUser{}
	for rows.Next() {
		var u AdminUser
		if err := rows.Scan(&u.ID, &u.UserNo, &u.Email, &u.DisplayName, &u.Title,
			&u.AvatarURL, &u.Bio, &u.Role, &u.Locale, &u.Verified, &u.IsAuthor,
			&u.CreatedAt, &u.Articles); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

type UserPatch struct {
	DisplayName *string `json:"displayName"`
	Title       *string `json:"title"`
	Bio         *string `json:"bio"`
	AvatarURL   *string `json:"avatarUrl"`
	Role        *string `json:"role"`
	Locale      *string `json:"locale"`
	Verified    *bool   `json:"verified"`
	IsAuthor    *bool   `json:"isAuthor"`
}

func (s *Store) AdminUpdateUser(ctx context.Context, id int64, p UserPatch) error {
	set := []string{}
	args := []any{id}
	add := func(col string, v any) {
		args = append(args, v)
		set = append(set, fmt.Sprintf("%s=$%d", col, len(args)))
	}
	if p.DisplayName != nil {
		add("display_name", *p.DisplayName)
	}
	if p.Title != nil {
		add("title", *p.Title)
	}
	if p.Bio != nil {
		add("bio", *p.Bio)
	}
	if p.AvatarURL != nil {
		add("avatar_url", *p.AvatarURL)
	}
	if p.Role != nil {
		add("role", *p.Role)
	}
	if p.Locale != nil {
		add("locale", *p.Locale)
	}
	if p.Verified != nil {
		add("verified", *p.Verified)
	}
	if p.IsAuthor != nil {
		add("is_author", *p.IsAuthor)
	}
	if len(set) == 0 {
		return nil
	}
	set = append(set, "updated_at=now()")
	q := fmt.Sprintf("UPDATE users SET %s WHERE id=$1", strings.Join(set, ", "))
	_, err := s.DB.Exec(ctx, q, args...)
	return err
}

func (s *Store) AdminDeleteUser(ctx context.Context, id int64) error {
	_, err := s.DB.Exec(ctx, `DELETE FROM users WHERE id=$1`, id)
	return err
}

// ------------------------------------------------------------- categories

type CategoryRec struct {
	ID       int64      `json:"id"`
	Slug     string     `json:"slug"`
	Name     model.Text `json:"name"`
	Ord      int        `json:"ord"`
	Status   string     `json:"status"`
	Articles int64      `json:"articles"`
}

const categoryCols = `c.id, c.slug, c.name_zh, c.name_en, c.ord, c.status,
	(SELECT COUNT(*) FROM articles a WHERE a.category_id=c.id)`

func scanCategories(rows interface {
	Next() bool
	Scan(...any) error
	Err() error
}) ([]CategoryRec, error) {
	out := []CategoryRec{}
	for rows.Next() {
		var c CategoryRec
		if err := rows.Scan(&c.ID, &c.Slug, &c.Name.Zh, &c.Name.En, &c.Ord, &c.Status, &c.Articles); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) Categories(ctx context.Context) ([]CategoryRec, error) {
	rows, err := s.DB.Query(ctx, `SELECT `+categoryCols+` FROM categories c
		WHERE c.status='active' ORDER BY c.ord, c.id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanCategories(rows)
}

func (s *Store) AdminCategories(ctx context.Context) ([]CategoryRec, error) {
	rows, err := s.DB.Query(ctx, `SELECT `+categoryCols+` FROM categories c ORDER BY c.ord, c.id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanCategories(rows)
}

func (s *Store) AdminCreateCategory(ctx context.Context, slug, zh, en string, ord int, status string) (int64, error) {
	var id int64
	err := s.DB.QueryRow(ctx, `
		INSERT INTO categories (slug, name_zh, name_en, ord, status)
		VALUES ($1,$2,$3,$4,$5) RETURNING id`, slug, zh, en, ord, status).Scan(&id)
	return id, err
}

func (s *Store) AdminUpdateCategory(ctx context.Context, id int64, slug, zh, en string, ord int, status string) error {
	_, err := s.DB.Exec(ctx, `
		UPDATE categories SET slug=$2, name_zh=$3, name_en=$4, ord=$5, status=$6, updated_at=now()
		WHERE id=$1`, id, slug, zh, en, ord, status)
	return err
}

func (s *Store) AdminDeleteCategory(ctx context.Context, id int64) error {
	_, err := s.DB.Exec(ctx, `DELETE FROM categories WHERE id=$1`, id)
	return err
}

// ------------------------------------------------------------ site columns

type ColumnRec struct {
	ID          int64      `json:"id"`
	Slug        string     `json:"slug"`
	Title       model.Text `json:"title"`
	Desc        model.Text `json:"desc"`
	AuthorID    *int64     `json:"authorId"`
	AuthorName  string     `json:"authorName"`
	AuthorTitle model.Text `json:"authorTitle"`
	Ord         int        `json:"ord"`
	Status      string     `json:"status"`
	Articles    int64      `json:"articles"`
}

const columnCols = `c.id, c.slug, c.title_zh, c.title_en, c.desc_zh, c.desc_en,
	c.author_id, COALESCE(u.display_name,''), COALESCE(u.title,''), c.ord, c.status,
	(SELECT COUNT(*) FROM articles a WHERE a.column_id=c.id AND a.status='published')`

const columnJoin = ` FROM site_columns c LEFT JOIN users u ON u.id=c.author_id`

func scanColumns(rows interface {
	Next() bool
	Scan(...any) error
	Err() error
}) ([]ColumnRec, error) {
	out := []ColumnRec{}
	for rows.Next() {
		var c ColumnRec
		if err := rows.Scan(&c.ID, &c.Slug, &c.Title.Zh, &c.Title.En, &c.Desc.Zh, &c.Desc.En,
			&c.AuthorID, &c.AuthorName, &c.AuthorTitle.En, &c.Ord, &c.Status, &c.Articles); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) AdminColumns(ctx context.Context) ([]ColumnRec, error) {
	rows, err := s.DB.Query(ctx, `SELECT `+columnCols+columnJoin+` ORDER BY c.ord, c.id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanColumns(rows)
}

func (s *Store) PublicColumns(ctx context.Context) ([]ColumnRec, error) {
	rows, err := s.DB.Query(ctx, `SELECT `+columnCols+columnJoin+`
		WHERE c.status='active' ORDER BY c.ord, c.id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanColumns(rows)
}

func (s *Store) ColumnCards(ctx context.Context, columnID int64, limit int) ([]model.Card, error) {
	rows, err := s.DB.Query(ctx, `SELECT `+articleCols+` FROM articles
		WHERE column_id=$1 AND status='published' ORDER BY date DESC LIMIT $2`, columnID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	arts, err := collectArticles(rows)
	if err != nil {
		return nil, err
	}
	out := make([]model.Card, 0, len(arts))
	for _, a := range arts {
		out = append(out, s.Card(ctx, a))
	}
	return out, nil
}

type ColumnPatch struct {
	Slug     string     `json:"slug"`
	Title    model.Text `json:"title"`
	Desc     model.Text `json:"desc"`
	AuthorID *int64     `json:"authorId"`
	Ord      int        `json:"ord"`
	Status   string     `json:"status"`
}

func (s *Store) AdminCreateColumn(ctx context.Context, p ColumnPatch) (int64, error) {
	var id int64
	err := s.DB.QueryRow(ctx, `
		INSERT INTO site_columns (slug, title_zh, title_en, desc_zh, desc_en, author_id, ord, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
		p.Slug, p.Title.Zh, p.Title.En, p.Desc.Zh, p.Desc.En, p.AuthorID, p.Ord, p.Status).Scan(&id)
	return id, err
}

func (s *Store) AdminUpdateColumn(ctx context.Context, id int64, p ColumnPatch) error {
	_, err := s.DB.Exec(ctx, `
		UPDATE site_columns SET slug=$2, title_zh=$3, title_en=$4, desc_zh=$5, desc_en=$6,
			author_id=$7, ord=$8, status=$9, updated_at=now()
		WHERE id=$1`,
		id, p.Slug, p.Title.Zh, p.Title.En, p.Desc.Zh, p.Desc.En, p.AuthorID, p.Ord, p.Status)
	return err
}

func (s *Store) AdminDeleteColumn(ctx context.Context, id int64) error {
	_, err := s.DB.Exec(ctx, `DELETE FROM site_columns WHERE id=$1`, id)
	return err
}

// ------------------------------------------------------------- site pages

type SitePageRec struct {
	ID        int64      `json:"id"`
	Slug      string     `json:"slug"`
	Title     model.Text `json:"title"`
	Summary   model.Text `json:"summary"`
	Body      string     `json:"body"`
	Status    string     `json:"status"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

const sitePageCols = `id, slug, title_zh, title_en, summary_zh, summary_en, body, status, updated_at`

func scanSitePages(rows interface {
	Next() bool
	Scan(...any) error
	Err() error
}) ([]SitePageRec, error) {
	out := []SitePageRec{}
	for rows.Next() {
		var p SitePageRec
		if err := rows.Scan(&p.ID, &p.Slug, &p.Title.Zh, &p.Title.En, &p.Summary.Zh,
			&p.Summary.En, &p.Body, &p.Status, &p.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) AdminSitePages(ctx context.Context) ([]SitePageRec, error) {
	rows, err := s.DB.Query(ctx, `SELECT `+sitePageCols+` FROM site_pages ORDER BY updated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSitePages(rows)
}

func (s *Store) PublicSitePages(ctx context.Context) ([]SitePageRec, error) {
	rows, err := s.DB.Query(ctx, `SELECT `+sitePageCols+` FROM site_pages
		WHERE status='published' ORDER BY updated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSitePages(rows)
}

func (s *Store) PublicSitePage(ctx context.Context, slug string) (*SitePageRec, error) {
	var p SitePageRec
	err := s.DB.QueryRow(ctx, `SELECT `+sitePageCols+` FROM site_pages
		WHERE slug=$1 AND status='published'`, slug).
		Scan(&p.ID, &p.Slug, &p.Title.Zh, &p.Title.En, &p.Summary.Zh,
			&p.Summary.En, &p.Body, &p.Status, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

type SitePagePatch struct {
	Slug    string     `json:"slug"`
	Title   model.Text `json:"title"`
	Summary model.Text `json:"summary"`
	Body    string     `json:"body"`
	Status  string     `json:"status"`
}

func (s *Store) AdminCreateSitePage(ctx context.Context, p SitePagePatch) (int64, error) {
	var id int64
	err := s.DB.QueryRow(ctx, `
		INSERT INTO site_pages (slug, title_zh, title_en, summary_zh, summary_en, body, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
		p.Slug, p.Title.Zh, p.Title.En, p.Summary.Zh, p.Summary.En, p.Body, p.Status).Scan(&id)
	return id, err
}

func (s *Store) AdminUpdateSitePage(ctx context.Context, id int64, p SitePagePatch) error {
	_, err := s.DB.Exec(ctx, `
		UPDATE site_pages SET slug=$2, title_zh=$3, title_en=$4, summary_zh=$5, summary_en=$6,
			body=$7, status=$8, updated_at=now()
		WHERE id=$1`,
		id, p.Slug, p.Title.Zh, p.Title.En, p.Summary.Zh, p.Summary.En, p.Body, p.Status)
	return err
}

func (s *Store) AdminDeleteSitePage(ctx context.Context, id int64) error {
	_, err := s.DB.Exec(ctx, `DELETE FROM site_pages WHERE id=$1`, id)
	return err
}

// --------------------------------------------------------------- settings

func (s *Store) GetSettings(ctx context.Context) (map[string]any, error) {
	rows, err := s.DB.Query(ctx, `SELECT key, value::text FROM site_settings`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]any{}
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			return nil, err
		}
		var anyVal any
		if json.Unmarshal([]byte(v), &anyVal) == nil {
			out[k] = anyVal
		}
	}
	return out, rows.Err()
}

func (s *Store) PutSettings(ctx context.Context, settings map[string]any) error {
	for k, v := range settings {
		b, err := json.Marshal(v)
		if err != nil {
			return err
		}
		if _, err := s.DB.Exec(ctx, `
			INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2::jsonb, now())
			ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`,
			k, string(b)); err != nil {
			return err
		}
	}
	return nil
}

// ---------------------------------------------------------------- articles

type ArticleListItem struct {
	ID         int64      `json:"id"`
	Slug       string     `json:"slug"`
	Title      model.Text `json:"title"`
	Date       string     `json:"date"`
	Status     string     `json:"status"`
	IssueNo    int        `json:"issueNo"`
	AuthorID   *int64     `json:"authorId"`
	AuthorName string     `json:"authorName"`
	Category   model.Text `json:"category"`
	Views      int64      `json:"viewCount"`
	UpdatedAt  time.Time  `json:"updatedAt"`
}

func (s *Store) AdminArticles(ctx context.Context, status, q string, authorID *int64) ([]ArticleListItem, error) {
	var authorArg any
	if authorID != nil {
		authorArg = *authorID
	}
	like := "%" + strings.ToLower(strings.TrimSpace(q)) + "%"
	rows, err := s.DB.Query(ctx, `
		SELECT a.id, a.slug, a.title_zh, a.title_en, a.date::text, a.status, a.issue_no,
			a.author_id, COALESCE(u.display_name,''), COALESCE(c.name_zh,''), COALESCE(c.name_en,''),
			a.view_count, a.updated_at
		FROM articles a
		LEFT JOIN users u ON u.id=a.author_id
		LEFT JOIN categories c ON c.id=a.category_id
		WHERE ($1='' OR a.status=$1)
			AND ($2='' OR lower(a.slug) LIKE $2 OR lower(a.title_en) LIKE $2 OR lower(a.title_zh) LIKE $2)
			AND ($3::bigint IS NULL OR a.author_id=$3::bigint)
		ORDER BY a.date DESC, a.id DESC LIMIT 200`, status, like, authorArg)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ArticleListItem{}
	for rows.Next() {
		var it ArticleListItem
		if err := rows.Scan(&it.ID, &it.Slug, &it.Title.Zh, &it.Title.En, &it.Date, &it.Status,
			&it.IssueNo, &it.AuthorID, &it.AuthorName, &it.Category.Zh, &it.Category.En,
			&it.Views, &it.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, it)
	}
	return out, rows.Err()
}

type ArticleMeta struct {
	Slug       string `json:"slug"`
	Status     string `json:"status"`
	IssueNo    int    `json:"issueNo"`
	Date       string `json:"date"`
	AuthorID   *int64 `json:"authorId"`
	CategoryID *int64 `json:"categoryId"`
	ColumnID   *int64 `json:"columnId"`
}

func (s *Store) ArticleMeta(ctx context.Context, id int64) (*ArticleMeta, error) {
	var m ArticleMeta
	err := s.DB.QueryRow(ctx, `
		SELECT slug, status, issue_no, date::text, author_id, category_id, column_id
		FROM articles WHERE id=$1`, id).
		Scan(&m.Slug, &m.Status, &m.IssueNo, &m.Date, &m.AuthorID, &m.CategoryID, &m.ColumnID)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (s *Store) ArticleMetaBySlug(ctx context.Context, slug string) (*ArticleMeta, error) {
	var m ArticleMeta
	err := s.DB.QueryRow(ctx, `
		SELECT slug, status, issue_no, date::text, author_id, category_id, column_id
		FROM articles WHERE slug=$1`, slug).
		Scan(&m.Slug, &m.Status, &m.IssueNo, &m.Date, &m.AuthorID, &m.CategoryID, &m.ColumnID)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

type ArticleInput struct {
	Slug        string              `json:"slug"`
	Date        string              `json:"date"`
	Status      string              `json:"status"`
	IssueNo     int                 `json:"issueNo"`
	Kicker      model.Text          `json:"kicker"`
	Title       model.Text          `json:"title"`
	Dek         model.Text          `json:"dek"`
	CoverImage  string              `json:"coverImage"`
	CoverAccent string              `json:"coverAccent"`
	ReadingZh   int                 `json:"readingMinutesZh"`
	ReadingEn   int                 `json:"readingMinutesEn"`
	CategoryID  *int64              `json:"categoryId"`
	ColumnID    *int64              `json:"columnId"`
	AuthorID    *int64              `json:"authorId"`
	Pages       []ArticlePageInput  `json:"pages"`
	Sources     []ArticleSourceIn   `json:"sources"`
}

type ArticlePageInput struct {
	Role    string             `json:"role"`
	Section model.Text         `json:"section"`
	Title   model.Text         `json:"title"`
	Dek     model.Text         `json:"dek"`
	Blocks  []ArticleBlockInput `json:"blocks"`
}

type ArticleBlockInput struct {
	Type    string          `json:"type"`
	Variant string          `json:"variant"`
	Class   string          `json:"class"`
	Width   string          `json:"width"`
	Rows    int             `json:"rows"`
	Content json.RawMessage `json:"content"`
}

type ArticleSourceIn struct {
	URL         string     `json:"url"`
	Name        model.Text `json:"name"`
	Title       model.Text `json:"title"`
	PublishedAt string     `json:"publishedAt"`
}

const articleInsertCols = `slug, author_id, date, status, issue_no, kicker_zh, kicker_en,
	title_zh, title_en, dek_zh, dek_en, cover_image, cover_accent, reading_zh, reading_en,
	category_id, column_id, published_at`

func (s *Store) CreateArticle(ctx context.Context, in ArticleInput) (int64, error) {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	var id int64
	err = tx.QueryRow(ctx, `
		INSERT INTO articles (`+articleInsertCols+`)
		VALUES ($1,$2,$3::date,$4,
			COALESCE(NULLIF($5,0), (SELECT COALESCE(MAX(issue_no),0)+1 FROM articles)),
			$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
			CASE WHEN $4='published' THEN now() END)
		RETURNING id`,
		in.Slug, in.AuthorID, in.Date, in.Status, in.IssueNo,
		in.Kicker.Zh, in.Kicker.En, in.Title.Zh, in.Title.En, in.Dek.Zh, in.Dek.En,
		in.CoverImage, in.CoverAccent, in.ReadingZh, in.ReadingEn,
		in.CategoryID, in.ColumnID).Scan(&id)
	if err != nil {
		return 0, err
	}
	if err := replaceArticleChildren(ctx, tx, id, in); err != nil {
		return 0, err
	}
	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return id, nil
}

func (s *Store) UpdateArticle(ctx context.Context, id int64, in ArticleInput) error {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		UPDATE articles SET
			slug=$2, author_id=$3, date=$4::date, status=$5,
			issue_no=COALESCE(NULLIF($6,0), issue_no),
			kicker_zh=$7, kicker_en=$8, title_zh=$9, title_en=$10,
			dek_zh=$11, dek_en=$12, cover_image=$13, cover_accent=$14,
			reading_zh=$15, reading_en=$16, category_id=$17, column_id=$18,
			published_at=CASE WHEN $5='published' THEN COALESCE(published_at, now()) END,
			updated_at=now()
		WHERE id=$1`,
		id, in.Slug, in.AuthorID, in.Date, in.Status, in.IssueNo,
		in.Kicker.Zh, in.Kicker.En, in.Title.Zh, in.Title.En, in.Dek.Zh, in.Dek.En,
		in.CoverImage, in.CoverAccent, in.ReadingZh, in.ReadingEn,
		in.CategoryID, in.ColumnID)
	if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM article_pages WHERE article_id=$1`, id); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM article_sources WHERE article_id=$1`, id); err != nil {
		return err
	}
	if err := replaceArticleChildren(ctx, tx, id, in); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func replaceArticleChildren(ctx context.Context, tx pgx.Tx, articleID int64, in ArticleInput) error {
	for i, p := range in.Pages {
		var pageID int64
		if err := tx.QueryRow(ctx, `
			INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en,
				title_zh, title_en, dek_zh, dek_en)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
			articleID, i+1, p.Role, p.Section.Zh, p.Section.En,
			p.Title.Zh, p.Title.En, p.Dek.Zh, p.Dek.En).Scan(&pageID); err != nil {
			return err
		}
		for j, b := range p.Blocks {
			content := b.Content
			if len(content) == 0 {
				content = json.RawMessage(`{}`)
			}
			blockNo := fmt.Sprintf("%d-%d", i+1, j+1)
			variant, class, width := b.Variant, b.Class, b.Width
			if variant == "" {
				variant = "default"
			}
			if class == "" {
				class = "text"
			}
			if width == "" {
				width = "full"
			}
			if _, err := tx.Exec(ctx, `
				INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant,
					class_name, width, rows, preset, content)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'',$10::jsonb)`,
				articleID, pageID, blockNo, j+1, b.Type, variant, class, width, b.Rows,
				string(content)); err != nil {
				return err
			}
		}
	}
	for i, src := range in.Sources {
		if _, err := tx.Exec(ctx, `
			INSERT INTO article_sources (article_id, source_key, url, name_zh, name_en,
				title_zh, title_en, published_at, ord)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
			articleID, fmt.Sprintf("src-%d", i), src.URL,
			src.Name.Zh, src.Name.En, src.Title.Zh, src.Title.En, src.PublishedAt, i); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) AdminDeleteArticle(ctx context.Context, id int64) error {
	_, err := s.DB.Exec(ctx, `DELETE FROM articles WHERE id=$1`, id)
	return err
}
