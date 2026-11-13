import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import SessionShell from "@/components/session-shell";

const playfairDisplayHeading = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STAR Copilot — Dashboard",
  description: "Enterprise Knowledge & Support Copilot diagnostics and access control.",
};

function ShellFallback() {
  return (
    <>
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-background" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6" />
    </>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "dark h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        playfairDisplayHeading.variable
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Suspense fallback={<ShellFallback />}>
          <SessionShell>{children}</SessionShell>
        </Suspense>
      </body>
    </html>
  );
}
