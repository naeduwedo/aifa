"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { label, t } from "@/lib/i18n";
import type { AdminStats, AdminUser, Card, Lang } from "@/lib/types";

export default function Dashboard({ lang }: { lang: Lang }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<Card[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setStats(d.stats);
        setRecent(d.recentArticles || []);
        setUsers(d.recentUsers || []);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  const cards: { key: keyof AdminStats; i18n: string }[] = [
    { key: "users", i18n: "statUsers" },
    { key: "authors", i18n: "statAuthors" },
    { key: "articles", i18n: "statArticles" },
    { key: "published", i18n: "statPublished" },
    { key: "drafts", i18n: "statDrafts" },
    { key: "comments", i18n: "statComments" },
    { key: "subscribers", i18n: "statSubscribers" },
    { key: "columns", i18n: "statColumns" },
    { key: "categories", i18n: "statCategories" },
    { key: "sitePages", i18n: "statPages" },
    { key: "viewsToday", i18n: "statViews" },
  ];

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="mono-label">{label("adminTitle", lang)}</p>
        <h1>{label("navDashboard", lang)}</h1>
      </header>

      {error && <p className="login-error">{error}</p>}

      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.key}>
            <span className="stat-value">{stats ? stats[c.key] : "—"}</span>
            <span className="stat-label">{label(c.i18n as any, lang)}</span>
          </div>
        ))}
      </div>

      <section className="admin-section">
        <div className="admin-section-head">
          <p className="mono-label">{label("recentActivity", lang)}</p>
          <Link className="small-action" href={`/admin/articles?lang=${lang}`}>
            {label("navArticles", lang)}
          </Link>
        </div>
        <div className="data-list">
          {recent.map((a) => (
            <Link key={a.articleId} href={`/account/publish?id=${(a.articleId || "").replace("article-", "")}&lang=${lang}`}>
              <span className="data-list-main">{t(a.title, lang) || a.slug}</span>
              <span className="data-list-meta">
                <span className={`badge badge-${a.status}`}>{a.status}</span>
                {a.date}
              </span>
            </Link>
          ))}
          {recent.length === 0 && <p className="lede">—</p>}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <p className="mono-label">{label("recentUsers", lang)}</p>
          <Link className="small-action" href={`/admin/users?lang=${lang}`}>
            {label("navUsers", lang)}
          </Link>
        </div>
        <div className="data-list">
          {users.map((u) => (
            <Link key={u.id} href={`/admin/users?lang=${lang}`}>
              <span className="data-list-main">{u.displayName || u.email}</span>
              <span className="data-list-meta">
                <span className={`badge badge-${u.role}`}>{u.role}</span>
                {u.email}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
