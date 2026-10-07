"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { label } from "@/lib/i18n";
import { clientApi } from "@/lib/client-api";
import { toWrite } from "@/lib/write";
import type { AdminArticleItem, ArticleEditPayload, ArticleWrite, Lang } from "@/lib/types";

export default function ArticlesPanel({ lang }: { lang: Lang }) {
  const [rows, setRows] = useState<AdminArticleItem[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async (query = "", st = "") => {
    setBusy(true);
    setError("");
    try {
      const d = await clientApi<{ articles: AdminArticleItem[] }>(
        `/api/admin/articles?status=${encodeURIComponent(st)}&q=${encodeURIComponent(query)}`,
      );
      setRows(d.articles || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(""), 2500);
  };

  const toggle = async (row: AdminArticleItem) => {
    const next = row.status === "published" ? "draft" : "published";
    setBusy(true);
    setError("");
    try {
      const edit = await clientApi<ArticleEditPayload>(`/api/articles/edit?id=${row.id}`);
      const write: ArticleWrite = toWrite(edit, next);
      await clientApi(`/api/articles/${row.id}`, { method: "PATCH", json: write });
      setRows((list) => list.map((x) => (x.id === row.id ? { ...x, status: next } : x)));
      flash(label("profileSaved", lang));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: AdminArticleItem) => {
    if (!confirm(label("confirmedDelete", lang))) return;
    try {
      await clientApi(`/api/admin/articles/${row.id}`, { method: "DELETE" });
      setRows((list) => list.filter((x) => x.id !== row.id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="mono-label">{label("adminTitle", lang)}</p>
          <h1>{label("navArticles", lang)}</h1>
        </div>
        <Link className="primary-action" href={`/account/publish?lang=${lang}`}>
          {label("writeCta", lang)}
        </Link>
      </header>

      <form
        className="admin-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          load(q, status);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={label("searchArticles", lang)}
          aria-label={label("searchArticles", lang)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={label("filterStatus", lang)}>
          <option value="">{label("allStatuses", lang)}</option>
          <option value="draft">{label("statusDraft", lang)}</option>
          <option value="scheduled">{label("statusScheduled", lang)}</option>
          <option value="published">{label("statusPublished", lang)}</option>
        </select>
        <button className="small-action" type="submit" disabled={busy}>
          {label("searchBtn", lang)}
        </button>
      </form>

      {error && <p className="login-error">{error}</p>}
      {saved && <p className="login-ok">{saved}</p>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{label("fieldTitle", lang)}</th>
              <th>{label("slugCol", lang)}</th>
              <th>{label("fieldDate", lang)}</th>
              <th>{label("fieldStatus", lang)}</th>
              <th>{label("authorLabel", lang)}</th>
              <th>{label("categoryLabel", lang)}</th>
              <th>{label("viewsLabel", lang)}</th>
              <th>{label("actionsCol", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.title.zh || r.title.en}</td>
                <td className="cell-mono">{r.slug}</td>
                <td className="cell-mono">{r.date}</td>
                <td>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </td>
                <td>{r.authorName || "—"}</td>
                <td>{r.category.zh || r.category.en || "—"}</td>
                <td className="cell-mono">{r.viewCount}</td>
                <td className="cell-actions">
                  <Link className="small-action" href={`/account/publish?id=${r.id}&lang=${lang}`}>
                    {label("editAction", lang)}
                  </Link>
                  <button
                    className="small-action"
                    type="button"
                    disabled={busy}
                    onClick={() => toggle(r)}
                  >
                    {r.status === "published" ? label("unpublishAction", lang) : label("publishAction", lang)}
                  </button>
                  <button className="mini-btn danger" type="button" onClick={() => remove(r)}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
