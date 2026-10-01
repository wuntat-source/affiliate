import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AffiliatePost AI: Viral Social Media Affiliate Automation",
  description: "Automated AI affiliate platform for Threads, Twitter/X, and social media growth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#090d16] text-slate-100 min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
