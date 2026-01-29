import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import TopLeaguesRibbon from "@/components/TopLeaguesRibbon";
import Footer from "@/components/Footer";
import TelegramCTA from "@/components/TelegramCTA";
import AffiliateBanner from "@/components/AffiliateBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BookiesMasters",
  description: "Free football predictions, fixtures, events, odds, livescores & insights",
  icons: {
    icon: '/bookiesmasters_logo_circle.png',
  },
  openGraph: {
    title: "BookiesMasters | Premier Football Predictions",
    description: "Get free football predictions, live scores, and expert insights for all major leagues.",
    url: "https://bookiesmasters.com",
    siteName: "BookiesMasters",
    images: [
      {
        url: "/bookiesmasters_social_cover.png",
        width: 1200,
        height: 630,
        alt: "BookiesMasters Social Cover",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookiesMasters",
    description: "Free football predictions, fixtures, events, odds, livescores & insights",
    images: ["/bookiesmasters_social_cover.png"],
    creator: "@bookiesmasters",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-N2MSB811W7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-N2MSB811W7');
          `}
        </Script>

        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '4231012747229353');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=4231012747229353&ev=PageView&noscript=1"
          />
        </noscript>

        {/* Organization Schema for Google Knowledge Graph */}
        <Script id="org-schema" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SportsOrganization",
              "name": "BookiesMasters",
              "url": "https://bookiesmasters.com",
              "logo": "https://bookiesmasters.com/bookiesmasters_text_v2.png",
              "sameAs": [
                "https://facebook.com/bookiesmasters",
                "https://twitter.com/bookiesmasters"
              ]
            }
          `}
        </Script>

        <AuthProvider>
          <Navbar />
          <TopLeaguesRibbon />
          <main className="min-h-screen">{children}</main>
          <TelegramCTA />
          <Footer />
          <AffiliateBanner />
        </AuthProvider>
      </body>
    </html>
  );
}


