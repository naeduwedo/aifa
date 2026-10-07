"use client";

import { useEffect, useState } from "react";
import { label } from "@/lib/i18n";
import { clientApi } from "@/lib/client-api";
import type { Lang } from "@/lib/types";

type Settings = Record<string, string>;

const FIELDS: { key: string; i18n: string; textarea?: boolean }[] = [
  { key: "site_name", i18n: "siteNameLabel" },
  { key: "tagline_zh", i18n: "taglineZhLabel" },
  { key: "tagline_en", i18n: "taglineEnLabel" },
  { key: "announcement_zh", i18n: "announcementZhLabel" },
  { key: "announcement_en", i18n: "announcementEnLabel" },
  { key: "footer_note", i18n: "footerNoteLabel" },
];

export default function SettingsPanel({ lang }: { lang: Lang }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    clientApi<{ settings: Settings }>("/api/admin/settings")
      .then((d) => setSettings(d.settings || {}))
      .catch((e) => setError((e as Error).message));
  }, []);

  const save = async () => {
    if (!settings) return;
    setError("");
    try {
      const d = await clientApi<{ settings: Settings }>("/api/admin/settings", {
        method: "PUT",
        json: { settings },
      });
      setSettings(d.settings);
      setSaved(label("settingsSaved", lang));
      setTimeout(() => setSaved(""), 2500);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!settings) {
    return (
      <div className="admin-page">
        <p className="mono-label">
          <span className="spin" />
        </p>
        {error && <p className="login-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="mono-label">{label("adminTitle", lang)}</p>
        <h1>{label("navSettings", lang)}</h1>
      </header>

      {error && <p className="login-error">{error}</p>}
      {saved && <p className="login-ok">{saved}</p>}

      <section className="admin-section settings-form">
        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={`set-${f.key}`}>{label(f.i18n as any, lang)}</label>
            <input
              id={`set-${f.key}`}
              value={settings[f.key] ?? ""}
              onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
            />
          </div>
        ))}
        <div className="field checkbox-field">
          <input
            id="set-maintenance"
            type="checkbox"
            checked={settings.maintenance === "true" || settings.maintenance === "on"}
            onChange={(e) => setSettings({ ...settings, maintenance: e.target.checked ? "true" : "false" })}
          />
          <label htmlFor="set-maintenance">{label("maintenanceLabel", lang)}</label>
          <span className="field-hint">{label("maintenanceHint", lang)}</span>
        </div>
        <div className="editor-actions">
          <button className="primary-action" type="button" onClick={save}>
            {label("saveSettings", lang)}
          </button>
        </div>
      </section>
    </div>
  );
}
