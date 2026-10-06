"use client";

import Link from "next/link";
import { useState } from "react";
import { label, t } from "@/lib/i18n";
import type { Card, Lang, SiteVideo } from "@/lib/types";

export default function AboutBoard({
  videos,
  articles,
  lang,
}: {
  videos: SiteVideo[];
  articles: Card[];
  lang: Lang;
}) {
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [withContext, setWithContext] = useState(true);
  const [identity, setIdentity] = useState<"anonymous" | "signed">("anonymous");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({
        body,
        identity,
        contextUrl: withContext ? window.location.href : "",
      }),
    }).catch(() => null);
    if (res?.ok) {
      setSent(true);
      setBody("");
    }
  };

  return (
    <main className="about-shell" lang={lang === "zh" ? "zh-CN" : "en"}>
      <header className="about-head">
        <div>
          <p className="mono-label">{label("tagline", lang)}</p>
          <h1 className="display-title">{label("aboutTitle", lang)}</h1>
        </div>
        <p className="lede">
          {lang === "zh"
            ? "AIFA 是一份关于人工智能、投资与教育的双语刊物。每日一篇长文，配研究报告、课程目录与出海观察。所有演示内容均为本克隆项目撰写。"
            : "AIFA is a bilingual magazine on artificial intelligence, investing and education: one long essay a day, plus research reports, a course directory and dispatches for going global. All demo copy in this clone was written for this project."}
        </p>
      </header>

      <section className="video-list">
        {videos.map((v, i) => (
          <li className="video-item" key={v.id}>
            <div className="video-thumb">
              <img src={v.cover || "/images/about/video.svg"} alt={t(v.title, lang)} />
              <span className="play">
                <span aria-hidden="true">▶</span>
              </span>
            </div>
            <div className="video-meta">
              <span className="no">VIDEO {String(i + 1).padStart(2, "0")}</span>
              <b>{t(v.title, lang)}</b>
              <p>{t(v.summary, lang)}</p>
            </div>
          </li>
        ))}
      </section>

      <section className="related">
        <h3>{label("relatedReading", lang)}</h3>
        {articles.map((a) => (
          <Link key={a.slug} href={`${a.href}?lang=${lang}`}>
            <span>{t(a.title, lang)}</span>
            <span className="mono-label">{a.date}</span>
          </Link>
        ))}
      </section>

      <section className="feedback">
        <h2>{label("feedbackTitle", lang)}</h2>
        <form onSubmit={send}>
          <label className="sr-only" htmlFor="feedback">
            {label("feedbackTitle", lang)}
          </label>
          <textarea
            id="feedback"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={label("feedbackPlaceholder", lang)}
            required
          />
          <div className="seg" role="radiogroup">
            <button
              type="button"
              role="radio"
              aria-checked={identity === "anonymous"}
              onClick={() => setIdentity("anonymous")}
            >
              {label("anonymous", lang)}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={identity === "signed"}
              onClick={() => setIdentity("signed")}
            >
              {label("signed", lang)}
            </button>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={withContext}
              onChange={(e) => setWithContext(e.target.checked)}
            />
            {label("includeContext", lang)}
          </label>
          <button className="primary-action" type="submit">
            {sent ? "✓" : label("sendFeedback", lang)}
          </button>
        </form>
      </section>
    </main>
  );
}
