"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { label, t } from "@/lib/i18n";
import type { ArticleDetail, Block, Comment, Lang, Page } from "@/lib/types";

const PAGE_RATIO = 900 / 636;
const TURN_MS = 560;
const FADE_MS = 160;

function BlockView({ block, lang }: { block: Block; lang: Lang }) {
  const c = block.content || {};
  const pick = (v: any): string =>
    typeof v === "string" ? v : v ? (lang === "zh" ? v.zh || v.en || "" : v.en || v.zh || "") : "";

  switch (block.type) {
    case "heading":
      return (
        <header className="block-heading">
          {c.kicker && <span className="kicker">{pick(c.kicker)}</span>}
          <h1>{pick(c.text ?? c.title)}</h1>
          {c.sub && <p className="sub">{pick(c.sub)}</p>}
        </header>
      );
    case "chapter":
      return (
        <div className="block-chapter">
          <span className="ordinal">{c.ordinal}</span>
          <span className="sentence">{pick(c.sentence)}</span>
        </div>
      );
    case "body":
      return (
        <div className="block-body">
          {pick(c).split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      );
    case "media":
      return (
        <figure className="block-media">
          <img src={c.imageSrc || "/images/articles/a1-hero.svg"} alt={pick(c.alt)} />
          <figcaption>{pick(c.caption)}</figcaption>
        </figure>
      );
    case "colophon":
      return (
        <div className="block-colophon">
          <dl>
            {((c as unknown as any[]) || []).map((row, i) => (
              <div key={i} style={{ display: "contents" }}>
                <dt>{pick(row.term)}</dt>
                <dd>{pick(row.detail)}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case "sources":
      return (
        <div className="block-sources">
          <p className="mono-label">{label("sources", lang)}</p>
          <ol>
            {((c as unknown as any[]) || []).map((s, i) => (
              <li key={i}>{pick(s.title ?? s)}</li>
            ))}
          </ol>
        </div>
      );
    default:
      return null;
  }
}

function CommentThread({
  comments,
  lang,
  onReply,
  formId,
}: {
  comments: Comment[];
  lang: Lang;
  onReply: (body: string) => void;
  formId: string;
}) {
  return (
    <>
      {comments.map((c) => (
        <div className="comment" key={c.id}>
          <div className="comment-avatar">{c.avatar ? <img src={c.avatar} alt="" /> : null}</div>
          <div>
            <div className="comment-head">
              <span className="who">{t(c.name, lang)}</span>
              <time>{c.createdAt?.slice(0, 10)}</time>
            </div>
            <p className="comment-body">{c.deleted ? "—" : c.body}</p>
            {c.replies && c.replies.length > 0 && (
              <div className="comment-replies">
                {c.replies.map((r) => (
                  <div className="comment" key={r.id}>
                    <div className="comment-avatar">{r.avatar ? <img src={r.avatar} alt="" /> : null}</div>
                    <div>
                      <div className="comment-head">
                        <span className="who">{t(r.name, lang)}</span>
                        <time>{r.createdAt?.slice(0, 10)}</time>
                      </div>
                      <p className="comment-body">{r.deleted ? "—" : r.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <div className="comment-form">
        <label className="sr-only" htmlFor={formId}>
          {label("comments", lang)}
        </label>
        <textarea id={formId} data-comment-input placeholder={label("commentsPlaceholder", lang)} maxLength={300} />
        <div className="row">
          <span className="comment-count">
            {comments.length} {label("comments", lang)}
          </span>
          <button
            className="small-action"
            type="button"
            onClick={() => {
              const el = document.getElementById(formId) as HTMLTextAreaElement | null;
              if (el?.value.trim()) onReply(el.value.trim());
            }}
          >
            {label("commentsSend", lang)}
          </button>
        </div>
      </div>
    </>
  );
}

type Spread = { left: Page | null; right: Page | null; solo: boolean };
type Geom = { cx: number; cy: number; pw: number; ph: number };
type Rects = {
  spine: number;
  leftX: number | null;
  rightX: number;
  leftPage: Page | null;
  rightPage: Page | null;
  y: number;
  w: number;
  h: number;
};
type TurnUnder = {
  side: "left" | "right";
  page: Page | null;
  x: number;
  y: number;
  w: number;
  h: number;
  shift: number;
};
type Turn = {
  dir: 1 | -1;
  leafX: number;
  origin: "left" | "right";
  shift: number;
  front: Page | null;
  frontSide: "left" | "right";
  back: Page | null;
  backSide: "left" | "right";
  y: number;
  w: number;
  h: number;
  unders: TurnUnder[];
  leak: { x: number; y: number; w: number; h: number } | null;
};

function buildSpreads(pages: Page[]): Spread[] {
  const out: Spread[] = [];
  let i = 0;
  if (pages[0]?.role === "cover") {
    out.push({ left: null, right: pages[0], solo: true });
    i = 1;
  }
  for (; i < pages.length; i += 2) {
    out.push({ left: pages[i], right: pages[i + 1] ?? null, solo: false });
  }
  if (out.length === 0) out.push({ left: null, right: null, solo: true });
  return out;
}

function geomFor(wide: boolean): Geom {
  if (typeof window === "undefined" || !wide) return { cx: 0, cy: 0, pw: 0, ph: 0 };
  const W = window.innerWidth;
  const H = window.innerHeight;
  const maxH = H - 108;
  const maxW = (W - 64) / 2;
  const ph = Math.max(260, Math.min(maxH, maxW * PAGE_RATIO));
  const pw = ph / PAGE_RATIO;
  return { cx: W / 2, cy: H / 2, pw, ph };
}

function stateOf(spread: Spread, g: Geom): Rects {
  const y = g.cy - g.ph / 2;
  if (spread.solo) {
    const spine = g.cx - g.pw / 2;
    return {
      spine,
      leftX: null,
      rightX: spine,
      leftPage: null,
      rightPage: spread.right,
      y,
      w: g.pw,
      h: g.ph,
    };
  }
  return {
    spine: g.cx,
    leftX: g.cx - g.pw,
    rightX: g.cx,
    leftPage: spread.left,
    rightPage: spread.right,
    y,
    w: g.pw,
    h: g.ph,
  };
}

function buildTurn(dir: 1 | -1, old: Rects, next: Rects): Turn {
  if (dir === 1) {
    const shift = old.spine - next.spine;
    const unders: TurnUnder[] = [
      { side: "right", page: next.rightPage, x: next.rightX, y: next.y, w: next.w, h: next.h, shift },
    ];
    if (!next.leftPage) {
      unders.push({
        side: "left",
        page: null,
        x: next.leftX ?? next.spine - next.w,
        y: next.y,
        w: next.w,
        h: next.h,
        shift,
      });
    }
    return {
      dir,
      leafX: next.spine,
      origin: "left",
      shift,
      front: old.rightPage,
      frontSide: "right",
      back: next.leftPage,
      backSide: "left",
      y: next.y,
      w: next.w,
      h: next.h,
      unders,
      leak: null,
    };
  }
  const leafX = next.spine - next.w;
  const shift = (old.leftX ?? old.rightX) - leafX;
  const unders: TurnUnder[] = [
    { side: "left", page: next.leftPage, x: leafX, y: next.y, w: next.w, h: next.h, shift },
  ];
  const oldRightEnd = old.rightX + old.w;
  const newRightEnd = next.rightX + next.w;
  const leak =
    oldRightEnd > newRightEnd + 1
      ? { x: newRightEnd, y: next.y, w: oldRightEnd - newRightEnd, h: next.h }
      : null;
  return {
    dir,
    leafX,
    origin: "right",
    shift,
    front: old.leftPage ?? old.rightPage,
    frontSide: "left",
    back: next.rightPage,
    backSide: "right",
    y: next.y,
    w: next.w,
    h: next.h,
    unders,
    leak,
  };
}

function spreadIndexFor(spreads: Spread[], n: number): number {
  return spreads.findIndex((s) => s.left?.pageNumber === n || s.right?.pageNumber === n);
}

function shortDate(d: string): string {
  return d ? d.slice(0, 10) : "";
}

export default function Reader({
  article: rawArticle,
  lang,
  saved,
  progress,
}: {
  article: ArticleDetail;
  lang: Lang;
  saved: boolean;
  progress?: { page: number; percent: number; finished: boolean };
}) {
  const router = useRouter();
  const article = useMemo<ArticleDetail>(
    () => ({
      ...rawArticle,
      pages: (rawArticle.pages || []).map((p) => ({ ...p, blocks: p.blocks || [] })),
      sources: rawArticle.sources || [],
      comments: rawArticle.comments || [],
    }),
    [rawArticle]
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLElement | null>>({});
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bootRef = useRef(false);
  const modeRef = useRef<() => void>(() => {});

  const spreads = useMemo(() => buildSpreads(article.pages), [article.pages]);
  const spreadsRef = useRef(spreads);
  spreadsRef.current = spreads;

  const totalPages = article.pages.length;

  const [idx, setIdx] = useState(0);
  const [wide, setWide] = useState(true);
  const [geom, setGeom] = useState<Geom>({ cx: 0, cy: 0, pw: 0, ph: 0 });
  const [turn, setTurn] = useState<Turn | null>(null);
  const [running, setRunning] = useState(false);
  const [fading, setFading] = useState(false);
  const [page, setPage] = useState(progress?.page ?? 1);
  const pageRef = useRef(progress?.page ?? 1);
  const [controls, setControls] = useState(true);
  const [toc, setToc] = useState(false);
  const [sheet, setSheet] = useState<"none" | "comments">("none");
  const [isSaved, setSaved] = useState(saved);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<Comment[]>(article.comments || []);
  const [signedIn, setSignedIn] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const updatePage = (n: number) => {
    pageRef.current = n;
    setPage(n);
  };

  const tocPages = useMemo(() => {
    const out: { id: string; pageNumber: number; label: string }[] = [];
    for (const p of article.pages) {
      const title = t(p.title, lang);
      if (title) {
        out.push({ id: p.id, pageNumber: p.pageNumber, label: title });
        continue;
      }
      const ch = p.blocks.find((b) => b.type === "chapter");
      const sentence = ch ? t(ch.content?.sentence, lang) : "";
      if (sentence) out.push({ id: p.id, pageNumber: p.pageNumber, label: sentence });
    }
    return out;
  }, [article.pages, lang]);

  const lastContentId = useMemo(() => {
    for (let i = article.pages.length - 1; i >= 0; i--) {
      if (article.pages[i].role === "content") return article.pages[i].id;
    }
    return null;
  }, [article.pages]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSignedIn(Boolean(d?.account)))
      .catch(() => setSignedIn(false))
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape), (min-width: 1024px)");
    const apply = () => {
      if (busyRef.current) return;
      const next = mq.matches;
      setWide(next);
      setGeom(geomFor(next));
      if (next) {
        const i = spreadIndexFor(spreadsRef.current, pageRef.current);
        if (i >= 0) setIdx(i);
      }
    };
    modeRef.current = apply;
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    const param = new URLSearchParams(window.location.search).get("page");
    let pageTarget = -1;
    if (param && param.startsWith(`${article.slug}.`)) {
      const suffix = param.slice(article.slug.length + 1);
      if (suffix === "cover") pageTarget = 1;
      else {
        const n = Number(suffix);
        if (Number.isFinite(n) && n >= 1) pageTarget = n;
      }
    }
    if (pageTarget < 0 && progress?.page) pageTarget = progress.page;
    if (pageTarget >= 0) {
      updatePage(pageTarget);
      const spreadIdx = spreadIndexFor(spreads, pageTarget);
      if (spreadIdx >= 0) setIdx(spreadIdx);
    }
  }, [article.slug, spreads, progress]);

  const flowBootRef = useRef(false);
  useEffect(() => {
    if (wide || flowBootRef.current) return;
    flowBootRef.current = true;
    const el = scrollRef.current;
    const node = pageRefs.current[pageRef.current];
    if (el && node) el.scrollTop = Math.max(0, node.offsetTop - 24);
  }, [wide]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (wide) return;
    const el = scrollRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const mid = el.scrollTop + el.clientHeight * 0.4;
        let current = 1;
        for (const p of article.pages) {
          const node = pageRefs.current[p.pageNumber];
          if (node && node.offsetTop <= mid) current = p.pageNumber;
        }
        updatePage(current);
        if (!authReady || !signedIn) return;
        const percent = Math.round((current / totalPages) * 100);
        fetch("/api/progress", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json;charset=utf-8" },
          body: JSON.stringify({
            slug: article.slug,
            page: current,
            percent,
            finished: percent >= 100,
          }),
        }).catch(() => {});
      }, 220);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [article, totalPages, authReady, signedIn, wide]);

  useEffect(() => {
    if (!wide) return;
    const st = stateOf(spreads[idx], geom);
    if (!st.w) return;
    const current = st.rightPage?.pageNumber ?? st.leftPage?.pageNumber ?? 1;
    updatePage(current);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("page", `${article.slug}.${current}`);
      window.history.replaceState(window.history.state, "", url);
    } catch {
      /* history unavailable */
    }
    if (!authReady || !signedIn) return;
    const percent = Math.round((current / totalPages) * 100);
    fetch("/api/progress", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({
        slug: article.slug,
        page: current,
        percent,
        finished: percent >= 100,
      }),
    }).catch(() => {});
  }, [idx, wide, geom, authReady, signedIn, article.slug, totalPages]);

  const turnTo = (dir: 1 | -1) => {
    if (!wide || busyRef.current) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= spreads.length) return;
    const old = stateOf(spreads[idx], geom);
    const next = stateOf(spreads[nextIdx], geom);
    if (!old.w || !next.w) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setIdx(nextIdx);
      return;
    }
    busyRef.current = true;
    setTurn(buildTurn(dir, old, next));
    setRunning(false);
    setFading(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setRunning(true));
    });
    timerRef.current = setTimeout(() => {
      setIdx(nextIdx);
      setFading(true);
      timerRef.current = setTimeout(() => {
        setTurn(null);
        setRunning(false);
        setFading(false);
        busyRef.current = false;
        modeRef.current();
      }, FADE_MS);
    }, TURN_MS);
  };

  const turnRef = useRef(turnTo);
  turnRef.current = turnTo;

  useEffect(() => {
    if (!wide) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        turnRef.current(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        turnRef.current(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wide]);

  const scrollTo = (n: number) => {
    const node = pageRefs.current[n];
    const el = scrollRef.current;
    if (node && el) el.scrollTo({ top: node.offsetTop - 24, behavior: "smooth" });
  };

  const jumpTo = (n: number) => {
    setToc(false);
    if (wide) {
      if (busyRef.current) return;
      const i = spreadIndexFor(spreads, n);
      if (i >= 0) setIdx(i);
    } else {
      scrollTo(n);
    }
  };

  const toggleSave = async () => {
    if (!signedIn) {
      router.push(`/account/login?lang=${lang}`);
      return;
    }
    if (isSaved) {
      await fetch(`/api/shelf/article/${encodeURIComponent(article.slug)}`, {
        method: "DELETE",
        credentials: "include",
      });
      setSaved(false);
    } else {
      await fetch("/api/shelf", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json;charset=utf-8" },
        body: JSON.stringify({ kind: "article", targetId: article.slug, pageNo: page, progress: 0 }),
      });
      setSaved(true);
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const addComment = async (body: string) => {
    if (!signedIn) {
      router.push(`/account/login?lang=${lang}`);
      return;
    }
    const res = await fetch(`/api/articles/${article.slug}/comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({ body, parentId: 0 }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.comment) setComments((prev) => [...prev, data.comment]);
      else {
        const list = await fetch(`/api/articles/${article.slug}/comments`, { credentials: "include" })
          .then((r) => r.json())
          .catch(() => null);
        if (list?.comments) setComments(list.comments);
      }
      document.querySelectorAll("textarea[data-comment-input]").forEach((el) => {
        (el as HTMLTextAreaElement).value = "";
      });
    }
  };

  const frame = {
    article,
    lang,
    comments,
    signedIn,
    onReply: addComment,
    onSignIn: () => router.push(`/account/login?lang=${lang}`),
  };

  const st = wide ? stateOf(spreads[idx], geom) : null;
  const slots: { side: "left" | "right"; page: Page; x: number }[] = [];
  if (st) {
    if (st.leftPage) slots.push({ side: "left", page: st.leftPage, x: st.leftX ?? 0 });
    if (st.rightPage) slots.push({ side: "right", page: st.rightPage, x: st.rightX });
  }
  const counter = st
    ? `${st.leftPage?.pageNumber ?? ""}${
        st.leftPage && st.rightPage ? `–${st.rightPage?.pageNumber ?? ""}` : ""
      }${st.leftPage ? "" : st.rightPage?.pageNumber ?? ""}`
    : "";

  return (
    <main className="reader-screen" lang={lang === "zh" ? "zh-CN" : "en"}>
      <button
        className="reader-close"
        type="button"
        aria-label={label("closeReader", lang)}
        onClick={() => router.back()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </svg>
      </button>

      {wide ? (
        <div className="page-canvas">
          <div className="spread-layer">
            {slots.map((s) => (
              <div
                className={`page-slot${s.page.role === "cover" ? " is-cover" : ""}`}
                data-side={s.side}
                key={s.side}
                style={{ left: s.x, top: geom.cy - geom.ph / 2, width: geom.pw, height: geom.ph }}
                onClick={s.page.role === "cover" ? () => turnTo(1) : undefined}
              >
                <PageFrame
                  {...frame}
                  page={s.page}
                  side={s.side}
                  showSources={s.page.id === lastContentId}
                />
              </div>
            ))}
          </div>

          {turn && (
            <div
              className={`turn-layer${running ? " is-running" : ""}${fading ? " is-out" : ""}`}
              aria-hidden
            >
              <div className="turn-book">
                {turn.unders.map((u) => (
                  <div
                    className="turn-under"
                    data-side={u.side}
                    key={u.side}
                    style={{
                      left: u.x,
                      top: u.y,
                      width: u.w,
                      height: u.h,
                      transform: `translateX(${running ? 0 : u.shift}px)`,
                    }}
                  >
                    {u.page ? (
                      <PageFrame {...frame} page={u.page} side={u.side} showSources={u.page.id === lastContentId} />
                    ) : (
                      <div className="turn-blank" />
                    )}
                    <span className="turn-cast" />
                  </div>
                ))}
                {turn.leak && (
                  <div
                    className="turn-under"
                    data-side="right"
                    style={{
                      left: turn.leak.x,
                      top: turn.leak.y,
                      width: turn.leak.w,
                      height: turn.leak.h,
                    }}
                  >
                    <div className="turn-blank" />
                  </div>
                )}
                <div
                  className="turn-leaf"
                  style={{
                    left: turn.leafX,
                    top: turn.y,
                    width: turn.w,
                    height: turn.h,
                    transformOrigin: `${turn.origin} center`,
                    transform: `translateX(${running ? 0 : turn.shift}px) rotateY(${
                      running ? (turn.dir === 1 ? -180 : 180) : 0
                    }deg)`,
                  }}
                >
                  <div className="turn-face front">
                    {turn.front ? (
                      <PageFrame
                        {...frame}
                        page={turn.front}
                        side={turn.frontSide}
                        showSources={turn.front.id === lastContentId}
                      />
                    ) : (
                      <div className="turn-blank" />
                    )}
                    <span className="turn-shade" />
                  </div>
                  <div className="turn-face back">
                    {turn.back ? (
                      <PageFrame
                        {...frame}
                        page={turn.back}
                        side={turn.backSide}
                        showSources={turn.back.id === lastContentId}
                      />
                    ) : (
                      <div className="turn-blank" />
                    )}
                    <span className="turn-shade" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            className="turn-zone start"
            type="button"
            aria-label={label("prevPage", lang)}
            disabled={idx <= 0}
            onClick={() => turnTo(-1)}
          />
          <button
            className="turn-zone end"
            type="button"
            aria-label={label("nextPage", lang)}
            disabled={idx >= spreads.length - 1}
            onClick={() => turnTo(1)}
          />
        </div>
      ) : (
        <div className="reader-scroll" ref={scrollRef}>
          {article.pages.map((p) => (
            <div
              className={`page-slot is-flow${p.role === "cover" ? " is-cover" : ""}`}
              key={p.id}
              onClick={p.role === "cover" ? () => scrollTo(2) : undefined}
              ref={(node) => {
                pageRefs.current[p.pageNumber] = node;
              }}
            >
              <PageFrame
                {...frame}
                page={p}
                side={p.pageNumber % 2 === 0 ? "left" : "right"}
                showSources={p.id === lastContentId}
              />
            </div>
          ))}
        </div>
      )}

      {toc && (
        <nav className="reader-toc" aria-label={label("contents", lang)}>
          <h4>{label("contents", lang)}</h4>
          <ol>
            {tocPages.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => jumpTo(p.pageNumber)}>
                  <span className="n">{String(p.pageNumber).padStart(2, "0")}</span>
                  <span>{p.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className={`reader-controls${controls ? "" : " is-hidden"}`}>
        <div className="reader-isle">
          <button
            type="button"
            className="count count-jump"
            title={label("backToCover", lang)}
            aria-label={label("backToCover", lang)}
            disabled={wide ? idx <= 0 : page <= 1}
            onClick={() => (wide ? jumpTo(1) : scrollTo(1))}
          >
            {wide ? counter : page} / {totalPages}
          </button>
          <button
            type="button"
            aria-pressed={toc}
            onClick={() => setToc((v) => !v)}
            title={label("contents", lang)}
          >
            ☰
          </button>
          <button type="button" onClick={toggleSave} aria-pressed={isSaved}>
            {isSaved ? "★" : "☆"}
          </button>
          <button type="button" onClick={share}>
            {copied ? label("shareCopied", lang) : label("share", lang)}
          </button>
          <button type="button" onClick={() => setSheet(sheet === "comments" ? "none" : "comments")}>
            ✎ <span className="count">{comments.length}</span>
          </button>
        </div>
      </div>

      <div className="reader-dock start">
        <button
          className="reader-turn"
          type="button"
          disabled={wide ? idx <= 0 : page <= 1}
          aria-label={label("prevPage", lang)}
          onClick={() => (wide ? turnTo(-1) : scrollTo(page - 1))}
        >
          ←
        </button>
      </div>
      <div className="reader-dock end">
        <button
          className="reader-turn"
          type="button"
          disabled={wide ? idx >= spreads.length - 1 : page >= totalPages}
          aria-label={label("nextPage", lang)}
          onClick={() => (wide ? turnTo(1) : scrollTo(page + 1))}
        >
          →
        </button>
        <button
          className="reader-turn"
          type="button"
          aria-label={controls ? label("hideControls", lang) : label("showControls", lang)}
          onClick={() => setControls((v) => !v)}
        >
          {controls ? "⋯" : "·"}
        </button>
      </div>

      {sheet === "comments" && (
        <div className="reader-sheet" role="dialog" aria-label={label("comments", lang)}>
          <div className="reader-sheet-head">
            <h3>{label("comments", lang)}</h3>
            <button className="ghost-action" type="button" onClick={() => setSheet("none")}>
              ✕
            </button>
          </div>
          {comments.length === 0 ? (
            <p className="comment-count">{label("commentsEmpty", lang)}</p>
          ) : (
            <CommentThread comments={comments} lang={lang} onReply={addComment} formId="new-comment" />
          )}
        </div>
      )}
    </main>
  );
}

function PageFrame({
  article,
  page,
  lang,
  side,
  showSources,
  comments,
  signedIn,
  onReply,
  onSignIn,
}: {
  article: ArticleDetail;
  page: Page | null;
  lang: Lang;
  side?: "left" | "right";
  showSources?: boolean;
  comments: Comment[];
  signedIn: boolean;
  onReply: (body: string) => void;
  onSignIn: () => void;
}) {
  if (!page) return <div className="magazine-page is-blank" aria-hidden />;
  const langAttr = lang === "zh" ? "zh-CN" : "en";

  if (page.role === "cover") {
    return (
      <article
        className="magazine-page issue-cover"
        lang={langAttr}
        aria-label={`Cover. ${t(article.title, lang)}`}
      >
        <img
          className="cover-media"
          src={article.coverImage || "/images/covers/cover-a1.svg"}
          alt=""
          aria-hidden
        />
        <div className="cover-scrim" />
        <header className="cover-top">
          <img className="cover-logo" src="/favicon.svg" alt="AIFA" />
          <span className="cover-number">{article.number}</span>
        </header>
        <div className="cover-stack">
          <p className="cover-kicker">{t(article.kicker, lang) || label("tagline", lang)}</p>
          <h1 className="cover-title">{t(article.title, lang)}</h1>
          <p className="cover-dek">{t(article.intro, lang)}</p>
          <p className="cover-byline">
            <span className="dot" />
            <span>{t(article.byline, lang)}</span>
            <span>{shortDate(article.date)}</span>
          </p>
        </div>
      </article>
    );
  }

  if (page.role === "back_cover") {
    return (
      <article className="magazine-page issue-back" lang={langAttr}>
        <div>
          <p className="mono-label">{label("tagline", lang)}</p>
          <div className="back-rule" />
          <h2>{t(article.title, lang)}</h2>
          <p className="mono-label">{article.number}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="magazine-page" data-page-side={side} lang={langAttr}>
      <header className="folio-head">
        <span className="folio-masthead">AIFA</span>
        <span className="folio-running">{t(article.title, lang)}</span>
      </header>
      <div className="sheet">
        {page.blocks
          .filter((b) => b.type !== "comments")
          .map((b) => (
            <BlockView key={b.id} block={b} lang={lang} />
          ))}

        {page.blocks.some((b) => b.type === "comments") && (
          <section className="page-block" id={`comments-${page.pageNumber}`}>
            <p className="mono-label">{label("comments", lang)}</p>
            {comments.length === 0 ? (
              <p className="comment-count">{label("commentsEmpty", lang)}</p>
            ) : (
              <CommentThread
                comments={comments}
                lang={lang}
                onReply={onReply}
                formId={`comment-input-${page.pageNumber}`}
              />
            )}
            {!signedIn && (
              <button className="primary-action" type="button" onClick={onSignIn}>
                {label("commentsSignIn", lang)}
              </button>
            )}
          </section>
        )}

        {showSources && article.sources.length > 0 && (
          <section className="page-block block-sources">
            <p className="mono-label">{label("sources", lang)}</p>
            <ol>
              {article.sources.map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {t(s.title, lang) || t(s.name, lang)}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
      <footer className="folio-foot">
        <span className="folio-imprint">
          {article.number} · {shortDate(article.date)}
        </span>
        <span className="folio-number">{String(page.pageNumber).padStart(2, "0")}</span>
      </footer>
    </article>
  );
}
