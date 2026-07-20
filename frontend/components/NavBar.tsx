"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MODULES = [
  { href: "/sentinel", label: "SENTINEL", sub: "Scam Detection" },
  { href: "/netra", label: "NETRA", sub: "Currency Check" },
  { href: "/jaal", label: "JAAL", sub: "Fraud Network" },
  { href: "/drishti", label: "DRISHTI", sub: "Crime Map" },
  { href: "/kavach", label: "KAVACH", sub: "Citizen Shield" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className="border-b border-line bg-panel/60 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-baseline gap-2 shrink-0">
          <span className="font-display font-700 text-lg tracking-tight text-ink">RAKSHA</span>
          <span className="font-mono text-[10px] text-alert">AI</span>
        </Link>
        <nav className="flex gap-1 overflow-x-auto">
          {MODULES.map((m) => {
            const active = pathname?.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                  active ? "bg-accent/15 text-accent" : "text-muted hover:text-ink hover:bg-white/5"
                }`}
              >
                {m.label}
                <span className="hidden md:inline text-muted/70 ml-1">· {m.sub}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
