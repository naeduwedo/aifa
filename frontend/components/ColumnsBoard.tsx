"use client";

import Link from "next/link";
import { label, t } from "@/lib/i18n";
import type { AuthorProfile, Lang } from "@/lib/types";

export default function ColumnsBoard({
  profiles,
  lang,
}: {
  profiles: AuthorProfile[];
  lang: Lang;
}) {
  return (
    <main className="public-shell" lang={lang === "zh" ? "zh-CN" : "en"}>
      <div className="public-screen">
        <header className="directory-header">
          <p className="mono-label">{label("columnsLabel", lang)}</p>
          <h1 className="display-title">{label("columnsLabel", lang)}</h1>
          <p className="lede">{label("columnistCount", lang).replace("{count}", String(profiles.length))}</p>
        </header>

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

        {profiles.length === 0 && <p className="mono-label">{label("emptyPrimary", lang)}</p>}
      </div>
    </main>
  );
}
