import Consult from "@/components/Consult";
import GoGlobalBoard from "@/components/GoGlobalBoard";
import { api, withLang } from "@/lib/server-api";
import type { GoGlobalActivity, Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GoGlobalPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";

  let activity: GoGlobalActivity | null = null;
  try {
    const data = await api<{ activities: GoGlobalActivity[] }>(withLang("/api/go-global", lang));
    activity = data.activities?.[0] ?? null;
  } catch {
    activity = null;
  }

  return (
    <>
      <GoGlobalBoard activity={activity} lang={lang} />
      <Consult lang={lang} />
    </>
  );
}
