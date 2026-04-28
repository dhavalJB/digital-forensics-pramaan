"use client";

import "./globals.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { SessionProvider, useSession } from "./context/SessionContext";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { session } = useSession();

  // 🔒 If not logged in → only render children (login page)
  if (!session) {
    return <main className="w-full">{children}</main>;
  }

  // ✅ Logged in → full app UI
  return (
    <div className="flex bg-gray-100 w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6">{children}</main>
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
      <body>
        <SessionProvider>
          <AppLayout>{children}</AppLayout>
        </SessionProvider>
      </body>
    </html>
  );
}