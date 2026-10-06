import AboutBoard from "@/components/AboutBoard";
import { api, withLang } from "@/lib/server-api";
import type { Card, Lang, SiteVideo } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AboutPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";

  let videos: SiteVideo[] = [];
  let articles: Card[] = [];
  try {
    const data = await api<{ videos: SiteVideo[]; articles: Card[] }>(
      withLang("/api/about", lang)
    );
    videos = data.videos ?? [];
    articles = data.articles ?? [];
  } catch {
    videos = [];
    articles = [];
  }

  return <AboutBoard videos={videos} articles={articles} lang={lang} />;
}
