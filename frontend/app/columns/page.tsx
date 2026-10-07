import ColumnsBoard from "@/components/ColumnsBoard";
import { api, withLang } from "@/lib/server-api";
import type { AuthorProfile, Lang, ManagedColumn } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ColumnsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";

  let columnProfiles: AuthorProfile[] = [];
  let managed: ManagedColumn[] = [];
  try {
    const data = await api<{ columnProfiles: AuthorProfile[]; columns: ManagedColumn[] }>(
      withLang("/api/columns", lang),
    );
    columnProfiles = data.columnProfiles ?? [];
    managed = data.columns ?? [];
  } catch {
    columnProfiles = [];
  }

  return <ColumnsBoard profiles={columnProfiles} columns={managed} lang={lang} />;
}
