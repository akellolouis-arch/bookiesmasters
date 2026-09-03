"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, Star } from "lucide-react";

export default function AdminSubNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Premium Tips", href: "/admin/tips", icon: Star },
  ];

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-12 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-xs font-black tracking-wider text-amber-400 uppercase mr-3 hidden sm:inline-block border-r border-slate-700 pr-3">
            Admin Portal
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon size={14} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
