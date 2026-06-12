"use client";

import { Facebook, MessageCircle, Send } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1F1F1F] text-gray-400 md:justify-center px-4 pt-1 pb-3 md:pt-2 md:pb-4 border-t border-white/5">
      {/* Main section */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 md:text-center">


        {/* Brand */}
        <div>
          <h5 className="text-[10px] font-normal text-gray-300 tracking-wider">Bookiesmasters</h5>
          <p className="text-[10px] leading-snug text-gray-400">
            Get instant access to premium football analytics, livescores, market probabilities, match events, and expert insights.
          </p>
          <p className="text-[10px] text-gray-500 leading-snug mt-0.5">
            Disclaimer: Forecasts and data displayed on this platform are for informational and entertainment purposes only and are not guaranteed to be accurate. We accept no liability or financial responsibility for decisions made based on this data. Please use our platform responsibly.
          </p>
        </div>

        {/* Contact + Socials */}
        <div>
          <h5 className="text-[10px] font-normal text-gray-300 tracking-wider">Stay connected</h5>
          <p className="text-[10px] text-gray-400">
            Have questions? Reach us anytime.
          </p>

          <div className="flex items-center space-x-4 mt-0.5 pb-1 md:justify-center">
            <a
              href="https://www.facebook.com/profile.php?id=61556994182742"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Facebook size={14} strokeWidth={1.5} />
            </a>
            <a
              href="https://wa.me/254745676267"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <MessageCircle size={14} strokeWidth={1.5} />
            </a>
            <a
              href="https://t.me/+HmtKbG-pVAA1ZTg0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Send size={14} strokeWidth={1.5} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h5 className="text-[10px] font-normal text-gray-300 tracking-wider">Quick links</h5>
          <ul className="text-[10px] space-y-0.5">

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

        {/* Partners (Temporarily Hidden for Payment Gateway Review)
        <div className="space-y-1.5">
          <h5 className="text-sm font-bold text-gray-300 tracking-wider">Betting sites</h5>
          <ul className="text-xs space-y-1">
            <li>
              <a href="https://reffpa.com/L?tag=d_5148910m_97c_telegram&site=5148910&ad=97&r=registration" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">
                1xBet
              </a>
            </li>
            <li>
              <a href="https://refpa3665.com/L?tag=d_2790675m_45415c_&site=2790675&ad=45415" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">
                Melbet
              </a>
            </li>
          </ul>
        </div>
        */}
      </div>

      {/* Footer bottom */}
      <div className="text-center text-gray-600 text-[10px] mt-4 pt-3 border-t border-white/5 tracking-widest">
        © {new Date().getFullYear()} Bookiesmasters. All rights reserved.
      </div>
    </footer>
  );
}
