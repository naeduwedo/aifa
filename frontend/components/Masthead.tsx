"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { L } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const NAV = [
  { key: "navDaily", href: "/" },
  { key: "navColumns", href: "/columns" },
  { key: "navResearch", href: "/research" },
  { key: "navAcademy", href: "/academy" },
  { key: "navGoGlobal", href: "/go-global" },
] as const;

function useLang(): [Lang, (l: Lang) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("aifa-lang");
    const fromUrl = params.get("lang");
    const next = (fromUrl === "zh" || fromUrl === "en" ? fromUrl : null) ??
      (stored === "zh" ? "zh" : "en");
    setLangState(next as Lang);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  }, [params]);

  const setLang = (next: Lang) => {
    localStorage.setItem("aifa-lang", next);
    setLangState(next);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
    const qp = new URLSearchParams(params.toString());
    qp.set("lang", next);
    router.replace(`${pathname}?${qp.toString()}`, { scroll: false });
  };

  return [lang, setLang];
}

export function useTheme() {
  const [night, setNight] = useState(false);
  useEffect(() => {
    setNight(document.documentElement.getAttribute("data-aifa-night") === "on");
  }, []);
  const toggle = () => {
    const next = !night;
    setNight(next);
    if (next) document.documentElement.setAttribute("data-aifa-night", "on");
    else document.documentElement.removeAttribute("data-aifa-night");
    localStorage.setItem("aifa-theme", next ? "dark" : "light");
  };
  return { night, toggle };
}

export default function Masthead() {
  const [lang, setLang] = useLang();
  const { night, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [account, setAccount] = useState<{ email: string } | null>(null);
  const isReader = pathname.startsWith("/u/");

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAccount(d.account))
      .catch(() => setAccount(null));
  }, [pathname]);

  const flipHref = (href: string) => {
    const qp = new URLSearchParams();
    qp.set("lang", lang === "en" ? "zh" : "en");
    return `${href}?${qp.toString()}`;
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAccount(null);
    router.refresh();
  };

  if (isReader) return null;

  return (
    <>
      <nav className="masthead" aria-label={L.primaryNav[lang]}>
        <Link className="wordmark" href={flipHref("/")} aria-label={L.home[lang]}>
          <img className="masthead-logo" src="/images/home/afa-logo.svg" alt="AIFA" />
        </Link>

        <div className="section-navigation">
          {NAV.map((item) => (
            <Link
              key={item.key}
              className="section-tab"
              href={flipHref(item.href)}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {L[item.key][lang]}
            </Link>
          ))}
        </div>

        <div className="masthead-actions">
          <button
            className="masthead-theme"
            type="button"
            onClick={toggle}
            aria-label={night ? L.switchToDay[lang] : L.switchToNight[lang]}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M8 1v1.7M8 13.3V15M1 8h1.7M13.3 8H15M3.05 3.05l1.2 1.2M11.75 11.75l1.2 1.2M3.05 12.95l1.2-1.2M11.75 4.25l1.2-1.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button type="button" onClick={() => setLang(lang === "en" ? "zh" : "en")}>
            {lang === "en" ? "中文" : "EN"}
          </button>
          <Link className="masthead-library" href={flipHref("/library")}>
            {L.library[lang]}
          </Link>
          {account ? (
            <button className="masthead-subscribe" type="button" onClick={signOut}>
              {L.signOut[lang]}
            </button>
          ) : (
            <Link className="masthead-subscribe" href={flipHref("/account/login")}>
              {L.signIn[lang]}
            </Link>
          )}
        </div>
      </nav>
      <div className="masthead-spacer" aria-hidden="true" />
    </>
  );
}
