import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminSubNav from "@/components/admin/AdminSubNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // @ts-ignore
  if (!session || !session.user || session.user.role !== 'admin') {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminSubNav />
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
