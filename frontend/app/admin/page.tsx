"use client";

import Dashboard from "@/components/admin/Dashboard";
import type { Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";
  return <Dashboard lang={lang} />;
}
