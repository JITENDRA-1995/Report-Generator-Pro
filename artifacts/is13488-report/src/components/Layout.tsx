import { Link, useLocation } from "wouter";
import { Home, FilePlus, FolderOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/new", label: "New Report", icon: FilePlus },
    { href: "/saved", label: "Saved Reports", icon: FolderOpen },
    { href: "/data", label: "Data Management", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="no-print border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-lg flex items-center gap-2 text-emerald-700">
              <span className="hidden sm:inline">Paragon Reports</span>
              <span className="sm:hidden italic">Paragon</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button 
                    variant={location === item.href ? "secondary" : "ghost"} 
                    size="sm"
                    className={`flex items-center gap-2 ${location === item.href ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : ""}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div id="header-actions" className="flex items-center gap-2" />
            <div className="flex items-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">
              IS 13488 : 2008
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-slate-50/30">
        {children}
      </main>
    </div>
  );
}
