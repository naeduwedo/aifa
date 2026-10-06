import Consult from "@/components/Consult";
import ResearchBoard from "@/components/ResearchBoard";
import { api, withLang } from "@/lib/server-api";
import type { Lang, ResearchResource } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";

  let resources: ResearchResource[] = [];
  try {
    const data = await api<{ resources: ResearchResource[] }>(withLang("/api/research", lang));
    resources = data.resources ?? [];
  } catch {
    resources = [];
  }

  return (
    <>
      <ResearchBoard resources={resources} lang={lang} />
      <Consult lang={lang} />
    </>
  );
}
