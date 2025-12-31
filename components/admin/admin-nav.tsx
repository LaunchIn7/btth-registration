"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Registrations" },
    { href: "/admin/config", label: "Config" },
  ];

  return (
    <aside className="w-full md:w-64 bg-gray-800 text-white p-4 shrink-0 md:h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 md:mb-6">Admin Panel</h2>
      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-4 py-2 rounded ${pathname === item.href
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-700"
                  }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
