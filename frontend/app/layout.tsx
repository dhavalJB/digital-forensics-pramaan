"use client";

import "./globals.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { SessionProvider, useSession } from "./context/SessionContext";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { session } = useSession();

  if (!session) {
    return (
      <main className="h-screen overflow-hidden bg-[#F4F7FB] flex items-center justify-center">
        {children}
      </main>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F4F7FB] p-4 flex gap-4">
      <Sidebar />

      <div className="flex-1 flex flex-col gap-4 h-full">
        <Header />

        <main className="flex-1 bg-white rounded-2xl border border-[#E3E8EF] shadow-sm p-6 overflow-hidden">
          <div className="h-full overflow-y-auto pr-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden bg-[#F4F7FB] text-[#0F172A]">
        <SessionProvider>
          <AppLayout>{children}</AppLayout>
        </SessionProvider>
      </body>
    </html>
  );
}