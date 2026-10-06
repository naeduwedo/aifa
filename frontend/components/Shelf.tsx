"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { L, label, t } from "@/lib/i18n";
import type { Lang, ShelfItem } from "@/lib/types";

type Tab = "articles" | "resources" | "authors";

export default function Shelf({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("articles");
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [subs, setSubs] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<{ email: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shelf", { credentials: "include" });
      if (res.status === 401) {
        setItems([]);
        setSubs([]);
        setAccount(null);
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setSubs(data.subscriptions ?? []);
      setAccount(data.account ?? null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (kind: string, target: string) => {
    await fetch(`/api/shelf/${kind}/${encodeURIComponent(target)}`, {
      method: "DELETE",
      credentials: "include",
    });
    setItems((prev) => prev.filter((i) => !(i.kind === kind && i.targetId === target)));
  };

  const articles = items.filter((i) => i.kind === "article");
  const resources = items.filter((i) => i.kind !== "article");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "articles", label: label("tabSaved", lang), count: articles.length },
    { key: "resources", label: label("tabResources", lang), count: resources.length },
    { key: "authors", label: label("tabSubscribed", lang), count: subs.length },
  ];

  return (
    <div className="library-content">
      <div className="library-bar">
        <div className="library-tabs" role="tablist">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              className="library-tab"
              role="tab"
              aria-selected={tab === tb.key}
              type="button"
              onClick={() => setTab(tb.key)}
            >
              {tb.label} <span className="count">{tb.count}</span>
            </button>
          ))}
        </div>
        <p className="mono-label">{label("shelfTagline", lang)}</p>
      </div>

      <div className="library-panel">
        {!account && !loading ? (
          <div className="library-empty">
            <div>
              <h2>{label("shelfSignIn", lang)}</h2>
              <p className="library-empty-hint">{label("shelfHint", lang)}</p>
              <button
                className="primary-action"
                type="button"
                onClick={() => router.push(`/account/login?lang=${lang}`)}
              >
                {label("signIn", lang)}
              </button>
            </div>
          </div>
        ) : tab === "authors" ? (
          subs.length === 0 ? (
            <div className="library-empty">
              <div>
                <h2>{label("shelfSubscribedEmpty", lang)}</h2>
              </div>
            </div>
          ) : (
            <ul className="shelf-list">
              {subs.map((no) => (
                <li className="shelf-row" key={no}>
                  <div>
                    <h3>
                      <Link href={`/u/${no}?lang=${lang}`}>
                        {lang === "zh" ? `作者 #${no}` : `Columnist #${no}`}
                      </Link>
                    </h3>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (tab === "articles" ? articles : resources).length === 0 ? (
          <div className="library-empty">
            <div>
              <h2>{label("tabSaved", lang)}</h2>
              <p className="library-empty-hint">
                {tab === "resources" ? label("shelfResourcesEmpty", lang) : label("shelfHint", lang)}
              </p>
              <button
                className="primary-action"
                type="button"
                onClick={() => router.push(`/?lang=${lang}`)}
              >
                {label("emptyPrimary", lang)}
              </button>
            </div>
          </div>
        ) : (
          <ul className="shelf-list">
            {(tab === "articles" ? articles : resources).map((item) => (
              <li className="shelf-row" key={`${item.kind}-${item.targetId}`}>
                <div>
                  <h3>
                    {item.card ? (
                      <Link href={`${item.card.href}?lang=${lang}`}>{t(item.card.title, lang)}</Link>
                    ) : (
                      item.targetId
                    )}
                  </h3>
                  <div className="shelf-meta">
                    <span>{item.progress > 0 ? L.progress[lang].replace("{percent}", String(item.progress)) : L.unread[lang]}</span>
                    {item.progress >= 100 && <span>{L.finished[lang]}</span>}
                    <span>{item.createdAt?.slice(0, 10)}</span>
                  </div>
                </div>
                <div className="shelf-actions">
                  {item.card && (
                    <Link className="small-action" href={`${item.card.href}?lang=${lang}`}>
                      {L.resume[lang]}
                    </Link>
                  )}
                  <button
                    className="small-action"
                    type="button"
                    onClick={() => remove(item.kind, item.targetId)}
                  >
                    {L.remove[lang]}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
