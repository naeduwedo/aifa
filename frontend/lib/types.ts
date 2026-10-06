export type Text = { zh: string; en: string };
export type Lang = "zh" | "en";

export interface Card {
  articleId: string;
  slug: string;
  title: Text;
  date: string;
  href: string;
  authorId: string;
  author: Text;
  authorAvatar: string;
  authorTitle: Text;
  authorVerified: boolean;
  status: string;
  readingMinutesZh: number;
  readingMinutesEn: number;
  summary: Text;
  coverImage?: string;
}

export interface DailyEntry {
  summary: Text;
  readingMinutes: Text;
  basis: string;
  articleId: string;
  date: string;
  status: string;
  title: Text;
  author: Text;
  authorAvatar: string;
  authorTitle: Text;
  authorVerified: boolean;
  href: string;
  authorId: string;
}

export interface ScheduleItem {
  date: string;
  articleIds: string[];
}

export interface AuthorProfile {
  id: string;
  userNo: number;
  name: Text;
  avatar: string;
  title: Text;
  introduction: Text;
  verified: boolean;
  articles: Card[];
}

export interface Section {
  id: string;
  label: Text;
  articles: Card[];
  columnProfiles: AuthorProfile[];
}

export interface HomePayload {
  daily: DailyEntry[];
  todayIndex: number;
  tomorrow: { date: string; authors: unknown[] };
  weekly: unknown[];
  notice: boolean;
  sections: Section[];
  account: Account | null;
  schedule: ScheduleItem[];
}

export interface Account {
  id: number;
  userNo: number;
  email: string;
  displayName: Text;
  title: Text;
  avatarUrl: string;
  verified: boolean;
  role: string;
  isAuthor: boolean;
  locale: string;
}

export interface Block {
  id: string;
  blockNo: string;
  type: string;
  variant: string;
  class: string;
  width: string;
  rows: number;
  preset?: string;
  content: Record<string, any> & { zh?: string; en?: string };
}

export interface Page {
  id: string;
  pageNumber: number;
  role: string;
  section: Text;
  title: Text;
  dek: Text;
  blocks: Block[];
}

export interface Source {
  id: string;
  url: string;
  name: Text;
  title: Text;
  publishedAt: string;
}

export interface Comment {
  id: number;
  userId: number;
  name: Text;
  avatar: string;
  title: Text;
  verified: boolean;
  body: string;
  createdAt: string;
  parentId: number;
  replies?: Comment[];
  deleted?: boolean;
}

export interface ArticleDetail {
  id: string;
  slug: string;
  number: string;
  title: Text;
  kicker: Text;
  byline: Text;
  bylineAccounts: { id: string; name: Text; avatarUrl: string }[];
  date: string;
  intro: Text;
  sources: Source[];
  pages: Page[];
  coverImage: string;
  accent: string;
  backCover: Record<string, any>;
  readingMinutesZh: number;
  readingMinutesEn: number;
  authorId: string;
  interaction: Record<string, boolean>;
  comments: Comment[];
  available: boolean;
  viewCount: number;
}

export interface ArticleResponse {
  article: ArticleDetail;
  progress?: { page: number; percent: number; finished: boolean };
  saved?: boolean;
}

export interface ShelfItem {
  kind: string;
  targetId: string;
  pageNo: number;
  progress: number;
  createdAt: string;
  card?: Card | null;
}

export interface ResearchResource {
  slug: string;
  category: Text;
  title: Text;
  description: Text;
  purpose: Text;
  scope: Text;
  edition: string;
  publishedAt: string;
  pageCount: number;
  accessLevel: string;
  featured: boolean;
  cover: {
    background?: string;
    foreground?: string;
    accent?: string;
    motif?: string;
    image?: string;
  };
  assets: { id: string; label: Text; language: string; format: string; fileName: string }[];
}

export interface AcademyCourse {
  id: string;
  shelf: string;
  name: Text;
  institution: Text;
  positioning: Text;
  tag: Text;
  fields: { key: string; label: Text; value: Text; source?: string }[];
  price: { amount: number | null; currency: string; display: Text };
  cover: { src: string; alt: Text; eyebrow?: Text };
  action: string;
  relationship: string;
}

export interface AcademyShelf {
  id: string;
  index: string;
  title: Text;
  description: Text;
  courses: AcademyCourse[];
}

export interface GoGlobalActivity {
  id: string;
  copy: { zh: Record<string, any>; en: Record<string, any> };
  services: { id: string; label: Text }[];
  hero: { src: string; alt: Text; caption: Text; credit: Text };
  images: { src: string; alt: Text; caption: Text; credit: Text }[];
}

export interface SiteVideo {
  id: string;
  title: Text;
  summary: Text;
  video: string;
  cover: string;
}

export interface ConsultMessage {
  id: number;
  threadId: number;
  author: string;
  body: string;
  createdAt: string;
}
