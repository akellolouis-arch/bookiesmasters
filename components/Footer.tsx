"use client";

import { Facebook, Twitter, Instagram, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1F1F1F] text-gray-400 md:justify-center px-4 py-3 md:py-4 border-t border-white/5">
      {/* Main section */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 md:text-center">


        {/* Brand */}
        <div className="space-y-1.5">
          <h5 className="text-sm font-bold text-white tracking-wider">Bookiesmasters</h5>
          <p className="text-xs leading-relaxed text-gray-400">
            Get guided football predictions, fixtures, odds, events, livescores and insights powered by data — all in one place.
          </p>
        </div>

        {/* Contact + Socials */}
        <div className="space-y-1.5">
          <h5 className="text-sm font-bold text-white tracking-wider">Stay connected</h5>
          <p className="text-xs text-gray-400">
            Have questions? Reach us anytime.
          </p>

          <div className="flex space-x-4 mt-2 md:justify-center">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Facebook size={16} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Twitter size={16} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Instagram size={16} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-1.5">
          <h5 className="text-sm font-bold text-white tracking-wider">Quick links</h5>
          <ul className="text-xs space-y-1">
            <li>
              <Link href="/terms-of-service" className="hover:text-teal-400 transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-teal-400 transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/contact-us" className="hover:text-teal-400 transition-colors">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-teal-400 transition-colors">
                About Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Betting Sites */}
        <div className="space-y-1.5">
          <h5 className="text-sm font-bold text-white tracking-wider">Betting sites</h5>
          <ul className="text-xs space-y-1">
            <li>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">
                Betway
              </a>
            </li>
            <li>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">
                1xBet
              </a>
            </li>
            <li>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">
                Bet365
              </a>
            </li>
            <li>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">
                22Bet
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="text-center text-gray-600 text-[10px] mt-4 pt-3 border-t border-white/5 tracking-widest">
        © {new Date().getFullYear()} Bookiesmasters. All rights reserved.
      </div>
    </footer>
  );
}
