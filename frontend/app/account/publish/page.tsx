import { Suspense } from "react";
import ArticleEditor from "@/components/ArticleEditor";
import type { Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PublishPage({ searchParams }: { searchParams: Promise<{ lang?: string; id?: string }> }) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";
  return (
    <main className="public-shell" lang={lang === "zh" ? "zh-CN" : "en"}>
      <Suspense fallback={<div className="public-screen"><span className="spin" /></div>}>
        <ArticleEditor lang={lang} />
      </Suspense>
    </main>
  );
}
