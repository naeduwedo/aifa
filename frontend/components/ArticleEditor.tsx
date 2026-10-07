"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { label, t } from "@/lib/i18n";
import type {
  Account,
  ArticleEditPayload,
  ArticleWrite,
  CategoryRec,
  ColumnRec,
  Lang,
  Text,
  WriteBlock,
  WritePage,
} from "@/lib/types";
import { emptyBlock, emptyWrite, move, toWrite } from "@/lib/write";

const BLOCK_TYPES = ["heading", "chapter", "body", "media"] as const;

function TextPair({
  id,
  name,
  value,
  onChange,
  rows,
}: {
  id: string;
  name: string;
  value: Text;
  onChange: (v: Text) => void;
  rows?: number;
}) {
  const input = (side: "zh" | "en") =>
    rows ? (
      <textarea
        id={`${id}-${side}`}
        rows={rows}
        value={value[side]}
        onChange={(e) => onChange({ ...value, [side]: e.target.value })}
      />
    ) : (
      <input
        id={`${id}-${side}`}
        value={value[side]}
        onChange={(e) => onChange({ ...value, [side]: e.target.value })}
      />
    );
  return (
    <div className="field text-pair">
      <label htmlFor={`${id}-zh`}>{name}</label>
      <div className="text-pair-row">
        <span className="pair-tag">ZH</span>
        {input("zh")}
      </div>
      <div className="text-pair-row">
        <span className="pair-tag">EN</span>
        {input("en")}
      </div>
    </div>
  );
}

export default function ArticleEditor({ lang }: { lang: Lang }) {
  const router = useRouter();
  const params = useSearchParams();
  const idParam = params.get("id");
  const articleId = idParam ? Number(idParam) : 0;

  const [write, setWrite] = useState<ArticleWrite | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [cats, setCats] = useState<CategoryRec[]>([]);
  const [cols, setCols] = useState<ColumnRec[]>([]);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState(articleId);

  const patch = (p: Partial<ArticleWrite>) => setWrite((w) => (w ? { ...w, ...p } : w));

  useEffect(() => {
    const boot = async () => {
      try {
        const me = await fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json());
        const acc: Account | null = me.account ?? null;
        setAccount(acc);
        const [catRes, colRes] = await Promise.all([
          fetch("/api/categories").then((r) => r.json()).catch(() => ({ categories: [] })),
          fetch("/api/columns").then((r) => r.json()).catch(() => ({ columns: [] })),
        ]);
        setCats(catRes.categories || []);
        setCols((colRes.columns || []).map((c: any) => ({ ...c, articles: undefined })) as ColumnRec[]);
        if (articleId > 0) {
          const res = await fetch(`/api/articles/edit?id=${articleId}`, { credentials: "include" });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            setError(d.error || `HTTP ${res.status}`);
          } else {
            const data = (await res.json()) as ArticleEditPayload;
            setWrite(toWrite(data));
            setCreatedId(articleId);
          }
        } else {
          setWrite(emptyWrite());
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setReady(true);
      }
    };
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const save = async (publish: boolean) => {
    if (!write) return;
    setBusy(true);
    setError("");
    setSavedMsg("");
    try {
      const payload: ArticleWrite = { ...write, status: publish ? "published" : write.status };
      const isNew = createdId === 0;
      const res = await fetch(isNew ? "/api/articles" : `/api/articles/${createdId}`, {
        method: isNew ? "POST" : "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (isNew && data.id) {
        setCreatedId(data.id);
        router.replace(`/account/publish?id=${data.id}&lang=${lang}`);
      }
      setWrite(payload);
      setSavedMsg(label("articleSaved", lang));
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!ready || !write) {
    return (
      <div className="public-screen">
        <p className="mono-label">
          <span className="spin" />
        </p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="public-screen account-gate">
        <h1 className="display-title">{label("signInRequiredTitle", lang)}</h1>
        <Link className="primary-action" href={`/account/login?lang=${lang}`}>
          {label("signInTitle", lang)}
        </Link>
      </div>
    );
  }
  if (!account.isAuthor && account.role !== "admin") {
    return (
      <div className="public-screen account-gate">
        <h1 className="display-title">{label("writerOnly", lang)}</h1>
        <Link className="ghost-action" href={`/account/profile?lang=${lang}`}>
          {label("backToAdmin", lang)}
        </Link>
      </div>
    );
  }

  const setPage = (i: number, fn: (p: WritePage) => WritePage) =>
    setWrite((w) => (w ? { ...w, pages: w.pages.map((p, idx) => (idx === i ? fn(p) : p)) } : w));

  const setBlock = (pi: number, bi: number, fn: (b: WriteBlock) => WriteBlock) =>
    setPage(pi, (p) => ({ ...p, blocks: p.blocks.map((b, idx) => (idx === bi ? fn(b) : b)) }));

  const blockContentPair = (pi: number, bi: number, key: string, name: string) => {
    const b = write.pages[pi].blocks[bi];
    const v: Text = b.content[key] && typeof b.content[key] === "object" ? b.content[key] : { zh: "", en: "" };
    return (
      <TextPair
        id={`b-${pi}-${bi}-${key}`}
        name={name}
        value={v}
        onChange={(nv) => setBlock(pi, bi, (blk) => ({ ...blk, content: { ...blk.content, [key]: nv } }))}
      />
    );
  };

  const previewHref = createdId > 0 ? `/u/${account.userNo}/${write.slug}` : "";

  return (
    <div className="public-screen editor-screen">
      <p className="eyebrow">{label(createdId > 0 ? "editArticle" : "newArticleTitle", lang)}</p>
      <h1 className="display-title">{t(write.title, lang) || label("publishTitle", lang)}</h1>

      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          save(write.status === "published");
        }}
      >
        <section className="editor-card">
          <p className="mono-label">{label("articleMeta", lang)}</p>
          <div className="editor-grid">
            <div className="field">
              <label htmlFor="f-slug">{label("fieldSlug", lang)}</label>
              <input id="f-slug" value={write.slug} onChange={(e) => patch({ slug: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="f-date">{label("fieldDate", lang)}</label>
              <input
                id="f-date"
                type="date"
                value={write.date}
                onChange={(e) => patch({ date: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="f-status">{label("fieldStatus", lang)}</label>
              <select id="f-status" value={write.status} onChange={(e) => patch({ status: e.target.value })}>
                <option value="draft">{label("statusDraft", lang)}</option>
                <option value="scheduled">{label("statusScheduled", lang)}</option>
                <option value="published">{label("statusPublished", lang)}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-issue">{label("fieldIssue", lang)}</label>
              <input
                id="f-issue"
                type="number"
                min={0}
                value={write.issueNo}
                onChange={(e) => patch({ issueNo: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="field">
              <label htmlFor="f-cat">{label("fieldCategory", lang)}</label>
              <select
                id="f-cat"
                value={write.categoryId ?? ""}
                onChange={(e) => patch({ categoryId: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">{label("noCategory", lang)}</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t(c.name, lang) || c.slug}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-col">{label("fieldColumn", lang)}</label>
              <select
                id="f-col"
                value={write.columnId ?? ""}
                onChange={(e) => patch({ columnId: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">{label("noColumn", lang)}</option>
                {cols.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t(c.title, lang) || c.slug}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-cover">{label("fieldCover", lang)}</label>
              <input
                id="f-cover"
                value={write.coverImage}
                placeholder="/images/articles/a1-hero.svg"
                onChange={(e) => patch({ coverImage: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="f-accent">{label("fieldAccent", lang)}</label>
              <input
                id="f-accent"
                value={write.coverAccent}
                onChange={(e) => patch({ coverAccent: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="f-rz">{label("readingZhLabel", lang)}</label>
              <input
                id="f-rz"
                type="number"
                min={1}
                value={write.readingMinutesZh}
                onChange={(e) => patch({ readingMinutesZh: Number(e.target.value) || 1 })}
              />
            </div>
            <div className="field">
              <label htmlFor="f-re">{label("readingEnLabel", lang)}</label>
              <input
                id="f-re"
                type="number"
                min={1}
                value={write.readingMinutesEn}
                onChange={(e) => patch({ readingMinutesEn: Number(e.target.value) || 1 })}
              />
            </div>
          </div>
        </section>

        <section className="editor-card">
          <p className="mono-label">{label("articleTexts", lang)}</p>
          <div className="editor-grid">
            <TextPair id="f-kicker" name={label("fieldKicker", lang)} value={write.kicker} onChange={(v) => patch({ kicker: v })} />
            <TextPair id="f-title" name={label("fieldTitle", lang)} value={write.title} onChange={(v) => patch({ title: v })} />
            <TextPair id="f-dek" name={label("fieldDek", lang)} value={write.dek} rows={3} onChange={(v) => patch({ dek: v })} />
          </div>
        </section>

        <section className="editor-card">
          <div className="editor-card-head">
            <p className="mono-label">{label("pagesLabel", lang)}</p>
            <button
              className="small-action"
              type="button"
              onClick={() =>
                patch({
                  pages: [
                    ...write.pages,
                    {
                      role: "content",
                      section: { zh: "", en: "" },
                      title: { zh: "", en: "" },
                      dek: { zh: "", en: "" },
                      blocks: [emptyBlock("body")],
                    },
                  ],
                })
              }
            >
              {label("addPage", lang)}
            </button>
          </div>

          {write.pages.map((p, pi) => (
            <div className="page-card" key={pi}>
              <div className="page-card-head">
                <span className="mono-label">P{pi + 1}</span>
                <select
                  aria-label={label("pageRole", lang)}
                  value={p.role}
                  onChange={(e) => setPage(pi, (pg) => ({ ...pg, role: e.target.value }))}
                >
                  <option value="cover">{label("roleCover", lang)}</option>
                  <option value="content">{label("roleContent", lang)}</option>
                  <option value="back_cover">{label("roleBack", lang)}</option>
                </select>
                <div className="page-card-tools">
                  <button
                    className="mini-btn"
                    type="button"
                    aria-label={label("moveUp", lang)}
                    onClick={() => patch({ pages: move(write.pages, pi, pi - 1) })}
                  >
                    ↑
                  </button>
                  <button
                    className="mini-btn"
                    type="button"
                    aria-label={label("moveDown", lang)}
                    onClick={() => patch({ pages: move(write.pages, pi, pi + 1) })}
                  >
                    ↓
                  </button>
                  <button
                    className="mini-btn danger"
                    type="button"
                    aria-label={label("removePage", lang)}
                    onClick={() => {
                      if (write.pages.length > 1 && confirm(label("confirmedDelete", lang)))
                        patch({ pages: write.pages.filter((_, i) => i !== pi) });
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="editor-grid">
                <TextPair id={`p${pi}-section`} name="Section" value={p.section} onChange={(v) => setPage(pi, (pg) => ({ ...pg, section: v }))} />
                <TextPair id={`p${pi}-title`} name={label("fieldTitle", lang)} value={p.title} onChange={(v) => setPage(pi, (pg) => ({ ...pg, title: v }))} />
                <TextPair id={`p${pi}-dek`} name={label("fieldDek", lang)} value={p.dek} onChange={(v) => setPage(pi, (pg) => ({ ...pg, dek: v }))} />
              </div>

              <div className="block-list">
                {p.blocks.map((b, bi) => (
                  <div className="block-card" key={bi}>
                    <div className="page-card-head">
                      <select
                        aria-label={label("blockType", lang)}
                        value={b.type}
                        onChange={(e) => setBlock(pi, bi, (blk) => ({ ...blk, ...emptyBlock(e.target.value) }))}
                      >
                        {BLOCK_TYPES.map((ty) => (
                          <option key={ty} value={ty}>
                            {label(`type${ty.charAt(0).toUpperCase()}${ty.slice(1)}` as any, lang)}
                          </option>
                        ))}
                      </select>
                      <div className="page-card-tools">
                        <button
                          className="mini-btn"
                          type="button"
                          aria-label={label("moveUp", lang)}
                          onClick={() => setPage(pi, (pg) => ({ ...pg, blocks: move(pg.blocks, bi, bi - 1) }))}
                        >
                          ↑
                        </button>
                        <button
                          className="mini-btn"
                          type="button"
                          aria-label={label("moveDown", lang)}
                          onClick={() => setPage(pi, (pg) => ({ ...pg, blocks: move(pg.blocks, bi, bi + 1) }))}
                        >
                          ↓
                        </button>
                        <button
                          className="mini-btn danger"
                          type="button"
                          aria-label={label("removeBlock", lang)}
                          onClick={() => setPage(pi, (pg) => ({ ...pg, blocks: pg.blocks.filter((_, i) => i !== bi) }))}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {b.type === "heading" && (
                      <div className="editor-grid">
                        {blockContentPair(pi, bi, "kicker", label("fieldKicker", lang))}
                        {blockContentPair(pi, bi, "text", label("fieldTitle", lang))}
                        {blockContentPair(pi, bi, "sub", label("fieldDek", lang))}
                      </div>
                    )}
                    {b.type === "chapter" && (
                      <div className="editor-grid">
                        <div className="field">
                          <label htmlFor={`b-${pi}-${bi}-ord`}>No.</label>
                          <input
                            id={`b-${pi}-${bi}-ord`}
                            value={b.content.ordinal ?? ""}
                            onChange={(e) => setBlock(pi, bi, (blk) => ({ ...blk, content: { ...blk.content, ordinal: e.target.value } }))}
                          />
                        </div>
                        {blockContentPair(pi, bi, "sentence", label("fieldTitle", lang))}
                      </div>
                    )}
                    {b.type === "body" && (
                      <div className="editor-grid">
                        <div className="field text-pair">
                          <label htmlFor={`b-${pi}-${bi}-zh`}>{label("sectionZh", lang)}</label>
                          <textarea
                            id={`b-${pi}-${bi}-zh`}
                            rows={5}
                            value={b.content.zh ?? ""}
                            onChange={(e) => setBlock(pi, bi, (blk) => ({ ...blk, content: { ...blk.content, zh: e.target.value } }))}
                          />
                        </div>
                        <div className="field text-pair">
                          <label htmlFor={`b-${pi}-${bi}-en`}>{label("sectionEn", lang)}</label>
                          <textarea
                            id={`b-${pi}-${bi}-en`}
                            rows={5}
                            value={b.content.en ?? ""}
                            onChange={(e) => setBlock(pi, bi, (blk) => ({ ...blk, content: { ...blk.content, en: e.target.value } }))}
                          />
                        </div>
                      </div>
                    )}
                    {b.type === "media" && (
                      <div className="editor-grid">
                        <div className="field">
                          <label htmlFor={`b-${pi}-${bi}-src`}>{label("mediaSrcLabel", lang)}</label>
                          <input
                            id={`b-${pi}-${bi}-src`}
                            value={b.content.imageSrc ?? ""}
                            placeholder="/images/articles/a1-hero.svg"
                            onChange={(e) => setBlock(pi, bi, (blk) => ({ ...blk, content: { ...blk.content, imageSrc: e.target.value } }))}
                          />
                        </div>
                        {blockContentPair(pi, bi, "caption", label("captionLabel", lang))}
                        {blockContentPair(pi, bi, "alt", label("altLabel", lang))}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  className="small-action"
                  type="button"
                  onClick={() => setPage(pi, (pg) => ({ ...pg, blocks: [...pg.blocks, emptyBlock("body")] }))}
                >
                  {label("addBlock", lang)}
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="editor-card">
          <div className="editor-card-head">
            <p className="mono-label">{label("sourcesLabel", lang)}</p>
            <button
              className="small-action"
              type="button"
              onClick={() =>
                patch({
                  sources: [...write.sources, { url: "", name: { zh: "", en: "" }, title: { zh: "", en: "" }, publishedAt: "" }],
                })
              }
            >
              {label("addSource", lang)}
            </button>
          </div>
          {write.sources.map((s, si) => (
            <div className="source-row" key={si}>
              <div className="field">
                <label htmlFor={`s${si}-url`}>{label("sourceUrl", lang)}</label>
                <input
                  id={`s${si}-url`}
                  value={s.url}
                  onChange={(e) =>
                    patch({ sources: write.sources.map((x, i) => (i === si ? { ...x, url: e.target.value } : x)) })
                  }
                />
              </div>
              <TextPair
                id={`s${si}-name`}
                name={label("sourceName", lang)}
                value={s.name}
                onChange={(v) => patch({ sources: write.sources.map((x, i) => (i === si ? { ...x, name: v } : x)) })}
              />
              <TextPair
                id={`s${si}-title`}
                name={label("sourceTitle", lang)}
                value={s.title}
                onChange={(v) => patch({ sources: write.sources.map((x, i) => (i === si ? { ...x, title: v } : x)) })}
              />
              <div className="field">
                <label htmlFor={`s${si}-date`}>{label("sourceDate", lang)}</label>
                <input
                  id={`s${si}-date`}
                  value={s.publishedAt}
                  placeholder="2026-10-01"
                  onChange={(e) =>
                    patch({ sources: write.sources.map((x, i) => (i === si ? { ...x, publishedAt: e.target.value } : x)) })
                  }
                />
              </div>
              <button
                className="mini-btn danger"
                type="button"
                aria-label={label("removeSource", lang)}
                onClick={() => patch({ sources: write.sources.filter((_, i) => i !== si) })}
              >
                ✕
              </button>
            </div>
          ))}
        </section>

        {error && <p className="login-error">{error}</p>}
        {savedMsg && <p className="toast-inline">{savedMsg}</p>}

        <div className="editor-actions">
          <button className="primary-action" type="submit" disabled={busy}>
            {label("saveArticle", lang)}
          </button>
          <button
            className="ghost-action"
            type="button"
            disabled={busy}
            onClick={() => {
              if (!write.slug.trim()) {
                setError(label("fieldSlug", lang));
                return;
              }
              save(true);
            }}
          >
            {label("saveAndPublish", lang)}
          </button>
          {createdId > 0 && write.status === "published" && previewHref && (
            <Link className="ghost-action" href={previewHref}>
              {label("viewArticle", lang)}
            </Link>
          )}
          <Link
            className="ghost-action"
            href={(account?.role === "admin" ? `/admin?lang=${lang}` : `/account/profile?lang=${lang}`)}
          >
            {label("backToAdmin", lang)}
          </Link>
        </div>
      </form>
    </div>
  );
}
