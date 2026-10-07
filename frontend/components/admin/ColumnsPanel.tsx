"use client";

import { useEffect, useState } from "react";
import { label } from "@/lib/i18n";
import { clientApi } from "@/lib/client-api";
import type { AdminUser, ColumnRec, Lang } from "@/lib/types";

interface Draft {
  slug: string;
  title: { zh: string; en: string };
  desc: { zh: string; en: string };
  authorId: number | null;
  ord: number;
  status: string;
}

const empty = (): Draft => ({
  slug: "",
  title: { zh: "", en: "" },
  desc: { zh: "", en: "" },
  authorId: null,
  ord: 0,
  status: "active",
});

const payload = (d: Omit<ColumnRec, "id" | "authorName" | "authorTitle" | "articles"> | Draft) => ({
  slug: d.slug,
  title: d.title,
  desc: d.desc,
  authorId: d.authorId,
  ord: d.ord,
  status: d.status,
});

export default function ColumnsPanel({ lang }: { lang: Lang }) {
  const [rows, setRows] = useState<ColumnRec[]>([]);
  const [authors, setAuthors] = useState<AdminUser[]>([]);
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const load = async () => {
    try {
      const d = await clientApi<{ columns: ColumnRec[] }>("/api/admin/columns");
      setRows(d.columns || []);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    load();
    clientApi<{ users: AdminUser[] }>("/api/admin/users")
      .then((d) => setAuthors((d.users || []).filter((u) => u.isAuthor || u.role === "admin")))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(""), 2500);
  };

  const add = async () => {
    if (!draft.slug.trim() || !draft.title.zh.trim()) {
      setError(label("fieldSlug", lang));
      return;
    }
    setError("");
    try {
      await clientApi("/api/admin/columns", { method: "POST", json: payload(draft) });
      setDraft(empty());
      await load();
      flash(label("profileSaved", lang));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const patch = async (row: ColumnRec) => {
    setError("");
    try {
      await clientApi(`/api/admin/columns/${row.id}`, { method: "PATCH", json: payload(row) });
      await load();
      flash(label("profileSaved", lang));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async (row: ColumnRec) => {
    if (!confirm(label("confirmedDelete", lang))) return;
    try {
      await clientApi(`/api/admin/columns/${row.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const setRow = (id: number, fn: (r: ColumnRec) => ColumnRec) =>
    setRows((list) => list.map((r) => (r.id === id ? fn(r) : r)));

  const authorSelect = (value: number | null, onChange: (v: number | null) => void) => (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}>
      <option value="">{label("selectPlaceholder", lang)}</option>
      {authors.map((u) => (
        <option key={u.id} value={u.id}>
          {u.displayName || u.email}
        </option>
      ))}
    </select>
  );

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="mono-label">{label("adminTitle", lang)}</p>
        <h1>{label("adminNavColumns", lang)}</h1>
      </header>

      {error && <p className="login-error">{error}</p>}
      {saved && <p className="login-ok">{saved}</p>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{label("slugCol", lang)}</th>
              <th>{label("nameZhCol", lang)}</th>
              <th>{label("nameEnCol", lang)}</th>
              <th>{label("authorLabel", lang)}</th>
              <th>{label("ordLabel", lang)}</th>
              <th>{label("fieldStatus", lang)}</th>
              <th>{label("statArticles", lang)}</th>
              <th>{label("actionsCol", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="cell-mono">{r.slug}</td>
                <td>
                  <input
                    className="inline-input"
                    value={r.title.zh}
                    onChange={(e) => setRow(r.id, (x) => ({ ...x, title: { ...x.title, zh: e.target.value } }))}
                  />
                </td>
                <td>
                  <input
                    className="inline-input"
                    value={r.title.en}
                    onChange={(e) => setRow(r.id, (x) => ({ ...x, title: { ...x.title, en: e.target.value } }))}
                  />
                </td>
                <td>{authorSelect(r.authorId, (v) => setRow(r.id, (x) => ({ ...x, authorId: v })))}</td>
                <td>
                  <input
                    className="inline-input narrow"
                    type="number"
                    value={r.ord}
                    onChange={(e) => setRow(r.id, (x) => ({ ...x, ord: Number(e.target.value) || 0 }))}
                  />
                </td>
                <td>
                  <select value={r.status} onChange={(e) => setRow(r.id, (x) => ({ ...x, status: e.target.value }))}>
                    <option value="active">active</option>
                    <option value="hidden">hidden</option>
                  </select>
                </td>
                <td className="cell-mono">{r.articles}</td>
                <td className="cell-actions">
                  <button className="small-action" type="button" onClick={() => patch(r)}>
                    {label("saveAction", lang)}
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

      <section className="admin-section add-row">
        <p className="mono-label">{label("addNew", lang)}</p>
        <div className="add-fields">
          <input
            placeholder={label("slugCol", lang)}
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
          />
          <input
            placeholder={label("nameZhCol", lang)}
            value={draft.title.zh}
            onChange={(e) => setDraft({ ...draft, title: { ...draft.title, zh: e.target.value } })}
          />
          <input
            placeholder={label("nameEnCol", lang)}
            value={draft.title.en}
            onChange={(e) => setDraft({ ...draft, title: { ...draft.title, en: e.target.value } })}
          />
          {authorSelect(draft.authorId, (v) => setDraft({ ...draft, authorId: v }))}
          <button className="primary-action" type="button" onClick={add}>
            {label("addNew", lang)}
          </button>
        </div>
      </section>
    </div>
  );
}
