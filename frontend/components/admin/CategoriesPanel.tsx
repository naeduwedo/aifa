"use client";

import { useEffect, useState } from "react";
import { label } from "@/lib/i18n";
import { clientApi } from "@/lib/client-api";
import type { CategoryRec, Lang } from "@/lib/types";

const empty = (): CategoryRec => ({
  id: 0,
  slug: "",
  name: { zh: "", en: "" },
  ord: 0,
  status: "active",
  articles: 0,
});

export default function CategoriesPanel({ lang }: { lang: Lang }) {
  const [rows, setRows] = useState<CategoryRec[]>([]);
  const [draft, setDraft] = useState<CategoryRec>(empty);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const load = async () => {
    try {
      const d = await clientApi<{ categories: CategoryRec[] }>("/api/admin/categories");
      setRows(d.categories || []);
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

  const payload = (r: CategoryRec) => ({ slug: r.slug, name: r.name, ord: r.ord, status: r.status });

  const add = async () => {
    if (!draft.slug.trim() || !draft.name.zh.trim()) {
      setError(label("fieldSlug", lang));
      return;
    }
    setError("");
    try {
      await clientApi("/api/admin/categories", { method: "POST", json: payload(draft) });
      setDraft(empty());
      await load();
      flash(label("profileSaved", lang));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const patch = async (row: CategoryRec) => {
    setError("");
    try {
      await clientApi(`/api/admin/categories/${row.id}`, { method: "PATCH", json: payload(row) });
      await load();
      flash(label("profileSaved", lang));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async (row: CategoryRec) => {
    if (!confirm(label("confirmedDelete", lang))) return;
    try {
      await clientApi(`/api/admin/categories/${row.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const setRow = (id: number, fn: (r: CategoryRec) => CategoryRec) =>
    setRows((list) => list.map((r) => (r.id === id ? fn(r) : r)));

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="mono-label">{label("adminTitle", lang)}</p>
        <h1>{label("navCategories", lang)}</h1>
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
              <th>{label("ordLabel", lang)}</th>
              <th>{label("fieldStatus", lang)}</th>
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
                    value={r.name.zh}
                    onChange={(e) => setRow(r.id, (x) => ({ ...x, name: { ...x.name, zh: e.target.value } }))}
                  />
                </td>
                <td>
                  <input
                    className="inline-input"
                    value={r.name.en}
                    onChange={(e) => setRow(r.id, (x) => ({ ...x, name: { ...x.name, en: e.target.value } }))}
                  />
                </td>
                <td>
                  <input
                    className="inline-input narrow"
                    type="number"
                    value={r.ord}
                    onChange={(e) => setRow(r.id, (x) => ({ ...x, ord: Number(e.target.value) || 0 }))}
                  />
                </td>
                <td>
                  <select
                    value={r.status}
                    onChange={(e) => setRow(r.id, (x) => ({ ...x, status: e.target.value }))}
                  >
                    <option value="active">active</option>
                    <option value="hidden">hidden</option>
                  </select>
                </td>
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
            value={draft.name.zh}
            onChange={(e) => setDraft({ ...draft, name: { ...draft.name, zh: e.target.value } })}
          />
          <input
            placeholder={label("nameEnCol", lang)}
            value={draft.name.en}
            onChange={(e) => setDraft({ ...draft, name: { ...draft.name, en: e.target.value } })}
          />
          <button className="primary-action" type="button" onClick={add}>
            {label("addNew", lang)}
          </button>
        </div>
      </section>
    </div>
  );
}
