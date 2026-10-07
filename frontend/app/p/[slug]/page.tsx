import Link from "next/link";
import { notFound } from "next/navigation";
import { label } from "@/lib/i18n";
import { api, withLang } from "@/lib/server-api";
import type { Lang, SitePageRec } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";

  let page: SitePageRec | null = null;
  try {
    const data = await api<{ page: SitePageRec }>(withLang(`/api/site-pages/${slug}`, lang));
    page = data.page ?? null;
  } catch {
    page = null;
  }
  if (!page) notFound();

  const paragraphs = (page.body || "").split(/\n{2,}/).filter((s) => s.trim());

  return (
    <main className="public-shell" lang={lang === "zh" ? "zh-CN" : "en"}>
      <article className="public-screen site-page">
        <header className="directory-header">
          <p className="mono-label">{page.slug}</p>
          <h1 className="display-title">{lang === "zh" ? page.title.zh || page.title.en : page.title.en || page.title.zh}</h1>
          <p className="lede">
            {lang === "zh" ? page.summary.zh || page.summary.en : page.summary.en || page.summary.zh}
          </p>
        </header>
        <div className="site-page-body">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className="editor-actions">
          <Link className="ghost-action" href={`/?lang=${lang}`}>
            {label("backHome", lang)}
          </Link>
        </div>
      </article>
    </main>
  );
}
