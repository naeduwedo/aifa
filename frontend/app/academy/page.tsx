import AcademyBoard from "@/components/AcademyBoard";
import { api, withLang } from "@/lib/server-api";
import type { AcademyShelf, Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AcademyPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";

  let shelves: AcademyShelf[] = [];
  try {
    const data = await api<{ shelves: AcademyShelf[] }>(withLang("/api/academy", lang));
    shelves = data.shelves ?? [];
  } catch {
    shelves = [];
  }

  return <AcademyBoard shelves={shelves} lang={lang} />;
}
