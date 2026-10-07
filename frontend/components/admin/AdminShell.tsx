"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { label } from "@/lib/i18n";
import type { Account } from "@/lib/types";

const NAV = [
  { href: "/admin", key: "navDashboard" },
  { href: "/admin/users", key: "navUsers" },
  { href: "/admin/columns", key: "adminNavColumns" },
  { href: "/admin/categories", key: "navCategories" },
  { href: "/admin/articles", key: "navArticles" },
  { href: "/admin/pages", key: "navPages" },
  { href: "/admin/settings", key: "navSettings" },
] as const;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const lang = params.get("lang") === "zh" ? "zh" : "en";
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const acc: Account | null = d.account ?? null;
        if (!acc) router.replace(`/account/login?lang=${lang}`);
        else setAccount(acc);
        setReady(true);
      })
      .catch(() => {
        router.replace(`/account/login?lang=${lang}`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready || !account) {
    return (
      <div className="admin-shell">
        <div className="admin-loading">
          <span className="spin" />
        </div>
      </div>
    );
  }

  if (account.role !== "admin") {
    return (
      <div className="admin-shell">
        <div className="admin-gate">
          <p className="mono-label">{label("adminTitle", lang)}</p>
          <h1 className="display-title">403</h1>
          <p className="lede">{label("adminForbidden", lang)}</p>
          <div className="gate-actions">
            <Link className="primary-action" href={`/?lang=${lang}`}>
              {label("backHome", lang)}
            </Link>
            <Link className="ghost-action" href={`/account/profile?lang=${lang}`}>
              {label("profileTitle", lang)}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <p className="admin-brand">AIFA / {label("adminTitle", lang)}</p>
        <nav className="admin-nav">
          {NAV.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={`${item.href}?lang=${lang}`}
                className={active ? "is-active" : undefined}
                aria-current={active ? "page" : undefined}
              >
                {label(item.key, lang)}
              </Link>
            );
          })}
        </nav>
        <div className="admin-side-foot">
          <Link href={`/account/profile?lang=${lang}`}>{label("profileTitle", lang)}</Link>
          <Link href={`/?lang=${lang}`}>{label("backHome", lang)}</Link>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
