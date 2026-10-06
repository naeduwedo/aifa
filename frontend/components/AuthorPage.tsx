"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { label, t } from "@/lib/i18n";
import type { AuthorProfile, Lang } from "@/lib/types";

export default function AuthorPage({
  profile,
  lang,
}: {
  profile: AuthorProfile | null;
  lang: Lang;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetch("/api/shelf", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setFollowing(Boolean(d?.subscriptions?.includes(profile.userNo))))
      .catch(() => {});
  }, [profile]);

  if (!profile) {
    return (
      <main className="public-shell">
        <div className="public-screen">
          <p className="mono-label">404</p>
          <h1 className="display-title">Not found</h1>
        </div>
      </main>
    );
  }

  const toggle = async () => {
    const res = await fetch(`/api/authors/${profile.userNo}/subscribe`, {
      method: following ? "DELETE" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: "{}",
    });
    if (res.status === 401) {
      router.push(`/account/login?lang=${lang}`);
      return;
    }
    setFollowing(!following);
  };

  return (
    <main className="public-shell" lang={lang === "zh" ? "zh-CN" : "en"}>
      <div className="public-screen">
        <header className="column-hero">
          <div className="column-avatar-lg">
            {profile.avatar ? <img src={profile.avatar} alt="" /> : null}
          </div>
          <div>
            <p className="mono-label">{label("columnsLabel", lang)}</p>
            <h1 className="column-name">{t(profile.name, lang)}</h1>
            <p className="column-title">{t(profile.title, lang)}</p>
            <p className="column-bio">{t(profile.introduction, lang)}</p>
            <div className="column-actions">
              <button className="primary-action" type="button" onClick={toggle}>
                {following ? label("subscribed", lang) : label("subscribe", lang)}
              </button>
              <span className="mono-label">
                {profile.articles.length} {label("articleCount", lang)}
              </span>
            </div>
          </div>
        </header>

        <section className="story-flow">
          <div className="flow-heading">
            <h2 className="headline">{label("columnsLabel", lang)}</h2>
            <span className="mono-label">{label("updated", lang)}</span>
          </div>
          <ul className="article-index">
            {profile.articles.map((card) => (
              <li key={card.slug}>
                <Link href={`${card.href}?lang=${lang}`}>
                  <span className="date">{card.date}</span>
                  <span>
                    <p className="headline">{t(card.title, lang)}</p>
                    <p className="dek">{t(card.summary, lang)}</p>
                  </span>
                  <span className="meta">
                    {lang === "zh" ? card.readingMinutesZh : card.readingMinutesEn}{" "}
                    {label("minutes", lang)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
