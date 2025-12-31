import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
      <AdminNav />
      <main className="flex-1 overflow-hidden w-full">{children}</main>
    </div>
  );
}
