"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export function NavShell() {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Punch List
        </Link>
        <nav aria-label="Main" className="flex items-center gap-6 text-sm">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`transition-colors ${
                  active
                    ? "text-amber-400 font-medium"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
