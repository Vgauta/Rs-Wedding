import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "RS Weddings Proposal Studio",
  description: "Luxury mobile-first wedding proposal PDF builder for RS Weddings.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "RS Proposals", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0D2A24", width: "device-width", initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en" className={`${inter.variable} ${cormorant.variable}`}><body>{children}</body></html>;
}
