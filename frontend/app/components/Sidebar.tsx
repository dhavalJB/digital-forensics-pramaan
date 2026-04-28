"use client";

import { useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();

  const menu = [
    { name: "Authority", path: "/authority" },
    { name: "Validator", path: "/validator" },

    // keep future items but disabled
    { name: "Dashboard", path: "/" },
    { name: "Cases", path: "/cases" },
    { name: "Verification", path: "/court" },
  ];

  return (
    <div className="w-64 bg-blue-900 text-white min-h-screen p-4">
      <h1 className="text-xl font-bold mb-6">PRAMAAN</h1>

      <ul className="space-y-2">
        {menu.map((item) => (
          <li
            key={item.name}
            onClick={() => item.path && router.push(item.path)}
            className={`p-2 rounded ${item.path
              ? "hover:bg-blue-700 cursor-pointer"
              : "opacity-40 cursor-not-allowed"
              }`}
          >
            {item.name}
          </li>
        ))}
      </ul>

      <div className="mt-10 text-sm text-green-300">
        ● System Active
      </div>
    </div>
  );
}