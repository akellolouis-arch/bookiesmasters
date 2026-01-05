"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import logo from "@/public/logo.png";
import PricingModal from "./PricingModal";

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
            className="w-auto h-[32px] md:h-[40px] object-contain"
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
          <Link
            href="/vip-tips"
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold rounded-lg transition transform hover:scale-105"
          >
            VIP Access
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white hover:text-gray-300 font-bold"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
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
            <Link
              href="/vip-tips"
              className="text-left text-yellow-500 font-bold hover:text-yellow-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              VIP Access
            </Link>
          </div>
        </div>
      )}


    </nav>
  );
}
