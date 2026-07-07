import { Link, useLocation } from "wouter";
import { Home, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export function SmsLayout({ children }: { children: React.ReactNode }) {
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
    { href: "/sms", label: "Home", icon: Home },
    { href: "/sms/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header / Navigation Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/sms" className="font-bold text-lg flex items-center gap-2 text-indigo-400">
              <span className="hidden sm:inline">Paragon Stock</span>
              <span className="sm:hidden italic">Stock</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button 
                    variant={location === item.href ? "secondary" : "ghost"} 
                    size="sm"
                    className={`flex items-center gap-2 ${
                      location === item.href 
                        ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center text-[10px] text-indigo-400/60 uppercase tracking-widest font-bold opacity-75 mr-2">
              SMS MODULE
            </div>
            
            {/* Switch Module */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="text-xs text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border-slate-900 hover:border-indigo-500/20 h-8 gap-1.5"
              title="Switch Module"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Switch Module</span>
            </Button>
            
            {/* Sign Out */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-900/10">
        {children}
      </main>
    </div>
  );
}
