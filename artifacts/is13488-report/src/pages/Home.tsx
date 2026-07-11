import { Link } from "wouter";
import { FilePlus, FolderOpen, Settings, RefreshCw, ArrowRight } from "lucide-react";
import { getCurrentStandard } from "@/standards/registry";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StandardSelector } from "@/components/StandardSelector";
import { Button } from "@/components/ui/button";

const getDarkThemeClasses = (color: string) => {
  const c = color.toLowerCase();
  if (c.includes("emerald") || c.includes("green")) {
    return {
      glowGradient: "from-emerald-500/20 to-teal-500/20",
      iconBg: "bg-emerald-500/5",
      iconBorder: "border-emerald-500/10",
      iconText: "text-emerald-400",
      iconHoverBg: "group-hover:bg-emerald-500/15",
      accentBg: "bg-emerald-500",
      textHover: "group-hover:text-emerald-400",
      btnText: "text-emerald-400"
    };
  } else if (c.includes("blue") || c.includes("sky") || c.includes("cyan")) {
    return {
      glowGradient: "from-blue-500/20 to-cyan-500/20",
      iconBg: "bg-blue-500/5",
      iconBorder: "border-blue-500/10",
      iconText: "text-blue-400",
      iconHoverBg: "group-hover:bg-blue-500/15",
      accentBg: "bg-blue-500",
      textHover: "group-hover:text-blue-400",
      btnText: "text-blue-400"
    };
  } else if (c.includes("indigo") || c.includes("purple") || c.includes("pink")) {
    return {
      glowGradient: "from-indigo-500/20 to-purple-500/20",
      iconBg: "bg-indigo-500/5",
      iconBorder: "border-indigo-500/10",
      iconText: "text-indigo-400",
      iconHoverBg: "group-hover:bg-indigo-500/15",
      accentBg: "bg-indigo-500",
      textHover: "group-hover:text-indigo-400",
      btnText: "text-indigo-400"
    };
  } else if (c.includes("rose") || c.includes("red")) {
    return {
      glowGradient: "from-rose-500/20 to-red-500/20",
      iconBg: "bg-rose-500/5",
      iconBorder: "border-rose-500/10",
      iconText: "text-rose-400",
      iconHoverBg: "group-hover:bg-rose-500/15",
      accentBg: "bg-rose-500",
      textHover: "group-hover:text-rose-400",
      btnText: "text-rose-400"
    };
  } else {
    return {
      glowGradient: "from-amber-500/20 to-orange-500/20",
      iconBg: "bg-amber-500/5",
      iconBorder: "border-amber-500/10",
      iconText: "text-amber-400",
      iconHoverBg: "group-hover:bg-amber-500/15",
      accentBg: "bg-amber-500",
      textHover: "group-hover:text-amber-400",
      btnText: "text-amber-400"
    };
  }
};

export default function Home() {
  const currentStandard = getCurrentStandard();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const items = currentStandard.homeItems;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center py-12 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold mb-4 uppercase tracking-wider">
            Active Standard: {currentStandard.fullName}
          </div>
          <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight">Inventory & Report Management System (IRMS)</h1>
          <p className="text-slate-400 mt-2 max-w-xl mx-auto text-sm leading-relaxed">
            Professional quality test report management system for industrial standards.
          </p>
          
          <div className="mt-6 flex justify-center">
            <Dialog open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full px-6 border-slate-800 text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all duration-200">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Switch Standard
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-slate-950 border-slate-900 text-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-slate-100">Select Industrial Standard</DialogTitle>
                </DialogHeader>
                <StandardSelector onSelect={() => setIsSelectorOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it) => {
            const theme = getDarkThemeClasses(it.color);
            return (
              <Link key={it.to} href={it.to}>
                <div className="group relative rounded-2xl border border-slate-900 bg-slate-900/30 p-8 cursor-pointer hover:border-slate-800/80 hover:bg-slate-900/40 hover:shadow-[0_0_30px_-5px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden h-full">
                  {/* Glowing Border Backplate */}
                  <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${theme.glowGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[2px] -z-10`} />

                  {/* Top Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] w-0 ${theme.accentBg} group-hover:w-full transition-all duration-500 rounded-t-2xl`} />

                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-all duration-300 ${theme.iconBg} ${theme.iconBorder} ${theme.iconText} ${theme.iconHoverBg} group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:rotate-3`}>
                      <it.icon className="w-7 h-7" />
                    </div>
                    <h2 className={`text-xl font-bold mb-2 text-slate-100 ${theme.textHover} transition-colors duration-300`}>{it.title}</h2>
                    <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">{it.desc}</p>
                  </div>
                  
                  <div className={`mt-8 flex items-center gap-1.5 font-semibold text-xs transition-colors duration-300 ${theme.btnText}`}>
                    <span>Proceed</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
