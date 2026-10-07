import ProfileScreen from "@/components/Profile";
import type { Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";
  return (
    <main className="public-shell" lang={lang === "zh" ? "zh-CN" : "en"}>
      <ProfileScreen lang={lang} />
    </main>
  );
}
