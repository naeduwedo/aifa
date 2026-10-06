package store

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"

	"github.com/aifa.one/backend/internal/model"
)

// ---------------------------------------------------------------- catalog

type ResearchResource struct {
	Slug        string          `json:"slug"`
	Category    model.Text      `json:"category"`
	Title       model.Text      `json:"title"`
	Description model.Text      `json:"description"`
	Purpose     model.Text      `json:"purpose"`
	Scope       model.Text      `json:"scope"`
	Edition     string          `json:"edition"`
	PublishedAt string          `json:"publishedAt"`
	PageCount   int             `json:"pageCount"`
	AccessLevel string          `json:"accessLevel"`
	Featured    bool            `json:"featured"`
	Cover       json.RawMessage `json:"cover"`
	Assets      json.RawMessage `json:"assets"`
}

func (s *Store) Research(ctx context.Context) ([]ResearchResource, error) {
	rows, err := s.DB.Query(ctx, `
		SELECT slug, category_zh, category_en, title_zh, title_en, desc_zh, desc_en,
		       purpose_zh, purpose_en, scope_zh, scope_en, edition,
		       coalesce(published_at::text,''), page_count, access_level, featured,
		       cover::text, assets::text
		FROM research_resources ORDER BY featured DESC, published_at DESC NULLS LAST`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ResearchResource
	for rows.Next() {
		var r ResearchResource
		var cZh, cEn, tZh, tEn, dZh, dEn, pZh, pEn, sZh, sEn string
		var cover, assets string
		if err := rows.Scan(&r.Slug, &cZh, &cEn, &tZh, &tEn, &dZh, &dEn, &pZh, &pEn, &sZh, &sEn,
			&r.Edition, &r.PublishedAt, &r.PageCount, &r.AccessLevel, &r.Featured, &cover, &assets); err != nil {
			return nil, err
		}
		r.Category = model.Text{Zh: cZh, En: cEn}
		r.Title = model.Text{Zh: tZh, En: tEn}
		r.Description = model.Text{Zh: dZh, En: dEn}
		r.Purpose = model.Text{Zh: pZh, En: pEn}
		r.Scope = model.Text{Zh: sZh, En: sEn}
		r.Cover = json.RawMessage(cover)
		r.Assets = json.RawMessage(assets)
		out = append(out, r)
	}
	return out, rows.Err()
}

type AcademyShelf struct {
	ID          string       `json:"id"`
	Index       string       `json:"index"`
	Title       model.Text   `json:"title"`
	Description model.Text   `json:"description"`
	Courses     []AcademyCourse `json:"courses"`
}

type AcademyCourse struct {
	ID           string          `json:"id"`
	Shelf        string          `json:"shelf"`
	Name         model.Text      `json:"name"`
	Institution  model.Text      `json:"institution"`
	Positioning  model.Text      `json:"positioning"`
	Tag          model.Text      `json:"tag"`
	Fields       json.RawMessage `json:"fields"`
	Price        json.RawMessage `json:"price"`
	Cover        json.RawMessage `json:"cover"`
	Action       string          `json:"action"`
	Relationship string          `json:"relationship"`
}

func (s *Store) Academy(ctx context.Context) ([]AcademyShelf, error) {
	shelfRows, err := s.DB.Query(ctx, `
		SELECT id, idx, title_zh, title_en, desc_zh, desc_en
		FROM academy_shelves ORDER BY ord`)
	if err != nil {
		return nil, err
	}
	defer shelfRows.Close()
	var shelves []AcademyShelf
	for shelfRows.Next() {
		var sh AcademyShelf
		var tZh, tEn, dZh, dEn string
		if err := shelfRows.Scan(&sh.ID, &sh.Index, &tZh, &tEn, &dZh, &dEn); err != nil {
			return nil, err
		}
		sh.Title = model.Text{Zh: tZh, En: tEn}
		sh.Description = model.Text{Zh: dZh, En: dEn}
		sh.Courses = []AcademyCourse{}
		shelves = append(shelves, sh)
	}
	shelfRows.Close()

	courseRows, err := s.DB.Query(ctx, `
		SELECT id, shelf_id, name_zh, name_en, inst_zh, inst_en, position_zh, position_en,
		       tag_zh, tag_en, fields::text, price::text, cover::text, action, relationship
		FROM academy_courses ORDER BY shelf_id, ord`)
	if err != nil {
		return shelves, err
	}
	defer courseRows.Close()
	byShelf := map[string][]AcademyCourse{}
	for courseRows.Next() {
		var c AcademyCourse
		var nZh, nEn, iZh, iEn, pZh, pEn, tZh, tEn string
		var fields, price, cover string
		if err := courseRows.Scan(&c.ID, &c.Shelf, &nZh, &nEn, &iZh, &iEn, &pZh, &pEn, &tZh, &tEn,
			&fields, &price, &cover, &c.Action, &c.Relationship); err != nil {
			return nil, err
		}
		c.Name = model.Text{Zh: nZh, En: nEn}
		c.Institution = model.Text{Zh: iZh, En: iEn}
		c.Positioning = model.Text{Zh: pZh, En: pEn}
		c.Tag = model.Text{Zh: tZh, En: tEn}
		c.Fields = json.RawMessage(fields)
		c.Price = json.RawMessage(price)
		c.Cover = json.RawMessage(cover)
		byShelf[c.Shelf] = append(byShelf[c.Shelf], c)
	}
	for i := range shelves {
		shelves[i].Courses = byShelf[shelves[i].ID]
	}
	return shelves, nil
}

type GoGlobal struct {
	ID       string          `json:"id"`
	Copy     json.RawMessage `json:"copy"`
	Services json.RawMessage `json:"services"`
	Hero     json.RawMessage `json:"hero"`
	Images   json.RawMessage `json:"images"`
}

func (s *Store) GoGlobal(ctx context.Context) ([]GoGlobal, error) {
	rows, err := s.DB.Query(ctx, `
		SELECT id, copy::text, services::text, hero::text, images::text
		FROM go_global_activities ORDER BY ord`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []GoGlobal
	for rows.Next() {
		var g GoGlobal
		var copy, services, hero, images string
		if err := rows.Scan(&g.ID, &copy, &services, &hero, &images); err != nil {
			return nil, err
		}
		g.Copy = json.RawMessage(copy)
		g.Services = json.RawMessage(services)
		g.Hero = json.RawMessage(hero)
		g.Images = json.RawMessage(images)
		out = append(out, g)
	}
	return out, rows.Err()
}

type SiteVideo struct {
	ID      string     `json:"id"`
	Title   model.Text `json:"title"`
	Summary model.Text `json:"summary"`
	Video   string     `json:"video"`
	Cover   string     `json:"cover"`
}

func (s *Store) Videos(ctx context.Context) ([]SiteVideo, error) {
	rows, err := s.DB.Query(ctx, `
		SELECT id, title_zh, title_en, summary_zh, summary_en, video, cover
		FROM site_videos ORDER BY ord`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SiteVideo
	for rows.Next() {
		var v SiteVideo
		var tZh, tEn, sZh, sEn string
		if err := rows.Scan(&v.ID, &tZh, &tEn, &sZh, &sEn, &v.Video, &v.Cover); err != nil {
			return nil, err
		}
		v.Title = model.Text{Zh: tZh, En: tEn}
		v.Summary = model.Text{Zh: sZh, En: sEn}
		out = append(out, v)
	}
	return out, rows.Err()
}

// ---------------------------------------------------------------- bookshelf

func (s *Store) ListSaves(ctx context.Context, userID int64) ([]model.ShelfItem, error) {
	rows, err := s.DB.Query(ctx, `
		SELECT kind, target_id, page_no, progress, created_at::text
		FROM saves WHERE user_id=$1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []model.ShelfItem
	for rows.Next() {
		var it model.ShelfItem
		if err := rows.Scan(&it.Kind, &it.TargetID, &it.PageNo, &it.Progress, &it.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, it)
	}
	return out, rows.Err()
}

func (s *Store) UpsertSave(ctx context.Context, userID int64, kind, target string, page, progress int) error {
	_, err := s.DB.Exec(ctx, `
		INSERT INTO saves (user_id, kind, target_id, page_no, progress)
		VALUES ($1,$2,$3,$4,$5)
		ON CONFLICT (user_id, kind, target_id)
		DO UPDATE SET page_no=$4, progress=$5, updated_at=now()`,
		userID, kind, target, page, progress)
	return err
}

func (s *Store) DeleteSave(ctx context.Context, userID int64, kind, target string) error {
	_, err := s.DB.Exec(ctx, `DELETE FROM saves WHERE user_id=$1 AND kind=$2 AND target_id=$3`,
		userID, kind, target)
	return err
}

func (s *Store) SaveProgress(ctx context.Context, userID int64, slug string, page, percent int, finished bool) error {
	art, err := s.ArticleBySlug(ctx, slug)
	if err != nil {
		return err
	}
	_, err = s.DB.Exec(ctx, `
		INSERT INTO reading_progress (user_id, article_id, page_no, percent, finished)
		VALUES ($1,$2,$3,$4,$5)
		ON CONFLICT (user_id, article_id)
		DO UPDATE SET page_no=$3, percent=$4, finished=$5, updated_at=now()`,
		userID, art.id, page, percent, finished)
	return err
}

func (s *Store) Progress(ctx context.Context, userID int64, slug string) (page, percent int, finished bool, err error) {
	art, err := s.ArticleBySlug(ctx, slug)
	if err != nil {
		return
	}
	err = s.DB.QueryRow(ctx, `
		SELECT page_no, percent, finished FROM reading_progress
		WHERE user_id=$1 AND article_id=$2`, userID, art.id).
		Scan(&page, &percent, &finished)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, 0, false, nil
	}
	return
}

func (s *Store) ListSubscriptions(ctx context.Context, userID int64) ([]model.AuthorProfile, error) {
	rows, err := s.DB.Query(ctx, `
		SELECT u.id, u.user_no, u.display_name, u.title, u.avatar_url, u.bio, u.verified
		FROM subscriptions s JOIN users u ON u.id=s.author_id
		WHERE s.user_id=$1 ORDER BY s.created_at DESC`, userID)
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
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) Subscribe(ctx context.Context, userID, authorID int64) error {
	_, err := s.DB.Exec(ctx, `
		INSERT INTO subscriptions (user_id, author_id) VALUES ($1,$2)
		ON CONFLICT DO NOTHING`, userID, authorID)
	return err
}

func (s *Store) Unsubscribe(ctx context.Context, userID, authorID int64) error {
	_, err := s.DB.Exec(ctx, `DELETE FROM subscriptions WHERE user_id=$1 AND author_id=$2`, userID, authorID)
	return err
}

func (s *Store) IsSubscribed(ctx context.Context, userID, authorID int64) bool {
	var ok bool
	s.DB.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM subscriptions WHERE user_id=$1 AND author_id=$2)`,
		userID, authorID).Scan(&ok)
	return ok
}

// ---------------------------------------------------------------- comments

func (s *Store) Comments(ctx context.Context, slug string) ([]model.Comment, error) {
	art, err := s.ArticleBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	rows, err := s.DB.Query(ctx, `
		SELECT c.id, c.user_id, coalesce(u.display_name,''), coalesce(u.avatar_url,''),
		       coalesce(u.title,''), coalesce(u.verified,false), c.body, c.created_at::text,
		       coalesce(c.parent_id,0), c.deleted
		FROM comments c LEFT JOIN users u ON u.id=c.user_id
		WHERE c.article_id=$1 ORDER BY c.created_at`, art.id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var flat []model.Comment
	for rows.Next() {
		var c model.Comment
		var name, avatar, title string
		var created string
		if err := rows.Scan(&c.ID, &c.UserID, &name, &avatar, &title, &c.Verified, &c.Body,
			&created, &c.ParentID, &c.Deleted); err != nil {
			return nil, err
		}
		c.Name = model.Text{En: name}
		c.Avatar = avatar
		c.Title = model.Text{En: title}
		c.CreatedAt, _ = parseTime(created)
		flat = append(flat, c)
	}
	byParent := map[int64][]model.Comment{}
	var roots []model.Comment
	for _, c := range flat {
		if c.ParentID == 0 {
			roots = append(roots, c)
		} else {
			byParent[c.ParentID] = append(byParent[c.ParentID], c)
		}
	}
	for i := range roots {
		roots[i].Replies = byParent[roots[i].ID]
	}
	return roots, nil
}

func (s *Store) AddComment(ctx context.Context, slug string, userID int64, parent int64, body string) (model.Comment, error) {
	art, err := s.ArticleBySlug(ctx, slug)
	if err != nil {
		return model.Comment{}, err
	}
	var id int64
	var created string
	err = s.DB.QueryRow(ctx, `
		INSERT INTO comments (article_id, user_id, parent_id, body) VALUES ($1,$2,NULLIF($3,0),$4)
		RETURNING id, created_at::text`, art.id, userID, parent, body).Scan(&id, &created)
	if err != nil {
		return model.Comment{}, err
	}
	u, err := s.GetUserByID(ctx, userID)
	if err != nil {
		return model.Comment{}, err
	}
	ts, _ := parseTime(created)
	return model.Comment{
		ID: id, UserID: userID, Name: u.DisplayName, Avatar: u.AvatarURL,
		Title: u.Title, Verified: u.Verified, Body: body, CreatedAt: ts, ParentID: parent,
	}, nil
}

func (s *Store) DeleteComment(ctx context.Context, id, userID int64) error {
	res, err := s.DB.Exec(ctx, `UPDATE comments SET deleted=TRUE, body='' WHERE id=$1 AND user_id=$2`, id, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
