import LoginStage from "@/components/Login";
import type { Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "zh" ? "zh" : "en";

  return (
    <main className="login-shell" lang={lang === "zh" ? "zh-CN" : "en"}>
      <LoginStage lang={lang} />
    </main>
  );
}
