import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const SITE = "https://collage-bheng.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Collage - make it, caption it, ship it",
  description:
    "A fast, private, mobile-first collage maker. Drop in photos, snap them into a layout, lay nice text over the top, and export a crisp PNG. Everything stays on your device.",
  applicationName: "Collage",
  keywords: [
    "collage maker",
    "photo layout",
    "text on photos",
    "image grid",
    "PNG export",
  ],
  authors: [{ name: "Bunlong Heng" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Collage",
  },
  openGraph: {
    type: "website",
    url: SITE,
    title: "Collage - make it, caption it, ship it",
    description:
      "Drop in photos, snap them into a layout, lay nice text over the top, export a crisp PNG. Private and instant - nothing leaves your device.",
    siteName: "Collage",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Collage" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Collage - make it, caption it, ship it",
    description:
      "A fast, private, mobile-first collage maker. Export a crisp PNG in seconds.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0b09" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

// Set theme before first paint - no flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('collage-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fraunces.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
