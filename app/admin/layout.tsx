import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, CreditCard, Star, LogOut } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // @ts-ignore
  if (!session || !session.user || session.user.role !== 'admin') {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col gap-6">
        <div className="font-bold text-xl text-gray-900">Admin Portal</div>
        <nav className="flex flex-col gap-2">
          <Link href="/admin" className="flex items-center gap-3 text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-gray-100 transition-colors">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link href="/admin/payments" className="flex items-center gap-3 text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-gray-100 transition-colors">
            <CreditCard size={18} /> Payments
          </Link>
          <Link href="/admin/tips" className="flex items-center gap-3 text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-gray-100 transition-colors">
            <Star size={18} /> Premium Tips
          </Link>
        </nav>
        <div className="mt-8 pt-6 border-t border-gray-300">
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}>
            <button type="submit" className="w-full flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded transition-colors text-left">
              <LogOut size={18} /> Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
