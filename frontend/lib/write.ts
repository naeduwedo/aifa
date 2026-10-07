import type { ArticleDetail, ArticleEditPayload, ArticleWrite, WriteBlock, WritePage } from "@/lib/types";

export const emptyBlock = (type: string): WriteBlock => {
  const base: WriteBlock = { type, variant: "default", class: "text", width: "full", rows: 0, content: {} };
  switch (type) {
    case "heading":
      base.variant = "title";
      base.content = { kicker: { zh: "", en: "" }, text: { zh: "", en: "" }, sub: { zh: "", en: "" } };
      break;
    case "chapter":
      base.variant = "chapter-head";
      base.content = { ordinal: "01", sentence: { zh: "", en: "" } };
      break;
    case "body":
      base.variant = "paragraph";
      base.content = { zh: "", en: "" };
      break;
    case "media":
      base.variant = "picture";
      base.class = "image";
      base.content = { imageSrc: "", caption: { zh: "", en: "" }, alt: { zh: "", en: "" } };
      break;
  }
  return base;
};

export const emptyWrite = (): ArticleWrite => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    slug: "",
    date: today,
    status: "draft",
    issueNo: 0,
    kicker: { zh: "", en: "" },
    title: { zh: "", en: "" },
    dek: { zh: "", en: "" },
    coverImage: "",
    coverAccent: "#111111",
    readingMinutesZh: 5,
    readingMinutesEn: 4,
    categoryId: null,
    columnId: null,
    authorId: null,
    pages: [
      {
        role: "cover",
        section: { zh: "", en: "" },
        title: { zh: "", en: "" },
        dek: { zh: "", en: "" },
        blocks: [emptyBlock("heading")],
      },
      {
        role: "content",
        section: { zh: "", en: "" },
        title: { zh: "", en: "" },
        dek: { zh: "", en: "" },
        blocks: [emptyBlock("body")],
      },
    ],
    sources: [],
  };
};

export const toWrite = (payload: ArticleEditPayload, status?: string): ArticleWrite => {
  const a: ArticleDetail = payload.article;
  const m = payload.meta;
  return {
    slug: a.slug,
    date: m.date,
    status: status ?? m.status,
    issueNo: m.issueNo,
    kicker: a.kicker,
    title: a.title,
    dek: a.intro,
    coverImage: a.coverImage || "",
    coverAccent: a.accent || "#111111",
    readingMinutesZh: a.readingMinutesZh || 5,
    readingMinutesEn: a.readingMinutesEn || 4,
    categoryId: m.categoryId,
    columnId: m.columnId,
    authorId: m.authorId,
    pages: (a.pages || []).map((p) => ({
      role: p.role,
      section: p.section,
      title: p.title,
      dek: p.dek,
      blocks: (p.blocks || []).map((b) => ({
        type: b.type,
        variant: b.variant,
        class: b.class,
        width: b.width,
        rows: b.rows,
        content: b.content || {},
      })),
    })),
    sources: (a.sources || []).map((s) => ({
      url: s.url,
      name: s.name,
      title: s.title,
      publishedAt: s.publishedAt || "",
    })),
  };
};

export const move = <T,>(arr: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export type { WritePage };
