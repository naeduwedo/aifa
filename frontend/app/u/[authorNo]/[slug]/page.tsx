import Reader from "@/components/Reader";
import { api, withLang } from "@/lib/server-api";
import type { ArticleResponse, Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ authorNo: string; slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";

  let data: ArticleResponse | null = null;
  try {
    data = await api<ArticleResponse>(withLang(`/api/articles/${slug}`, lang));
  } catch {
    data = null;
  }

  if (!data?.article) {
    return (
      <main className="public-shell">
        <div className="public-screen">
          <p className="mono-label">404</p>
          <h1 className="display-title">Not found</h1>
        </div>
      </main>
    );
  }

  return (
    <Reader
      article={data.article}
      lang={lang}
      saved={Boolean(data.saved)}
      progress={data.progress}
    />
  );
}
