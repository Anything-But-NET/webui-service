import type { ReactNode } from "react";
import Navbar from "@/components/navbar";
import { SessionProvider } from "@/components/session-provider";
import { getServerSession } from "@/lib/auth";

export default async function SessionShell({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  return (
    <SessionProvider
      initialUser={session.user}
      initialNeedsRefresh={session.needsCookieRefresh}
    >
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </SessionProvider>
  );
}
