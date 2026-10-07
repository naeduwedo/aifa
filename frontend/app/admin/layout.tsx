import { Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="admin-shell"><div className="admin-loading"><span className="spin" /></div></div>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
