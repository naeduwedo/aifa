"use client";

import { useEffect, useState } from "react";
import { label } from "@/lib/i18n";
import { clientApi } from "@/lib/client-api";
import type { AdminUser, Lang } from "@/lib/types";

export default function UsersPanel({ lang }: { lang: Lang }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async (query = "") => {
    setBusy(true);
    setError("");
    try {
      const d = await clientApi<{ users: AdminUser[] }>(`/api/admin/users?q=${encodeURIComponent(query)}`);
      setUsers(d.users || []);
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

  const patchUser = async (u: AdminUser, body: Record<string, unknown>, reload = false) => {
    setError("");
    try {
      await clientApi(`/api/admin/users/${u.id}`, { method: "PATCH", json: body });
      if (reload) load(q);
      else
        setUsers((list) =>
          list.map((x) =>
            x.id === u.id
              ? {
                  ...x,
                  ...(typeof body.displayName === "string" ? { displayName: body.displayName } : {}),
                  ...(typeof body.title === "string" ? { title: body.title } : {}),
                  ...(typeof body.role === "string" ? { role: body.role } : {}),
                  ...(typeof body.verified === "boolean" ? { verified: body.verified } : {}),
                  ...(typeof body.isAuthor === "boolean" ? { isAuthor: body.isAuthor } : {}),
                }
              : x,
          ),
        );
    } catch (e) {
      setError((e as Error).message);
      load(q);
    }
  };

  const remove = async (u: AdminUser) => {
    if (!confirm(label("confirmedDelete", lang))) return;
    try {
      await clientApi(`/api/admin/users/${u.id}`, { method: "DELETE" });
      setUsers((list) => list.filter((x) => x.id !== u.id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="mono-label">{label("adminTitle", lang)}</p>
        <h1>{label("navUsers", lang)}</h1>
      </header>

      <form
        className="admin-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={label("searchUsers", lang)}
          aria-label={label("searchUsers", lang)}
        />
        <button className="small-action" type="submit" disabled={busy}>
          {label("searchBtn", lang)}
        </button>
      </form>

      {error && <p className="login-error">{error}</p>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{label("emailCol", lang)}</th>
              <th>{label("nameCol", lang)}</th>
              <th>{label("titleCol", lang)}</th>
              <th>{label("roleLabel", lang)}</th>
              <th>{label("verifiedLabel", lang)}</th>
              <th>{label("isWriterLabel", lang)}</th>
              <th>{label("statArticles", lang)}</th>
              <th>{label("createdAtCol", lang)}</th>
              <th>{label("actionsCol", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="cell-mono">{u.email}</td>
                <td>
                  <input
                    className="inline-input"
                    defaultValue={u.displayName}
                    onBlur={(e) => {
                      if (e.target.value !== u.displayName) patchUser(u, { displayName: e.target.value });
                    }}
                  />
                </td>
                <td>
                  <input
                    className="inline-input"
                    defaultValue={u.title}
                    onBlur={(e) => {
                      if (e.target.value !== u.title) patchUser(u, { title: e.target.value });
                    }}
                  />
                </td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => patchUser(u, { role: e.target.value })}
                    disabled={u.role === "admin"}
                  >
                    <option value="reader">{label("roleReader", lang)}</option>
                    <option value="author">{label("roleAuthor", lang)}</option>
                    <option value="admin">{label("roleAdmin", lang)}</option>
                  </select>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={u.verified}
                    onChange={(e) => patchUser(u, { verified: e.target.checked })}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={u.isAuthor}
                    onChange={(e) => patchUser(u, { isAuthor: e.target.checked })}
                  />
                </td>
                <td className="cell-mono">{u.articles}</td>
                <td className="cell-mono">{u.createdAt.slice(0, 10)}</td>
                <td>
                  <button className="mini-btn danger" type="button" onClick={() => remove(u)}>
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
