package model

import (
	"encoding/json"
	"time"
)

// Text is the bilingual string shape used across the whole site: {"zh":"…","en":"…"}
type Text struct {
	Zh string `json:"zh"`
	En string `json:"en"`
}

func (t Text) At(lang string) string {
	if lang == "zh" {
		return t.Zh
	}
	return t.En
}

func T(zh, en string) Text { return Text{Zh: zh, En: en} }

type User struct {
	ID          int64  `json:"id"`
	UserNo      int64  `json:"userNo"`
	Email       string `json:"email,omitempty"`
	DisplayName Text   `json:"displayName"`
	Title       Text   `json:"title"`
	AvatarURL   string `json:"avatarUrl"`
	Bio         Text   `json:"bio"`
	Role        string `json:"role"`
	Verified    bool   `json:"verified"`
	Locale      string `json:"locale"`
	IsAuthor    bool   `json:"isAuthor"`
}

type Session struct {
	UserID int64 `json:"userId"`
	Token  string `json:"-"`
}

type AuthorProfile struct {
	ID           int64  `json:"id"`
	UserNo       int64  `json:"userNo"`
	Name         Text   `json:"name"`
	Avatar       string `json:"avatar"`
	Title        Text   `json:"title"`
	Introduction Text   `json:"introduction"`
	Verified     bool   `json:"verified"`
	Articles     []Card `json:"articles"`
}

type Card struct {
	ArticleID     string `json:"articleId"`
	Slug          string `json:"slug"`
	Title         Text   `json:"title"`
	Date          string `json:"date"`
	Href          string `json:"href"`
	AuthorID      string `json:"authorId"`
	Author        Text   `json:"author"`
	AuthorAvatar  string `json:"authorAvatar"`
	AuthorTitle   Text   `json:"authorTitle"`
	AuthorVerifed bool   `json:"authorVerified"`
	Status        string `json:"status"`
	ReadingZh     int    `json:"readingMinutesZh"`
	ReadingEn     int    `json:"readingMinutesEn"`
	Summary       Text   `json:"summary"`
	CoverImage    string `json:"coverImage,omitempty"`
	Category      Text   `json:"category"`
}

type DailyEntry struct {
	Summary       Text   `json:"summary"`
	ReadingMinutes Text  `json:"readingMinutes"`
	Basis         string `json:"basis"`
	ArticleID     string `json:"articleId"`
	Date          string `json:"date"`
	Status        string `json:"status"`
	Title         Text   `json:"title"`
	Author        Text   `json:"author"`
	AuthorAvatar  string `json:"authorAvatar"`
	AuthorTitle   Text   `json:"authorTitle"`
	AuthorVerifed bool   `json:"authorVerified"`
	Href          string `json:"href"`
	AuthorID      string `json:"authorId"`
}

type HomePayload struct {
	Daily      []DailyEntry     `json:"daily"`
	TodayIndex int              `json:"todayIndex"`
	Tomorrow   map[string]any   `json:"tomorrow"`
	Weekly     []any            `json:"weekly"`
	Notice     bool             `json:"notice"`
	Sections   []Section        `json:"sections"`
	Account    *User            `json:"account"`
	Schedule   []ScheduleItem   `json:"schedule"`
}

type ScheduleItem struct {
	Date       string   `json:"date"`
	ArticleIDs []string `json:"articleIds"`
}

type Section struct {
	ID             string          `json:"id"`
	Label          Text            `json:"label"`
	Articles       []Card          `json:"articles"`
	ColumnProfiles []AuthorProfile `json:"columnProfiles"`
}

type Block struct {
	ID      string          `json:"id"`
	BlockNo string          `json:"blockNo"`
	Type    string          `json:"type"`
	Variant string          `json:"variant"`
	Class   string          `json:"class"`
	Width   string          `json:"width"`
	Rows    int             `json:"rows"`
	Preset  string          `json:"preset,omitempty"`
	Content json.RawMessage `json:"content"`
	Ord     int             `json:"-"`
}

type Page struct {
	ID      string  `json:"id"`
	PageNo  int     `json:"pageNumber"`
	Role    string  `json:"role"`
	Section Text    `json:"section"`
	Title   Text    `json:"title"`
	Dek     Text    `json:"dek"`
	Blocks  []Block `json:"blocks"`
}

type Source struct {
	ID          string `json:"id"`
	URL         string `json:"url"`
	Name        Text   `json:"name"`
	Title       Text   `json:"title"`
	PublishedAt string `json:"publishedAt"`
}

type ArticleDetail struct {
	ID            string          `json:"id"`
	Slug          string          `json:"slug"`
	Number        string          `json:"number"`
	Title         Text            `json:"title"`
	Kicker        Text            `json:"kicker"`
	Byline        Text            `json:"byline"`
	BylineAccounts []AuthorLite   `json:"bylineAccounts"`
	Date          string          `json:"date"`
	Intro         Text            `json:"intro"`
	Sources       []Source        `json:"sources"`
	Pages         []Page          `json:"pages"`
	CoverImage    string          `json:"coverImage"`
	CoverAccent   string          `json:"accent"`
	BackCover     json.RawMessage `json:"backCover"`
	ReadingZh     int             `json:"readingMinutesZh"`
	ReadingEn     int             `json:"readingMinutesEn"`
	AuthorID      string          `json:"authorId"`
	Interaction   json.RawMessage `json:"interaction"`
	Comments      []Comment       `json:"comments"`
	Available     bool            `json:"available"`
	ViewCount     int64           `json:"viewCount"`
}

type AuthorLite struct {
	ID   string `json:"id"`
	Name Text   `json:"name"`
	Av   string `json:"avatarUrl"`
}

type Comment struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"userId"`
	Name      Text      `json:"name"`
	Avatar    string    `json:"avatar"`
	Title     Text      `json:"title"`
	Verified  bool      `json:"verified"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
	ParentID  int64     `json:"parentId"`
	Replies   []Comment `json:"replies,omitempty"`
	Deleted   bool      `json:"deleted"`
}

type ShelfItem struct {
	Kind      string `json:"kind"`
	TargetID  string `json:"targetId"`
	PageNo    int    `json:"pageNo"`
	Progress  int    `json:"progress"`
	CreatedAt string `json:"createdAt"`
	Card      *Card  `json:"card,omitempty"`
}
