import RegisterStage from "@/components/Register";
import type { Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";
  return (
    <main className="login-shell" lang={lang === "zh" ? "zh-CN" : "en"}>
      <RegisterStage lang={lang} />
    </main>
  );
}
