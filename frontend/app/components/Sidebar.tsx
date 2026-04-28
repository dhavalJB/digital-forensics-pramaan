"use client";

import { useRouter, usePathname } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menu = [
    { name: "Authority", path: "/authority", icon: "🏛️" },
    { name: "Validator", path: "/validator", icon: "🛡️" },
    { name: "Dashboard", path: "/", icon: "📊" },
    { name: "Cases", path: "/cases", icon: "📁" },
    { name: "Verification", path: "/court", icon: "⚖️" },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col justify-between p-5 border-r border-slate-800 shadow-2xl">
      <div>
        {/* BRANDING SECTION */}
        <div className="mb-10 px-2">
          <h1 className="text-2xl font-black tracking-tighter italic text-white italic">
            PRAMAAN
          </h1>
          <div className="h-1 w-12 bg-blue-600 mt-1 rounded-full"></div>
          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-2">
            Forensic Ledger v3.0
          </p>
        </div>

        {/* NAVIGATION LIST */}
        <nav>
          <ul className="space-y-1.5">
            {menu.map((item) => {
              const active = pathname === item.path;

              return (
                <li
                  key={item.name}
                  onClick={() => item.path && router.push(item.path)}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 border-l-4 ${
                    active
                      ? "bg-blue-600/10 border-blue-600 text-blue-400 shadow-[inset_0px_0px_15px_rgba(37,99,235,0.1)]"
                      : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <span className={`text-lg transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110 opacity-70'}`}>
                    {item.icon}
                  </span>
                  <span className="uppercase tracking-tight text-[11px]">
                    {item.name}
                  </span>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* SYSTEM STATUS FOOTER */}
      <div className="space-y-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              System Active
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-500 leading-tight">
            NODE_ID: ME_PC_04 <br />
            SECURE_TUNNEL: ON
          </div>
        </div>

        <div className="px-2">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
            © 2026 METAREALM TECHNOLOGIES
          </p>
        </div>
      </div>
    </div>
  );
}