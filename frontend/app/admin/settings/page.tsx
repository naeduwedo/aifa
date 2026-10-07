import SettingsPanel from "@/components/admin/SettingsPanel";
import type { Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminSubPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";
  return <SettingsPanel lang={lang} />;
}
