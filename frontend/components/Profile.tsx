"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { label, t } from "@/lib/i18n";
import type { Account, AdminArticleItem, Lang } from "@/lib/types";

const flip = (lang: Lang) => `?lang=${lang}`;

export default function ProfileScreen({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState({ displayName: "", title: "", bio: "", avatarUrl: "" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<AdminArticleItem[]>([]);

  const isWriter = Boolean(account && (account.isAuthor || account.role === "admin"));

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const acc: Account | null = d.account ?? null;
        setAccount(acc);
        if (acc) {
          setForm({
            displayName: t(acc.displayName, lang),
            title: t(acc.title, lang),
            bio: t(acc.bio, lang),
            avatarUrl: acc.avatarUrl || "",
          });
        }
        setReady(true);
      })
      .catch(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isWriter) return;
    fetch("/api/articles/mine", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { articles: [] }))
      .then((d) => setMine(d.articles || []))
      .catch(() => setMine([]));
  }, [isWriter]);

  const save = async () => {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json;charset=utf-8" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setAccount(data.account);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push(`/?lang=${lang}`);
    router.refresh();
  };

  if (!ready) {
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
        <p className="mono-label">{label("accountTitle", lang)}</p>
        <h1 className="display-title">{label("signInRequiredTitle", lang)}</h1>
        <div className="gate-actions">
          <Link className="primary-action" href={`/account/login${flip(lang)}`}>
            {label("signInTitle", lang)}
          </Link>
          <Link className="ghost-action" href={`/account/register${flip(lang)}`}>
            {label("register", lang)}
          </Link>
        </div>
      </div>
    );
  }

  const roleLabel =
    account.role === "admin"
      ? label("roleAdmin", lang)
      : account.role === "author" || account.isAuthor
        ? label("roleAuthor", lang)
        : label("roleReader", lang);

  return (
    <div className="public-screen profile-screen">
      <p className="eyebrow">{label("accountTitle", lang)}</p>
      <h1 className="display-title">{label("profileTitle", lang)}</h1>
      <p className="lede">{label("profileIntro", lang)}</p>

      <div className="profile-meta">
        <div className="specs">
          <dt>{label("profileEmail", lang)}</dt>
          <dd>{account.email}</dd>
          <dt>{label("roleLabel", lang)}</dt>
          <dd>
            <span className={`badge badge-${account.role}`}>{roleLabel}</span>
            {account.verified && <span className="badge badge-ok">✓</span>}
          </dd>
          <dt>No.</dt>
          <dd>{account.userNo}</dd>
        </div>
      </div>

      <form
        className="profile-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="field">
          <label htmlFor="p-name">{label("displayNameLabel", lang)}</label>
          <input
            id="p-name"
            maxLength={60}
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="p-title">{label("titleCol", lang)}</label>
          <input
            id="p-title"
            maxLength={80}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="p-avatar">{label("avatarLabel", lang)}</label>
          <input
            id="p-avatar"
            value={form.avatarUrl}
            placeholder="/images/home/afa-logo.svg"
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="p-bio">{label("bioLabel", lang)}</label>
          <textarea
            id="p-bio"
            rows={4}
            maxLength={600}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <div className="profile-actions">
          <button className="primary-action" type="submit" disabled={busy}>
            {saved ? label("profileSaved", lang) : label("saveProfile", lang)}
          </button>
          <button className="ghost-action" type="button" onClick={signOut}>
            {label("signOut", lang)}
          </button>
        </div>
      </form>

      <section className="profile-section">
        <p className="mono-label">{label("profileLinks", lang)}</p>
        <div className="gate-actions">
          <Link className="ghost-action" href={`/library${flip(lang)}`}>
            {label("library", lang)}
          </Link>
          {isWriter && (
            <Link className="primary-action" href={`/account/publish${flip(lang)}`}>
              {label("newArticle", lang)}
            </Link>
          )}
          {account.role === "admin" && (
            <Link className="primary-action" href={`/admin${flip(lang)}`}>
              {label("adminConsole", lang)}
            </Link>
          )}
        </div>
      </section>

      {isWriter && (
        <section className="profile-section">
          <p className="mono-label">{label("myArticles", lang)}</p>
          {mine.length === 0 ? (
            <p className="lede">{label("noArticles", lang)}</p>
          ) : (
            <div className="article-index">
              {mine.map((a) => (
                <Link key={a.id} href={`/account/publish?id=${a.id}${flip(lang)}`}>
                  <span className="article-index-title">{t(a.title, lang) || a.slug}</span>
                  <span className="article-index-meta">
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                    {a.date}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
