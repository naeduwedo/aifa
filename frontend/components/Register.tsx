"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { label } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export default function RegisterStage({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const post = async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  };

  const sendCode = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await post("/api/auth/register", {
        email: email.trim(),
        displayName: displayName.trim(),
        locale: lang,
      });
      setDevCode(data.devCode || "");
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError("");
    try {
      await post("/api/auth/verify", { email: email.trim(), code: code.trim() });
      router.push(`/account/profile?lang=${lang}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-stage">
      <div className="login-card">
        <p className="mono-label">{label("accountTitle", lang)}</p>
        <h1>{label("registerTitle", lang)}</h1>
        <p className="lede">{label("registerIntro", lang)}</p>

        <form
          className="field"
          onSubmit={(e) => {
            e.preventDefault();
            if (!sent) sendCode();
            else verify();
          }}
        >
          <label htmlFor="displayName">{label("displayNameLabel", lang)}</label>
          <input
            id="displayName"
            type="text"
            required
            maxLength={60}
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={lang === "zh" ? "你的显示名" : "Your display name"}
            disabled={sent}
          />

          <label htmlFor="email">{label("emailLabel", lang)}</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={sent}
          />

          {sent && (
            <>
              <label htmlFor="code">{label("codeLabel", lang)}</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6 digits"
              />
            </>
          )}

          {error && <p className="login-error">{error}</p>}

          <button className="login-submit" type="submit" disabled={busy}>
            {!sent ? label("register", lang) : label("verify", lang)}
          </button>

          {sent && !devCode && (
            <button className="ghost-action" type="button" onClick={sendCode} disabled={busy}>
              {label("resend", lang)}
            </button>
          )}

          {devCode && (
            <p className="dev-code">
              {label("devHint", lang)}: <strong>{devCode}</strong>
            </p>
          )}
        </form>

        <button
          className="ghost-action"
          type="button"
          onClick={() => router.push(`/account/login?lang=${lang}`)}
        >
          {label("haveAccount", lang)}
        </button>
        <button className="ghost-action" type="button" onClick={() => router.push(`/?lang=${lang}`)}>
          {label("backHome", lang)}
        </button>
      </div>
    </div>
  );
}
