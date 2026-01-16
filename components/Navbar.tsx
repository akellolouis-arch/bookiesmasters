"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
// import logo from "@/public/logo.png"; 
// Use the new stylized TEXT logo
import logo from "@/public/bookiesmasters_text_v2.png";


export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  // Pricing modal is now handled in /vip-tips page


  const links = [
    { name: "Home", path: "/" },
    { name: "Predictions", path: "/predictions" },
  ];

  return (
    <nav className="w-full bg-[#1F1F1F] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-2 py-0 md:px-8 flex items-center justify-between  h-[60px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logo}
            alt="BookiesMasters Logo"
            className="w-auto h-[17px] md:h-[17px] object-contain" // Adjusted height for square icon
            priority
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className="text-gray-300 hover:text-white transition"
            >
              {link.name}
            </Link>
          ))}

        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-[#63FF79] hover:text-[#4CE060] font-bold"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
        >
          {menuOpen ? <X size={20} strokeWidth={4} /> : <Menu width={30} height={18} strokeWidth={4} preserveAspectRatio="none" className="-skew-x-[10deg]" />}
        </button>

      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="flex flex-col px-4 py-3 space-y-3">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                onClick={() => setMenuOpen(false)}
                className="text-gray-300 hover:text-white transition"
              >
                {link.name}
              </Link>
            ))}

          </div>
        </div>
      )
      }


    </nav >
  );
}
