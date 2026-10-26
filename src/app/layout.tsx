import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PARAKH Document Intelligence | Enterprise Verification Platform",
  description:
    "Secure identity document scanning, optical character recognition, forensic analysis, and verification platform for authorized organizations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="bg-background text-ink min-h-screen antialiased selection:bg-clay-200 selection:text-clay-900">
        {children}
      </body>
    </html>
  );
}
