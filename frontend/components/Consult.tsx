"use client";

import { useEffect, useRef, useState } from "react";
import { label } from "@/lib/i18n";
import type { ConsultMessage, Lang } from "@/lib/types";

const QUESTIONS: Record<Lang, string[]> = {
  en: ["How do I start with AI?", "Which course fits a founder?", "Do you help with going global?"],
  zh: ["我该怎么开始用 AI？", "创始人适合哪门课？", "你们能帮做出海吗？"],
};

export default function Consult({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ConsultMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [topic, setTopic] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threadId) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/consult/${threadId}`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.messages)) setMessages(data.messages);
      } catch {
        /* poll silently */
      }
    }, 3500);
    return () => clearInterval(timer);
  }, [threadId]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, open]);

  const start = async (text: string) => {
    const res = await fetch("/api/consult", {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({ topic: text, service: "general" }),
    }).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    setThreadId(data.threadId ?? data.id ?? null);
    if (data.messages) setMessages(data.messages);
    setDraft("");
  };

  const send = async () => {
    if (!draft.trim()) return;
    if (!threadId) {
      await start(draft.trim());
      return;
    }
    const res = await fetch(`/api/consult/${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({ body: draft.trim() }),
    }).catch(() => null);
    setDraft("");
    if (res?.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data?.messages)) setMessages(data.messages);
    }
  };

  return (
    <>
      <button
        className="consult-launcher"
        type="button"
        aria-expanded={open}
        aria-label={open ? label("minimize", lang) : label("restore", lang)}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "×" : "✆"} {open ? "" : label("chatAdviser", lang)}
      </button>

      {open && (
        <aside className="consult-panel" role="dialog" aria-label={label("chatAdviser", lang)}>
          <header className="consult-head">
            <p className="mono-label">{label("consultStatus", lang)}</p>
            <button className="ghost-action" type="button" onClick={() => setOpen(false)}>
              —
            </button>
          </header>

          <div className="consult-log" ref={logRef}>
            {messages.length === 0 ? (
              <>
                <p className="mono-label">{label("commonQuestions", lang)}</p>
                <div className="consult-qa">
                  {QUESTIONS[lang].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setTopic(q);
                        start(q);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              messages.map((m) => (
                <div className="consult-msg" key={m.id} data-author={m.author}>
                  <span className="mono-label">{m.author === "reader" ? "YOU" : "AIFA"}</span>
                  <p>{m.body}</p>
                </div>
              ))
            )}
          </div>

          <form
            className="consult-input"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={label("consultPlaceholder", lang)}
            />
            <button className="primary-action" type="submit">
              {label("send", lang)}
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
