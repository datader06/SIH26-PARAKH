import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./motion.css";
import { AppProviders } from "@/components/providers/AppProviders";

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
  title: "PARAKH | Evidence. Intelligence. Clarity.",
  description:
    "Institutional application scrutiny and document intelligence. Evidence-led compliance review with human oversight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="bg-background text-ink min-h-screen antialiased selection:bg-clay-200 selection:text-clay-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
