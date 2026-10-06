import AuthorPage from "@/components/AuthorPage";
import { api, withLang } from "@/lib/server-api";
import type { AuthorProfile, Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AuthorRoute({
  params,
  searchParams,
}: {
  params: Promise<{ authorNo: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { authorNo } = await params;
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";

  let profile: AuthorProfile | null = null;
  try {
    profile = await api<AuthorProfile>(withLang(`/api/authors/${authorNo}`, lang));
  } catch {
    profile = null;
  }

  return <AuthorPage profile={profile} lang={lang} />;
}
