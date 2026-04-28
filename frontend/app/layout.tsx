"use client";

import "./globals.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { SessionProvider, useSession } from "./context/SessionContext";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { session } = useSession();

  // Authentication / Login Layout
  if (!session) {
    return (
      <main className="h-screen w-screen overflow-hidden bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    );
  }

  // Primary Forensic Workspace Layout
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 p-4 flex gap-4">
      {/* PERSISTENT NAVIGATION */}
      <Sidebar />

      <div className="flex-1 flex flex-col gap-4 h-full min-w-0">
        {/* SESSION & STATUS BAR */}
        <Header />

        {/* MAIN DATA VIEWPORT */}
        <main className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden relative">
          {/* Internal Scrollable Canvas */}
          <div className="h-full w-full overflow-y-auto p-6 custom-scrollbar">
            {children}
          </div>

          {/* Subdued Bottom Edge Detail for Professionalism */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-slate-900 to-emerald-500 opacity-20"></div>
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
    <html lang="en" className="antialiased">
      <head>
        <title>PRAMAAN | Digital Evidence Management</title>
      </head>
      <body className="h-screen overflow-hidden bg-slate-100 text-slate-900 selection:bg-blue-100">
        <SessionProvider>
          <AppLayout>{children}</AppLayout>
        </SessionProvider>

        {/* Global CSS Overrides for Forensic UI Feel */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>
      </body>
    </html>
  );
}