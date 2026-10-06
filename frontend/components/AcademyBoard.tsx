"use client";

import { useState } from "react";
import { label, t } from "@/lib/i18n";
import type { AcademyShelf, Lang } from "@/lib/types";

const AUDIENCES = ["Founders", "Operators", "Students"] as const;

export default function AcademyBoard({
  shelves,
  lang,
}: {
  shelves: AcademyShelf[];
  lang: Lang;
}) {
  const [audience, setAudience] = useState<string>("");

  return (
    <main className="public-shell" lang={lang === "zh" ? "zh-CN" : "en"}>
      <div className="public-screen">
        <header className="directory-header">
          <div>
            <p className="mono-label">{label("navAcademy", lang)}</p>
            <h1 className="display-title">
              <span>{label("academyTitle1", lang)}</span>
              <span>{label("academyTitle2", lang)}</span>
            </h1>
          </div>
          <div>
            <p className="lede">{label("onlineAdvisory", lang)}</p>
            <div className="seg" role="radiogroup" aria-label={label("browseByAudience", lang)}>
              <button
                type="button"
                role="radio"
                aria-checked={audience === ""}
                onClick={() => setAudience("")}
              >
                {label("navAcademy", lang)}
              </button>
              {AUDIENCES.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={audience === a}
                  onClick={() => setAudience(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </header>

        {shelves.map((shelf) => (
          <section className="shelf-section" key={shelf.id}>
            <header className="shelf-heading">
              <span className="idx">{shelf.index}</span>
              <div>
                <h2>{t(shelf.title, lang)}</h2>
                <p>{t(shelf.description, lang)}</p>
              </div>
              <small>{fill(label("programs", lang), shelf.courses.length)}</small>
            </header>

            <div className="poster-grid">
              {shelf.courses.map((course) => (
                <article className="poster" key={course.id}>
                  <figure className="poster-figure">
                    <img src={course.cover?.src || "/images/academy/course.svg"} alt={t(course.cover?.alt, lang)} />
                    <div className="poster-over">
                      <span className="poster-tag">{t(course.tag, lang)}</span>
                      <h3>{t(course.name, lang)}</h3>
                      <span className="poster-tag">{t(course.institution, lang)}</span>
                    </div>
                  </figure>
                  <div className="poster-body">
                    <p className="poster-positioning">{t(course.positioning, lang)}</p>
                    <dl className="poster-meta">
                      {course.fields.map((f) => (
                        <div key={f.key}>
                          <dt>{t(f.label, lang)}</dt>
                          <dd>{t(f.value, lang)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <a className="poster-action" href="#academy-advisory">
                    {label("viewProgram", lang)}
                    <span aria-hidden="true">→</span>
                  </a>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="path-cards" id="academy-advisory">
          {["Founders", "Operators", "Students"].map((a, i) => (
            <div className="path-card" key={a}>
              <span className="idx">{String(i + 1).padStart(2, "0")}</span>
              <strong>{a}</strong>
              <p>{label("browseByAudience", lang)}</p>
              <span className="arrow" aria-hidden="true">→</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function fill(template: string, count: number) {
  return template.replace("{count}", String(count));
}
