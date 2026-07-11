import { Link, useLocation } from "wouter";
import { Home, FilePlus, FolderOpen, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { getCurrentStandard } from "@/standards/registry";

export function Layout({ children }: { children: React.ReactNode }) {
  const currentStandard = getCurrentStandard();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been securely logged out.",
    });
    navigate("/login");
  };

  const navItems = [
    { href: "/reporting", label: "Home", icon: Home },
    { href: "/new", label: "New Report", icon: FilePlus },
    { href: "/saved", label: "Saved Reports", icon: FolderOpen },
    { href: "/data", label: "Data Management", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="no-print border-b border-slate-900 bg-slate-950 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/reporting" className="font-bold text-lg flex items-center gap-2 text-emerald-400 hover:opacity-90 transition-opacity">
              <span className="hidden sm:inline">Paragon Reports</span>
              <span className="sm:hidden italic">Paragon</span>
            </Link>
            <nav className="flex items-center gap-1.5">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="group relative">
                  <Button 
                    variant={location === item.href ? "secondary" : "ghost"} 
                    size="sm"
                    className={`flex items-center gap-2 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5 ${
                      location === item.href 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent hover:border-slate-800"
                    }`}
                  >
                    <item.icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                    <span className="hidden sm:inline font-semibold">{item.label}</span>
                    {/* Cool active/hover glow line at bottom */}
                    <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ${
                      location === item.href ? "w-full" : "w-0 group-hover:w-full"
                    }`} />
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div id="header-actions" className="flex items-center gap-2" />
            <div className="flex items-center text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest mr-2">
              {currentStandard.id.toUpperCase()}
            </div>
            {location === "/reporting" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className="text-xs text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border-slate-900 hover:border-indigo-500/20 h-8 gap-1.5 transition-all duration-200"
                title="Switch Module"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Switch Module</span>
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 transition-colors duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-slate-900/10 relative">
        {/* Background Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.03),transparent_40%)] pointer-events-none" />
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
