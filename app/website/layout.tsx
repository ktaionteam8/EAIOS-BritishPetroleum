import Link from "next/link";

const NAV = [
  { href: "/website", label: "Home" },
  { href: "/website/about", label: "About" },
  { href: "/website/services", label: "Services" },
  { href: "/website/careers", label: "Careers" },
  { href: "/website/contact", label: "Contact" },
];

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-900">
      <header className="border-b border-bg-700 bg-bg-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/website" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">bp</span>
            </div>
            <span className="text-slate-100 font-semibold">British Petroleum</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-bg-800">
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/login" className="text-sm text-slate-300 hover:text-white border border-bg-600 hover:border-slate-500 rounded-lg px-4 py-1.5">
            EAIOS Sign in
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-bg-700 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-10 text-xs text-slate-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} British Petroleum plc (demo environment)</span>
          <span>Powered by EAIOS — 36 AI microservices</span>
        </div>
      </footer>
    </div>
  );
}
