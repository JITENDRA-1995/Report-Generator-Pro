import { Link, useLocation } from "wouter";
import { Home, LogOut, LayoutDashboard, Settings, FileSpreadsheet, FileCheck, Zap } from "lucide-react";
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
    { href: "/sms/smart-production", label: "Smart Production", icon: Zap },
    { href: "/sms/universal", label: "Universal Import & Export", icon: FileSpreadsheet },
    { href: "/sms/renewal", label: "Renewal Data", icon: FileCheck },
    { href: "/sms/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header / Navigation Bar */}
      <header className="border-b border-slate-900 bg-slate-950 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo on Left */}
          <div className="flex-1 flex items-center justify-start">
            <Link href="/sms" className="font-bold text-lg flex items-center gap-2 text-indigo-400 hover:opacity-90 transition-opacity">
              <span className="hidden sm:inline">Paragon Stock</span>
              <span className="sm:hidden italic">Stock</span>
            </Link>
          </div>
          
          {/* Centered Navigation Tabs */}
          <nav className="flex items-center justify-center gap-1.5 flex-none">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="group">
                <Button 
                  variant={location === item.href ? "secondary" : "ghost"} 
                  size="sm"
                  className={`flex items-center gap-2 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5 ${
                    location === item.href 
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent hover:border-slate-800"
                  }`}
                >
                  <item.icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                  <span className="hidden sm:inline font-semibold">{item.label}</span>
                  {/* Cool active/hover glow line at bottom */}
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ${
                    location === item.href ? "w-full" : "w-0 group-hover:w-full"
                  }`} />
                </Button>
              </Link>
            ))}
          </nav>
          
          {/* Actions on Right */}
          <div className="flex-1 flex items-center justify-end gap-3">
            <div className="hidden lg:flex items-center text-[10px] text-indigo-400/60 uppercase tracking-widest font-bold opacity-75 mr-2">
              SMS MODULE
            </div>
            
            {/* Switch Module */}
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
            
            {/* Sign Out */}
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-900/10">
        {children}
      </main>
    </div>
  );
}
