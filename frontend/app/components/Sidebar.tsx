"use client";

import { useRouter, usePathname } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menu = [
    { name: "Authority", path: "/authority" },
    { name: "Validator", path: "/validator" },
    { name: "Dashboard", path: "/" },
    { name: "Cases", path: "/cases" },
    { name: "Verification", path: "/court" },
  ];

  return (
    <div className="w-64 bg-[#0F2A44] text-white rounded-2xl border border-[#1E3A5F] shadow-sm p-4 flex flex-col justify-between">
      <div>
        <h1 className="text-lg font-bold mb-6">
          PRAMAAN
        </h1>

        <ul className="space-y-2">
          {menu.map((item) => {
            const active = pathname === item.path;

            return (
              <li
                key={item.name}
                onClick={() => item.path && router.push(item.path)}
                className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition ${
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-blue-100 hover:bg-white/5"
                }`}
              >
                {item.name}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="text-xs text-green-300 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
        ● System Active
      </div>
    </div>
  );
}