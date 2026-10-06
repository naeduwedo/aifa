"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { L, label, t } from "@/lib/i18n";
import type { HomePayload, Lang } from "@/lib/types";
import Shelf from "@/components/Shelf";

type Screen = "daily" | "sections";

function VerifiedMark({ title }: { title: string }) {
  return (
    <span className="verified-mark" role="img" aria-label={title} title={title}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 1.7 14.6 4l3.4-.2.2 3.4 2.3 2.6-2.3 2.6-.2 3.4-3.4-.2-2.6 2.3-2.6-2.3-3.4.2-.2-3.4-2.3-2.6 2.3-2.6.2-3.4 3.4.2L12 1.7Z" />
        <path className="check" d="m8.2 10.2 2.3 2.3 5.2-5.1" />
      </svg>
    </span>
  );
}

function dateLabel(iso: string, lang: Lang) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  if (lang === "zh") return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export default function HomeScreen({
  lang,
  home,
  initialScreen,
}: {
  lang: Lang;
  home: HomePayload | null;
  initialScreen: "daily" | "library";
}) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("daily");
  const [payload, setPayload] = useState<HomePayload | null>(home);
  const [date, setDate] = useState<string>("");
  const [booted, setBooted] = useState(initialScreen === "library");

  const schedule = useMemo(() => payload?.schedule ?? [], [payload]);
  const currentIndex = useMemo(() => {
    if (!date) return payload?.todayIndex ?? 0;
    const i = schedule.findIndex((s) => s.date === date);
    return i >= 0 ? i : payload?.todayIndex ?? 0;
  }, [date, schedule, payload]);

  const entry = payload?.daily?.[0] ?? null;

  const loadDate = async (next: string) => {
    setDate(next);
    try {
      const res = await fetch(`/api/daily?date=${next}&lang=${lang}`, {
        credentials: "include",
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      setPayload((prev) => ({ ...(prev as HomePayload), daily: data.daily ?? [] }));
    } catch {
      setPayload((prev) => (prev ? { ...prev, daily: [] } : prev));
    }
  };

  useEffect(() => {
    if (home) setPayload(home);
  }, [home]);

  const prevDate = currentIndex > 0 ? schedule[currentIndex - 1]?.date : "";
  const nextDate = currentIndex + 1 < schedule.length ? schedule[currentIndex + 1]?.date : "";

  const goReader = (href: string) => {
    router.push(`${href}?lang=${lang}`);
  };

  if (booted) {
    return (
      <main className="library-screen" lang={lang === "zh" ? "zh-CN" : "en"}>
        <Shelf lang={lang} />
      </main>
    );
  }

  if (!payload || !entry) {
    return (
      <main className="cover-screen" lang={lang === "zh" ? "zh-CN" : "en"}>
        <div className="daily-slide">
          <div className="daily-stage">
            <p className="mono-label">{label("tagline", lang)}</p>
            <h1 className="daily-title">
              <span className="daily-title-visible">AIFA</span>
            </h1>
            <a className="daily-read" href={`/account/login?lang=${lang}`}>
              {label("signIn", lang)}
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="cover-screen" lang={lang === "zh" ? "zh-CN" : "en"}>
      <div className="home-slider">
        <div
          className="home-track"
          style={{ transform: `translateY(-${screen === "daily" ? 0 : 100}%)` }}
        >
          {/* ---------------------------------------------- daily cover */}
          <section className="home-slide daily-slide" aria-label={label("dailyLabel", lang)}>
            <div className="daily-stage">
              <div className="daily-portrait-row">
                <button
                  className="daily-adjacent"
                  type="button"
                  disabled={!prevDate}
                  onClick={() => prevDate && loadDate(prevDate)}
                  aria-label={label("prevDay", lang)}
                >
                  <span aria-hidden="true">←</span>
                  <time dateTime={prevDate}>{dateLabel(prevDate, lang)}</time>
                </button>

                <div className="daily-avatar" aria-label={t(entry.author, lang)}>
                  {entry.authorAvatar ? (
                    <img src={entry.authorAvatar} alt="" />
                  ) : (
                    <span className="mono-label">{t(entry.author, lang).slice(0, 1)}</span>
                  )}
                </div>

                <button
                  className="daily-adjacent daily-tomorrow"
                  type="button"
                  disabled={!nextDate}
                  onClick={() => nextDate && loadDate(nextDate)}
                  aria-label={label("nextDay", lang)}
                >
                  <time dateTime={nextDate}>{dateLabel(nextDate, lang)}</time>
                  <span aria-hidden="true">→</span>
                </button>
              </div>

              <h1 className="daily-title">
                <a
                  className="daily-title-visible"
                  href={`/u/${entry.href.replace("/u/", "")}?lang=${lang}`}
                  onClick={(e) => {
                    e.preventDefault();
                    goReader(entry.href);
                  }}
                >
                  {t(entry.title, lang)}
                </a>
              </h1>

              <div className="daily-authorline">
                <p className="daily-author">{t(entry.author, lang)}</p>
              </div>
              <div className="daily-author-titleline">
                <p className="daily-author-title">{t(entry.authorTitle, lang)}</p>
                {entry.authorVerified && <VerifiedMark title={label("verified", lang)} />}
              </div>

              <a
                className="daily-read"
                href={`${entry.href}?lang=${lang}`}
                onClick={(e) => {
                  e.preventDefault();
                  goReader(entry.href);
                }}
              >
                {label("readToday", lang)}
              </a>
            </div>

            <span className="daily-footnote">{label("tagline", lang)}</span>

            <button
              className="home-downhint"
              type="button"
              onClick={() => setScreen("sections")}
              aria-label={label("scrollHint", lang)}
            >
              ↓
            </button>
          </section>

          {/* ------------------------------------------- sections slide */}
          <section className="home-slide sections-slide" aria-label={label("sectionsLabel", lang)}>
            <header className="sections-head">
              <h2>{label("columnsLabel", lang)}</h2>
              <span className="mono-label">
                {label("columnistCount", lang).replace(
                  "{count}",
                  String(payload.sections.reduce((n, s) => n + s.columnProfiles.length, 0))
                )}
              </span>
            </header>

            <ul className="roster">
              {payload.sections.flatMap((section) =>
                section.columnProfiles.map((profile) => (
                  <li className="roster-item" key={profile.id}>
                    <Link className="roster-link" href={`/u/${profile.userNo}?lang=${lang}`}>
                      <span className="roster-avatar">
                        {profile.avatar ? <img src={profile.avatar} alt="" /> : null}
                      </span>
                      <span>
                        <p className="roster-name">{t(profile.name, lang)}</p>
                        <p className="roster-title">{t(profile.title, lang)}</p>
                      </span>
                      <span className="roster-count">
                        {profile.articles.length} {label("articleCount", lang)}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>

            <button
              className="home-downhint"
              type="button"
              onClick={() => setScreen("daily")}
              aria-label={label("scrollHint", lang)}
            >
              ↑
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
