import ColumnsBoard from "@/components/ColumnsBoard";
import { api, withLang } from "@/lib/server-api";
import type { AuthorProfile, Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ColumnsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";

  let columnProfiles: AuthorProfile[] = [];
  try {
    const data = await api<{ columnProfiles: AuthorProfile[] }>(withLang("/api/columns", lang));
    columnProfiles = data.columnProfiles ?? [];
  } catch {
    columnProfiles = [];
  }

  return <ColumnsBoard profiles={columnProfiles} lang={lang} />;
}
