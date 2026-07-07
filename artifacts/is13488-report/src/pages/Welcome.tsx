import { useLocation } from "wouter";
import { ClipboardCheck, Boxes, LogOut, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function Welcome() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been securely logged out.",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.08),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(99,102,241,0.08),transparent_45%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
            PARAGON INDUSTRIES
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-medium uppercase tracking-widest">
            Hub
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 gap-2 border border-slate-800 hover:border-red-500/20 transition-all duration-300"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 max-w-4xl mx-auto text-center -mt-10">
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Welcome to the{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400 bg-clip-text text-transparent">
              Enterprise Hub
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">
            Select a module below to manage reporting specifications or track stock operations.
          </p>
        </div>

        {/* Module Selection Grid */}
        <div className="grid md:grid-cols-2 gap-8 w-full">
          {/* Card 1: Reporting System */}
          <div
            onClick={() => navigate("/reporting")}
            className="group relative rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-left cursor-pointer hover:border-emerald-500/35 hover:bg-slate-900/70 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                <ClipboardCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors duration-300">
                Reporting System
              </h2>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                Generate, manage, and verify quality test reports for IS standards (IS 13488, IS 14483, IS 13487) with cloud sync.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-emerald-400 font-semibold text-sm group-hover:translate-x-2 transition-transform duration-300">
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Stock Management System (SMS) */}
          <div
            onClick={() => navigate("/sms")}
            className="group relative rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-left cursor-pointer hover:border-indigo-500/35 hover:bg-slate-900/70 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                <Boxes className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors duration-300">
                Stock Management System
              </h2>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                Track warehouse inventory, manage production stock, and audit raw material storage logs. *(Currently in SMS development)*.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-indigo-400 font-semibold text-sm group-hover:translate-x-2 transition-transform duration-300">
              <span>Enter SMS Portal</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 text-center text-xs text-slate-600 border-t border-slate-900">
        &copy; {new Date().getFullYear()} Paragon Industries. All rights reserved.
      </footer>
    </div>
  );
}
