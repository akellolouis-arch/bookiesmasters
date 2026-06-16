"use client";

import { Facebook, Send, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1F1F1F] text-gray-400 text-[10px] md:justify-center px-1 pt-1 pb-3 md:pt-2 md:pb-4 border-t border-white/5">
      {/* Main section */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 md:text-center">


        {/* Brand */}
        <div>
          <h5 className="text-[10px] font-normal text-gray-300 tracking-wider">Bookiesmasters</h5>
          <p className="text-[10px] leading-snug text-gray-400 text-justify">
            Get instant access to premium football analytics, livescores, market probabilities, match events, and expert insights.
          </p>
          <p className="text-[10px] text-gray-500 leading-snug mt-0.5 text-justify">
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
              href="mailto:support@bookiesmasters.com"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Mail size={14} strokeWidth={1.5} />
            </a>
            <a
              href="https://m.facebook.com/profile.php?id=61586995581547"
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
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
      <div className="text-center text-gray-600 text-[10px] mt-2 tracking-widest">
        © {new Date().getFullYear()} Bookiesmasters. All rights reserved.
      </div>
    </footer>
  );
}
