import HomeScreen from "@/components/HomeScreen";
import { api, withLang } from "@/lib/server-api";
import type { HomePayload, Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; screen?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";

  let home: HomePayload | null = null;
  try {
    home = await api<HomePayload>(withLang("/api/home", lang));
  } catch {
    home = null;
  }

  if (sp.screen === "library") {
    return <HomeScreen lang={lang} home={home} initialScreen="library" />;
  }

  return <HomeScreen lang={lang} home={home} initialScreen="daily" />;
}
