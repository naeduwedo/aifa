"use client";

import { t } from "@/lib/i18n";
import type { GoGlobalActivity, Lang } from "@/lib/types";

export default function GoGlobalBoard({
  activity,
  lang,
}: {
  activity: GoGlobalActivity | null;
  lang: Lang;
}) {
  const copy = (activity?.copy?.[lang] || {}) as Record<string, any>;
  const services = activity?.services ?? [];
  const images = activity?.images ?? [];
  const points: string[] = copy.points || [];

  return (
    <main className="public-shell" lang={lang === "zh" ? "zh-CN" : "en"}>
      <div className="public-screen">
        <section className="dispatch-hero">
          <img
            src={activity?.hero?.src || "/images/global/hero.svg"}
            alt={t(activity?.hero?.alt, lang)}
          />
          <p className="hero-credit">{t(activity?.hero?.credit, lang)}</p>

          <div className="headline">
            <p className="mono-label">{copy.eyebrow || copy.stories}</p>
            <h1>
              <span>{copy.titleLead || "GO GLOBAL"}</span>
              {copy.titleTail ? <span>{copy.titleTail}</span> : null}
            </h1>
            <p className="lede">{copy.introduction}</p>
          </div>
        </section>

        <section className="route-board">
          <div className="route-topline">
            <span>{copy.routeManifest}</span>
            <span>{copy.edition}</span>
          </div>
          <div className="route-track">
            <span>{copy.routeFrom || "—"}</span>
            <span className="line" aria-hidden="true" />
            <span>{copy.routeTo || "—"}</span>
          </div>
          <ol className="manifest">
            {points.map((p, i) => (
              <li key={i}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <strong>{p}</strong>
                </span>
              </li>
            ))}
          </ol>
          <div className="route-credits">
            <small>{(copy.photoCount || "").replace("{count}", String(images.length))}</small>
            <small>{copy.partner}</small>
            <small>{copy.delegation}</small>
          </div>
        </section>

        <section className="gallery">
          <div className="gallery-rail">
            {images.map((img, i) => (
              <img key={i} src={img.src || "/images/global/dispatch.svg"} alt={t(img.alt, lang)} />
            ))}
          </div>
          <div className="gallery-caption">
            {t(images[0]?.caption, lang) || copy.galleryLabel}
            <small>{t(images[0]?.credit, lang)}</small>
          </div>
        </section>

        <section className="desk">
          <p className="mono-label">{copy.services}</p>
          <h2>{copy.services}</h2>
          <p className="lede">{copy.servicesIntroduction}</p>
          <div className="service-list">
            {services.map((s, i) => (
              <button className="service-row" key={s.id} type="button">
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span>{t(s.label, lang)}</span>
                  <em>{copy.requestAdvice}</em>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
          <p className="compliance-note">{copy.complianceNote}</p>
        </section>
      </div>
    </main>
  );
}
