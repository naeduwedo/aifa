package store

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/aifa.one/backend/internal/model"
)

var ErrNotFound = errors.New("not found")

type Store struct {
	DB *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Store { return &Store{DB: pool} }

// ---------------------------------------------------------------- users

func (s *Store) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	row := s.DB.QueryRow(ctx, `
		SELECT id, user_no, email, display_name, title, avatar_url, bio, role, verified, locale, is_author
		FROM users WHERE lower(email)=lower($1)`, email)
	return scanUser(row)
}

func (s *Store) GetUserByID(ctx context.Context, id int64) (*model.User, error) {
	row := s.DB.QueryRow(ctx, `
		SELECT id, user_no, email, display_name, title, avatar_url, bio, role, verified, locale, is_author
		FROM users WHERE id=$1`, id)
	return scanUser(row)
}

func scanUser(row pgx.Row) (*model.User, error) {
	var u model.User
	var name, title, bio string
	err := row.Scan(&u.ID, &u.UserNo, &u.Email, &name, &title, &u.AvatarURL, &bio,
		&u.Role, &u.Verified, &u.Locale, &u.IsAuthor)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.DisplayName = model.Text{En: name}
	if u.DisplayName.En == "" {
		u.DisplayName = model.Text{Zh: "读者", En: "Reader"}
	}
	u.Title = model.Text{En: title}
	u.Bio = model.Text{En: bio}
	return &u, nil
}

func (s *Store) CreateUser(ctx context.Context, email, locale, displayName string) (*model.User, error) {
	if strings.TrimSpace(displayName) == "" {
		local := strings.SplitN(email, "@", 2)[0]
		displayName = strings.NewReplacer(".", " ", "-", " ", "_", " ").Replace(local)
	}
	var id int64
	err := s.DB.QueryRow(ctx, `
		INSERT INTO users (email, display_name, locale)
		VALUES ($1,$2,$3) RETURNING id`, email, strings.TrimSpace(displayName), locale).Scan(&id)
	if err != nil {
		return nil, err
	}
	return s.GetUserByID(ctx, id)
}

// UpdateProfile stores the profile fields shown next to comments and bylines.
func (s *Store) UpdateProfile(ctx context.Context, id int64, displayName, title, bio, avatarURL string) error {
	_, err := s.DB.Exec(ctx, `
		UPDATE users SET display_name=$2, title=$3, bio=$4, avatar_url=$5, updated_at=now()
		WHERE id=$1`, id, displayName, title, bio, avatarURL)
	return err
}

// ---------------------------------------------------------------- articles

type articleRow struct {
	id           int64
	slug         string
	authorID     *int64
	date         time.Time
	status       string
	issueNo      int
	kickerZh     string
	kickerEn     string
	titleZh      string
	titleEn      string
	dekZh        string
	dekEn        string
	cover        string
	accent       string
	backCover    []byte
	readingZh    int
	readingEn    int
	interaction  []byte
	publishedAt  *time.Time
	viewCount    int64
	categoryID   *int64
	columnID     *int64
}

const articleCols = `id, slug, author_id, date, status, issue_no, kicker_zh, kicker_en,
	title_zh, title_en, dek_zh, dek_en, cover_image, cover_accent, back_cover::text,
	reading_zh, reading_en, interaction::text, published_at, view_count, category_id, column_id`

func scanArticle(row pgx.Row) (*articleRow, error) {
	var a articleRow
	err := row.Scan(&a.id, &a.slug, &a.authorID, &a.date, &a.status, &a.issueNo,
		&a.kickerZh, &a.kickerEn, &a.titleZh, &a.titleEn, &a.dekZh, &a.dekEn,
		&a.cover, &a.accent, &a.backCover, &a.readingZh, &a.readingEn,
		&a.interaction, &a.publishedAt, &a.viewCount, &a.categoryID, &a.columnID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (s *Store) articleByID(ctx context.Context, id int64) (*articleRow, error) {
	return scanArticle(s.DB.QueryRow(ctx, `SELECT `+articleCols+` FROM articles WHERE id=$1`, id))
}

func (s *Store) ArticleBySlug(ctx context.Context, slug string) (*articleRow, error) {
	return scanArticle(s.DB.QueryRow(ctx, `SELECT `+articleCols+` FROM articles WHERE slug=$1`, slug))
}

func (a *articleRow) href(authorNo int64) string {
	if authorNo > 0 {
		return fmt.Sprintf("/u/%d/%s", authorNo, a.slug)
	}
	return "/u/0/" + a.slug
}

func (s *Store) authorLite(ctx context.Context, authorID *int64) (int64, model.Text, string, model.Text, bool) {
	fallback := model.Text{En: "AIFA Editorial Desk"}
	if authorID == nil {
		return 0, fallback, "", model.Text{En: "AIFA COLUMNIST"}, false
	}
	var no int64
	var name, title, avatar string
	var verified bool
	err := s.DB.QueryRow(ctx, `SELECT user_no, display_name, title, avatar_url, verified FROM users WHERE id=$1`, *authorID).
		Scan(&no, &name, &title, &avatar, &verified)
	if err != nil {
		return 0, fallback, "", model.Text{En: "AIFA COLUMNIST"}, false
	}
	return no, model.Text{En: name}, avatar, model.Text{En: title}, verified
}

// PublishedList returns published articles, newest first.
func (s *Store) PublishedList(ctx context.Context, limit int) ([]*articleRow, error) {
	rows, err := s.DB.Query(ctx, `SELECT `+articleCols+` FROM articles
		WHERE status='published' ORDER BY date DESC, id DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectArticles(rows)
}

func collectArticles(rows pgx.Rows) ([]*articleRow, error) {
	var out []*articleRow
	for rows.Next() {
		var a articleRow
		err := rows.Scan(&a.id, &a.slug, &a.authorID, &a.date, &a.status, &a.issueNo,
			&a.kickerZh, &a.kickerEn, &a.titleZh, &a.titleEn, &a.dekZh, &a.dekEn,
			&a.cover, &a.accent, &a.backCover, &a.readingZh, &a.readingEn,
			&a.interaction, &a.publishedAt, &a.viewCount, &a.categoryID, &a.columnID)
		if err != nil {
			return nil, err
		}
		out = append(out, &a)
	}
	return out, rows.Err()
}

func (s *Store) DailyForDate(ctx context.Context, date string) ([]*articleRow, error) {
	rows, err := s.DB.Query(ctx, `SELECT `+articleCols+` FROM articles
		WHERE status='published' AND date=$1 ORDER BY id`, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectArticles(rows)
}

// DailySchedule powers the prev/next day arrows on the cover screen.
func (s *Store) DailySchedule(ctx context.Context) ([]model.ScheduleItem, error) {
	rows, err := s.DB.Query(ctx, `
		SELECT date::text, array_agg(slug ORDER BY id)
		FROM articles WHERE status='published'
		GROUP BY date ORDER BY date`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []model.ScheduleItem
	for rows.Next() {
		var it model.ScheduleItem
		var slugs []string
		if err := rows.Scan(&it.Date, &slugs); err != nil {
			return nil, err
		}
		it.ArticleIDs = slugs
		out = append(out, it)
	}
	return out, rows.Err()
}

func (s *Store) DailyCard(ctx context.Context, a *articleRow) model.DailyEntry {
	var authorNo int64
	var name, title, avatar string
	var verified bool
	if a.authorID != nil {
		s.DB.QueryRow(ctx, `SELECT user_no, display_name, title, avatar_url, verified FROM users WHERE id=$1`, *a.authorID).
			Scan(&authorNo, &name, &title, &avatar, &verified)
	}
	return model.DailyEntry{
		Summary:        model.Text{Zh: a.dekZh, En: a.dekEn},
		ReadingMinutes: model.Text{Zh: fmt.Sprintf("%d", a.readingZh), En: fmt.Sprintf("%d", a.readingEn)},
		Basis:          "zh300-en200-prose-only",
		ArticleID:      fmt.Sprintf("article-%d", a.id),
		Date:           a.date.Format("2006-01-02"),
		Status:         a.status,
		Title:          model.Text{Zh: a.titleZh, En: a.titleEn},
		Author:         model.Text{En: name},
		AuthorAvatar:   avatar,
		AuthorTitle:    model.Text{En: title},
		AuthorVerifed:  verified,
		Href:           a.href(authorNo),
		AuthorID:       fmt.Sprintf("acc-%d", a.authorIDOrZero()),
	}
}

func (a *articleRow) authorIDOrZero() int64 {
	if a.authorID == nil {
		return 0
	}
	return *a.authorID
}

func (s *Store) Card(ctx context.Context, a *articleRow) model.Card {
	authorNo, name, avatar, title, verified := s.authorLite(ctx, a.authorID)
	return model.Card{
		ArticleID:     fmt.Sprintf("article-%d", a.id),
		Slug:          a.slug,
		Title:         model.Text{Zh: a.titleZh, En: a.titleEn},
		Date:          a.date.Format("2006-01-02"),
		Href:          a.href(authorNo),
		AuthorID:      fmt.Sprintf("acc-%d", a.authorIDOrZero()),
		Author:        name,
		AuthorAvatar:  avatar,
		AuthorTitle:   title,
		AuthorVerifed: verified,
		Status:        a.status,
		ReadingZh:     a.readingZh,
		ReadingEn:     a.readingEn,
		Summary:       model.Text{Zh: a.dekZh, En: a.dekEn},
		CoverImage:    a.cover,
		Category:      s.categoryName(ctx, a.categoryID),
	}
}

func (s *Store) categoryName(ctx context.Context, id *int64) model.Text {
	if id == nil {
		return model.Text{}
	}
	var zh, en string
	if err := s.DB.QueryRow(ctx, `SELECT name_zh, name_en FROM categories WHERE id=$1`, *id).
		Scan(&zh, &en); err != nil {
		return model.Text{}
	}
	return model.Text{Zh: zh, En: en}
}

// ---------------------------------------------------------------- detail

func (s *Store) ArticleDetail(ctx context.Context, slug string) (*model.ArticleDetail, error) {
	a, err := s.ArticleBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	authorNo, authorName, avatar, authorTitle, verified := s.authorLite(ctx, a.authorID)

	detail := &model.ArticleDetail{
		ID:           fmt.Sprintf("article-%d", a.id),
		Slug:         a.slug,
		Number:       fmt.Sprintf("No. %03d", a.issueNo),
		Title:        model.Text{Zh: a.titleZh, En: a.titleEn},
		Kicker:       model.Text{Zh: a.kickerZh, En: a.kickerEn},
		Byline:       authorName,
		BylineAccounts: []model.AuthorLite{{ID: fmt.Sprintf("acc-%d", a.authorIDOrZero()), Name: authorName, Av: avatar}},
		Date:         a.date.Format(time.RFC3339),
		Intro:        model.Text{Zh: a.dekZh, En: a.dekEn},
		CoverImage:   a.cover,
		CoverAccent:  a.accent,
		BackCover:    json.RawMessage(orEmpty(a.backCover, `{}`)),
		ReadingZh:    a.readingZh,
		ReadingEn:    a.readingEn,
		AuthorID:     fmt.Sprintf("acc-%d", a.authorIDOrZero()),
		Interaction:  json.RawMessage(orEmpty(a.interaction, `{"assistant":true,"comments":true,"share":true}`)),
		Available:    a.status == "published",
		ViewCount:    a.viewCount,
	}
	_ = verified
	_ = authorTitle
	_ = authorNo

	// pages
	rows, err := s.DB.Query(ctx, `
		SELECT id, page_no, role, section_zh, section_en, title_zh, title_en, dek_zh, dek_en
		FROM article_pages WHERE article_id=$1 ORDER BY page_no`, a.id)
	if err != nil {
		return nil, err
	}
	type pageTmp struct {
		id     int64
		p      model.Page
	}
	var pages []pageTmp
	for rows.Next() {
		var t pageTmp
		var secZh, secEn, tZh, tEn, dZh, dEn string
		if err := rows.Scan(&t.id, &t.p.PageNo, &t.p.Role, &secZh, &secEn, &tZh, &tEn, &dZh, &dEn); err != nil {
			rows.Close()
			return nil, err
		}
		t.p.ID = fmt.Sprintf("p%d", t.p.PageNo)
		t.p.Section = model.Text{Zh: secZh, En: secEn}
		t.p.Title = model.Text{Zh: tZh, En: tEn}
		t.p.Dek = model.Text{Zh: dZh, En: dEn}
		t.p.Blocks = []model.Block{}
		pages = append(pages, t)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// blocks
	brows, err := s.DB.Query(ctx, `
		SELECT id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content::text
		FROM blocks WHERE article_id=$1 ORDER BY ord`, a.id)
	if err != nil {
		return nil, err
	}
	byPage := map[int64][]model.Block{}
	blockID := map[int64]string{}
	for brows.Next() {
		var id, pageID int64
		var b model.Block
		var content string
		if err := brows.Scan(&id, &pageID, &b.BlockNo, &b.Ord, &b.Type, &b.Variant, &b.Class,
			&b.Width, &b.Rows, &b.Preset, &content); err != nil {
			brows.Close()
			return nil, err
		}
		b.ID = fmt.Sprintf("b%d", id)
		b.Content = json.RawMessage(content)
		blockID[id] = b.ID
		byPage[pageID] = append(byPage[pageID], b)
	}
	brows.Close()

	for i := range pages {
		pages[i].p.Blocks = append(pages[i].p.Blocks, byPage[pages[i].id]...)
	}
	detail.Pages = []model.Page{}
	for _, p := range pages {
		detail.Pages = append(detail.Pages, p.p)
	}

	// sources
	detail.Sources = []model.Source{}
	srows, err := s.DB.Query(ctx, `
		SELECT source_key, url, name_zh, name_en, title_zh, title_en, published_at
		FROM article_sources WHERE article_id=$1 ORDER BY ord`, a.id)
	if err == nil {
		defer srows.Close()
		for srows.Next() {
			var src model.Source
			var nZh, nEn, tZh, tEn string
			if err := srows.Scan(&src.ID, &src.URL, &nZh, &nEn, &tZh, &tEn, &src.PublishedAt); err != nil {
				break
			}
			src.Name = model.Text{Zh: nZh, En: nEn}
			src.Title = model.Text{Zh: tZh, En: tEn}
			detail.Sources = append(detail.Sources, src)
		}
	}

	detail.Comments = []model.Comment{}
	return detail, nil
}

func orEmpty(b []byte, def string) string {
	if len(b) == 0 {
		return def
	}
	return string(b)
}

// ---------------------------------------------------------------- columns

func (s *Store) ColumnProfiles(ctx context.Context) ([]model.AuthorProfile, error) {
	rows, err := s.DB.Query(ctx, `
		SELECT id, user_no, display_name, title, avatar_url, bio, verified
		FROM users WHERE is_author=TRUE ORDER BY user_no`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []model.AuthorProfile
	for rows.Next() {
		var p model.AuthorProfile
		var name, title, bio string
		if err := rows.Scan(&p.ID, &p.UserNo, &name, &title, &p.Avatar, &bio, &p.Verified); err != nil {
			return nil, err
		}
		p.Name = model.Text{En: name}
		p.Title = model.Text{En: title}
		p.Introduction = model.Text{En: bio}
		p.Articles = []model.Card{}

		cards, err := s.authorCards(ctx, p.ID, 50)
		if err == nil {
			p.Articles = cards
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) authorCards(ctx context.Context, authorID int64, limit int) ([]model.Card, error) {
	rows, err := s.DB.Query(ctx, `SELECT `+articleCols+` FROM articles
		WHERE author_id=$1 AND status='published' ORDER BY date DESC LIMIT $2`, authorID, limit)
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

func (s *Store) AuthorByNo(ctx context.Context, no int64) (*model.AuthorProfile, error) {
	var p model.AuthorProfile
	var name, title, bio string
	err := s.DB.QueryRow(ctx, `
		SELECT id, user_no, display_name, title, avatar_url, bio, verified
		FROM users WHERE user_no=$1 AND is_author=TRUE`, no).
		Scan(&p.ID, &p.UserNo, &name, &title, &p.Avatar, &bio, &p.Verified)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	p.Name = model.Text{En: name}
	p.Title = model.Text{En: title}
	p.Introduction = model.Text{En: bio}
	p.Articles = []model.Card{}
	cards, err := s.authorCards(ctx, p.ID, 50)
	if err == nil {
		p.Articles = cards
	}
	return &p, nil
}

// LatestPublishedDate is the cover screen fallback when today has no issue yet.
func (s *Store) LatestPublishedDate(ctx context.Context) (string, error) {
	var d string
	err := s.DB.QueryRow(ctx, `SELECT date::text FROM articles WHERE status='published'
		ORDER BY date DESC LIMIT 1`).Scan(&d)
	return d, err
}
