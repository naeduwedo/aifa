"use client";

import Link from "next/link";
import { label, t } from "@/lib/i18n";
import type { AuthorProfile, Lang, ManagedColumn } from "@/lib/types";

export default function ColumnsBoard({
  profiles,
  columns = [],
  lang,
}: {
  profiles: AuthorProfile[];
  columns?: ManagedColumn[];
  lang: Lang;
}) {
  const active = columns.filter((c) => c.status === "active");
  return (
    <main className="public-shell" lang={lang === "zh" ? "zh-CN" : "en"}>
      <div className="public-screen">
        <header className="directory-header">
          <p className="mono-label">{label("columnsLabel", lang)}</p>
          <h1 className="display-title">{label("columnsLabel", lang)}</h1>
          <p className="lede">{label("columnistCount", lang).replace("{count}", String(profiles.length))}</p>
        </header>

        {active.length > 0 && (
          <section className="site-columns">
            {active.map((c) => (
              <article className="site-column" key={c.id}>
                <header className="site-column-head">
                  <div>
                    <p className="mono-label">{t(c.title, lang)}</p>
                    <p className="lede">{t(c.desc, lang)}</p>
                  </div>
                  <span className="roster-count">
                    {c.articles.length} {label("articleCount", lang)}
                  </span>
                </header>
                {c.articles.length > 0 && (
                  <ul className="column-list">
                    {c.articles.map((a) => (
                      <li key={a.articleId}>
                        <Link href={`${a.href}?lang=${lang}`}>
                          <span className="column-list-title">{t(a.title, lang)}</span>
                          <span className="column-list-meta">
                            {t(a.author, lang)} · {a.date}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </section>
        )}

        <ul className="roster">
          {profiles.map((p) => (
            <li className="roster-item" key={p.id}>
              <Link className="roster-link" href={`/u/${p.userNo}?lang=${lang}`}>
                <span className="roster-avatar">{p.avatar ? <img src={p.avatar} alt="" /> : null}</span>
                <span>
                  <p className="roster-name">{t(p.name, lang)}</p>
                  <p className="roster-title">{t(p.title, lang)}</p>
                  <p className="roster-title">{t(p.introduction, lang)}</p>
                </span>
                <span className="roster-count">
                  {p.articles.length} {label("articleCount", lang)}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {profiles.length === 0 && active.length === 0 && (
          <p className="mono-label">{label("emptyPrimary", lang)}</p>
        )}
      </div>
    </main>
  );
}
