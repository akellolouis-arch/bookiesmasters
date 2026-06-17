import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, CreditCard, Star } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // @ts-ignore
  if (!session || !session.user || session.user.role !== 'admin') {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#1F1F1F] border-r border-white/5 p-6 flex flex-col gap-6">
        <div className="font-bold text-xl text-white">Admin Portal</div>
        <nav className="flex flex-col gap-2">
          <Link href="/admin" className="flex items-center gap-3 text-gray-400 hover:text-white p-2 rounded hover:bg-white/5 transition-colors">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link href="/admin/payments" className="flex items-center gap-3 text-gray-400 hover:text-white p-2 rounded hover:bg-white/5 transition-colors">
            <CreditCard size={18} /> Payments
          </Link>
          <Link href="/admin/tips" className="flex items-center gap-3 text-gray-400 hover:text-white p-2 rounded hover:bg-white/5 transition-colors">
            <Star size={18} /> Premium Tips
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
