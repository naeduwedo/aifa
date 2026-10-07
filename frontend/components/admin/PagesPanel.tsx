"use client";

import { useEffect, useState } from "react";
import { label } from "@/lib/i18n";
import { clientApi } from "@/lib/client-api";
import type { Lang, SitePageRec } from "@/lib/types";

const blank = (): SitePageRec => ({
  id: 0,
  slug: "",
  title: { zh: "", en: "" },
  summary: { zh: "", en: "" },
  body: "",
  status: "draft",
  updatedAt: "",
});

const payload = (p: SitePageRec) => ({
  slug: p.slug,
  title: p.title,
  summary: p.summary,
  body: p.body,
  status: p.status,
});

export default function PagesPanel({ lang }: { lang: Lang }) {
  const [rows, setRows] = useState<SitePageRec[]>([]);
  const [selected, setSelected] = useState<SitePageRec | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const load = async () => {
    try {
      const d = await clientApi<{ pages: SitePageRec[] }>("/api/admin/pages");
      setRows(d.pages || []);
    } catch (e) {
      setError((e as Error).message);
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

  const save = async () => {
    if (!selected) return;
    if (!selected.slug.trim()) {
      setError(label("fieldSlug", lang));
      return;
    }
    setError("");
    try {
      if (selected.id > 0) {
        await clientApi(`/api/admin/pages/${selected.id}`, { method: "PATCH", json: payload(selected) });
      } else {
        const d = await clientApi<{ id: number }>("/api/admin/pages", { method: "POST", json: payload(selected) });
        setSelected({ ...selected, id: d.id });
      }
      await load();
      flash(label("profileSaved", lang));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async (p: SitePageRec) => {
    if (!confirm(label("confirmedDelete", lang))) return;
    try {
      await clientApi(`/api/admin/pages/${p.id}`, { method: "DELETE" });
      setSelected(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const setSel = (fn: (p: SitePageRec) => SitePageRec) => setSelected((p) => (p ? fn(p) : p));

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="mono-label">{label("adminTitle", lang)}</p>
          <h1>{label("navPages", lang)}</h1>
          <p className="lede">{label("pagesPublicHint", lang)}</p>
        </div>
        <button className="primary-action" type="button" onClick={() => setSelected(blank())}>
          {label("newPage", lang)}
        </button>
      </header>

      {error && <p className="login-error">{error}</p>}
      {saved && <p className="login-ok">{saved}</p>}

      <div className="pages-layout">
        <div className="table-wrap pages-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>{label("slugCol", lang)}</th>
                <th>{label("fieldTitle", lang)}</th>
                <th>{label("fieldStatus", lang)}</th>
                <th>{label("fieldUpdatedAt", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={selected?.id === r.id ? "is-selected" : undefined}
                  onClick={() => setSelected(r)}
                >
                  <td className="cell-mono">{r.slug}</td>
                  <td>{r.title.zh || r.title.en}</td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </td>
                  <td className="cell-mono">{r.updatedAt?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <section className="admin-section page-editor">
            <p className="mono-label">
              {selected.id > 0 ? label("editAction", lang) : label("newPage", lang)}
            </p>
            <div className="field">
              <label htmlFor="pg-slug">{label("slugCol", lang)}</label>
              <input
                id="pg-slug"
                value={selected.slug}
                onChange={(e) => setSel((p) => ({ ...p, slug: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="pg-tzh">{label("fieldTitle", lang)} (zh)</label>
              <input
                id="pg-tzh"
                value={selected.title.zh}
                onChange={(e) => setSel((p) => ({ ...p, title: { ...p.title, zh: e.target.value } }))}
              />
            </div>
            <div className="field">
              <label htmlFor="pg-ten">{label("fieldTitle", lang)} (en)</label>
              <input
                id="pg-ten"
                value={selected.title.en}
                onChange={(e) => setSel((p) => ({ ...p, title: { ...p.title, en: e.target.value } }))}
              />
            </div>
            <div className="field">
              <label htmlFor="pg-szh">{label("summaryZhLabel", lang)}</label>
              <input
                id="pg-szh"
                value={selected.summary.zh}
                onChange={(e) => setSel((p) => ({ ...p, summary: { ...p.summary, zh: e.target.value } }))}
              />
            </div>
            <div className="field">
              <label htmlFor="pg-sen">{label("summaryEnLabel", lang)}</label>
              <input
                id="pg-sen"
                value={selected.summary.en}
                onChange={(e) => setSel((p) => ({ ...p, summary: { ...p.summary, en: e.target.value } }))}
              />
            </div>
            <div className="field">
              <label htmlFor="pg-body">{label("bodyLabel", lang)}</label>
              <textarea
                id="pg-body"
                rows={12}
                value={selected.body}
                onChange={(e) => setSel((p) => ({ ...p, body: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="pg-status">{label("fieldStatus", lang)}</label>
              <select
                id="pg-status"
                value={selected.status}
                onChange={(e) => setSel((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </div>
            <div className="editor-actions">
              <button className="primary-action" type="button" onClick={save}>
                {label("saveAction", lang)}
              </button>
              {selected.id > 0 && (
                <button className="ghost-action" type="button" onClick={() => remove(selected)}>
                  {label("deleteLabel", lang)}
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
