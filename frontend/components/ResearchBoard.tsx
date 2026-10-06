"use client";

import { useMemo, useState } from "react";
import { label, t } from "@/lib/i18n";
import type { Lang, ResearchResource } from "@/lib/types";

export default function ResearchBoard({
  resources,
  lang,
}: {
  resources: ResearchResource[];
  lang: Lang;
}) {
  const ordered = useMemo(
    () =>
      [...resources].sort(
        (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))
      ),
    [resources]
  );
  const [active, setActive] = useState(0);
  const [email, setEmail] = useState("");
  const [lead, setLead] = useState({ name: "", company: "", jobTitle: "" });
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");

  const featured = ordered[0];
  const current = ordered[active] ?? null;

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({ email, topic: "research" }),
    }).catch(() => null);
    setNote(res?.ok ? "✓" : "×");
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    const res = await fetch(`/api/research/${encodeURIComponent(current.slug)}/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({ email, ...lead }),
    }).catch(() => null);
    setReady(Boolean(res?.ok));
  };

  return (
    <main className="public-shell" lang={lang === "zh" ? "zh-CN" : "en"}>
      <div className="public-screen">
        <header className="directory-header">
          <div>
            <p className="mono-label">{label("navResearch", lang)}</p>
            <h1 className="display-title">{label("libraryTitle", lang)}</h1>
          </div>
          <p className="lede">{label("newsletterEyebrow", lang)}</p>
        </header>

        {featured && (
          <section className="research-hero">
            <div>
              <p className="mono-label">{label("featuredLabel", lang)}</p>
              <h2>{t(featured.title, lang)}</h2>
              <p className="lede">{t(featured.description, lang)}</p>

              <dl className="specs">
                <dt>{label("purpose", lang)}</dt>
                <dd>{t(featured.purpose, lang)}</dd>
                <dt>{label("scope", lang)}</dt>
                <dd>{t(featured.scope, lang)}</dd>
                <dt>{label("edition", lang)}</dt>
                <dd>{featured.edition} · {featured.publishedAt} · {featured.pageCount}p</dd>
              </dl>

              <p className="mono-label">{t(featured.category, lang)}</p>
            </div>

            <div className="cover-stack">
              <div
                className="cover-card"
                style={{
                  background: featured.cover?.background || "var(--navy)",
                  color: featured.cover?.foreground || "#fff",
                  border: `1px solid ${featured.cover?.accent || "var(--gold)"}`,
                }}
              >
                <span className="mono-label">{featured.accessLevel}</span>
                <strong className="display-title">{t(featured.title, lang)}</strong>
                <span className="mono-label">{featured.edition}</span>
                {featured.cover?.image && (
                  <img
                    src={featured.cover.image}
                    alt=""
                    style={{ width: "100%", height: 180, objectFit: "cover", opacity: 0.9 }}
                  />
                )}
              </div>
            </div>
          </section>
        )}

        <section className="catalog">
          <h2>{label("libraryTitle", lang)}</h2>
          {ordered.map((r, i) => (
            <button
              key={r.slug}
              className="catalog-row"
              type="button"
              onClick={() => { setActive(i); setReady(false); }}
            >
              <span className="catalog-index">{String(i + 1).padStart(2, "0")}</span>
              <span className="catalog-copy">
                <small>{t(r.category, lang)} · {r.publishedAt}</small>
                <strong>{t(r.title, lang)}</strong>
                <p>{t(r.description, lang)}</p>
              </span>
              <span className="catalog-action">
                {active === i ? label("viewResource", lang) : label("getTheResource", lang)}
              </span>
            </button>
          ))}
        </section>

        {current && (
          <section className="newsletter">
            <div>
              <p className="mono-label">
                {ready ? label("readyTitle", lang) : label("formTitle", lang)}
              </p>
              <h2>{t(current.title, lang)}</h2>
              {!ready && (
                <form onSubmit={submitLead} className="field">
                  <label htmlFor="r-email">{label("email", lang)}</label>
                  <input
                    id="r-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label htmlFor="r-name">{label("name", lang)}</label>
                  <input
                    id="r-name"
                    value={lead.name}
                    onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  />
                  <label htmlFor="r-company">{label("company", lang)}</label>
                  <input
                    id="r-company"
                    value={lead.company}
                    onChange={(e) => setLead({ ...lead, company: e.target.value })}
                  />
                  <label htmlFor="r-job">{label("jobTitle", lang)}</label>
                  <input
                    id="r-job"
                    value={lead.jobTitle}
                    onChange={(e) => setLead({ ...lead, jobTitle: e.target.value })}
                  />
                  <button className="primary-action" type="submit">
                    {label("submit", lang)}
                  </button>
                </form>
              )}
              {ready && <p className="lede">{label("readyTitle", lang)}</p>}
            </div>

            <div>
              <p className="mono-label">{label("newsletterTitle", lang)}</p>
              <form onSubmit={subscribe} className="field">
                <label htmlFor="nl">{label("email", lang)}</label>
                <input
                  id="nl"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="ghost-action" type="submit">
                  {label("notifyMe", lang)} {note}
                </button>
              </form>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
