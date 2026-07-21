import { useLocation } from "wouter";
import { 
  Droplet, 
  Cpu, 
  Workflow, 
  Layers, 
  Disc, 
  Gauge,
  ArrowRight,
  Zap
} from "lucide-react";

interface SmsStandardItem {
  id: string;
  name: string;
  subName: string;
  desc: string;
  icon: React.ComponentType<any>;
  theme: {
    glowGradient: string;
    iconBg: string;
    iconBorder: string;
    iconText: string;
    iconHoverBg: string;
    textHover: string;
    accentBg: string;
    tagStyle: string;
  };
}

export default function SmsDashboard() {
  const [, navigate] = useLocation();

  const smsStandards: SmsStandardItem[] = [
    {
      id: "is13488",
      name: "IS 13488",
      subName: "Emitting Pipe",
      desc: "Audit emitting pipe production logs, warehouse inventory, and sales dispatch registers with styled daily stock ledgers and monthly summaries.",
      icon: Droplet,
      theme: {
        glowGradient: "from-cyan-500/20 to-blue-500/20",
        iconBg: "bg-cyan-500/5",
        iconBorder: "border-cyan-500/10",
        iconText: "text-cyan-400",
        iconHoverBg: "group-hover:bg-cyan-500/15",
        textHover: "group-hover:text-cyan-400",
        accentBg: "bg-cyan-500",
        tagStyle: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/35 group-hover:text-cyan-200"
      }
    },
    {
      id: "is13487",
      name: "IS 13487",
      subName: "Emitters",
      desc: "Monitor daily emitter assembly inputs, flow rate distributions, and bulk release entries with formatted ledger sheets.",
      icon: Cpu,
      theme: {
        glowGradient: "from-amber-500/20 to-orange-500/20",
        iconBg: "bg-amber-500/5",
        iconBorder: "border-amber-500/10",
        iconText: "text-amber-400",
        iconHoverBg: "group-hover:bg-amber-500/15",
        textHover: "group-hover:text-amber-400",
        accentBg: "bg-amber-500",
        tagStyle: "text-amber-400 border-amber-500/20 bg-amber-500/5 group-hover:bg-amber-500/10 group-hover:border-amber-500/35 group-hover:text-amber-200"
      }
    },
    {
      id: "is12786",
      name: "IS 12786",
      subName: "Plain Laterals",
      desc: "Audit lateral pipe production outputs, stock reconciliation across pressure ratings, and client dispatch logs.",
      icon: Workflow,
      theme: {
        glowGradient: "from-purple-500/20 to-pink-500/20",
        iconBg: "bg-purple-500/5",
        iconBorder: "border-purple-500/10",
        iconText: "text-purple-400",
        iconHoverBg: "group-hover:bg-purple-500/15",
        textHover: "group-hover:text-purple-400",
        accentBg: "bg-purple-500",
        tagStyle: "text-purple-400 border-purple-500/20 bg-purple-500/5 group-hover:bg-purple-500/10 group-hover:border-purple-500/35 group-hover:text-purple-200"
      }
    },
    {
      id: "is4985",
      name: "IS 4985",
      subName: "uPVC Pipe",
      desc: "Manage uPVC rigid pipe stock balances, production yields, and sales registers with automated meter-to-pipe length conversion.",
      icon: Disc,
      theme: {
        glowGradient: "from-emerald-500/20 to-teal-500/20",
        iconBg: "bg-emerald-500/5",
        iconBorder: "border-emerald-500/10",
        iconText: "text-emerald-400",
        iconHoverBg: "group-hover:bg-emerald-500/15",
        textHover: "group-hover:text-emerald-400",
        accentBg: "bg-emerald-500",
        tagStyle: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/35 group-hover:text-emerald-200"
      }
    },
    {
      id: "is17425",
      name: "IS 17425",
      subName: "HDPE Pipe",
      desc: "Track high-density polyethylene sprinkler pipe production batches, daily sales shipments, and active stock balances.",
      icon: Layers,
      theme: {
        glowGradient: "from-blue-500/20 to-indigo-500/20",
        iconBg: "bg-blue-500/5",
        iconBorder: "border-blue-500/10",
        iconText: "text-blue-400",
        iconHoverBg: "group-hover:bg-blue-500/15",
        textHover: "group-hover:text-blue-400",
        accentBg: "bg-blue-500",
        tagStyle: "text-blue-400 border-blue-500/20 bg-blue-500/5 group-hover:bg-blue-500/10 group-hover:border-blue-500/35 group-hover:text-blue-200"
      }
    },
    {
      id: "is14483",
      name: "IS 14483",
      subName: "Venturi Injector",
      desc: "Audit Venturi injector components, manage daily production yields, and track shipping records against active warehouse inventory.",
      icon: Gauge,
      theme: {
        glowGradient: "from-rose-500/20 to-red-500/20",
        iconBg: "bg-rose-500/5",
        iconBorder: "border-rose-500/10",
        iconText: "text-rose-400",
        iconHoverBg: "group-hover:bg-rose-500/15",
        textHover: "group-hover:text-rose-400",
        accentBg: "bg-rose-500",
        tagStyle: "text-rose-400 border-rose-500/20 bg-rose-500/5 group-hover:bg-rose-500/10 group-hover:border-rose-500/35 group-hover:text-rose-200"
      }
    },
    {
      id: "smart-production",
      name: "GLOBAL TOOL",
      subName: "Smart Production",
      desc: "Automatically calculate and generate production entries for IS 13487 and IS 14483 concurrently across all sizes to meet your target stock.",
      icon: Zap,
      theme: {
        glowGradient: "from-purple-500/20 to-fuchsia-500/20",
        iconBg: "bg-purple-500/5",
        iconBorder: "border-purple-500/10",
        iconText: "text-purple-400",
        iconHoverBg: "group-hover:bg-purple-500/15",
        textHover: "group-hover:text-purple-400",
        accentBg: "bg-purple-500",
        tagStyle: "text-purple-400 border-purple-500/20 bg-purple-500/5 group-hover:bg-purple-500/10 group-hover:border-purple-500/35 group-hover:text-purple-200"
      }
    }
  ];

  const handleCardClick = (item: SmsStandardItem) => {
    if (item.id === "smart-production") {
      navigate("/sms/smart-production");
    } else {
      navigate(`/sms/standard/${item.id}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100 py-12 px-6 font-sans relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent_40%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        {/* Title Section */}
        <div className="text-center md:text-left border-b border-slate-900 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Stock Management Hub</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Select an IS standard category to audit stock quantities, production batches, and release registers.
            </p>
          </div>
          <div className="hidden md:flex items-center text-[10px] px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 font-bold uppercase tracking-widest">
            6 Categories Available
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {smsStandards.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="group relative rounded-2xl border border-slate-900 bg-slate-900/30 p-6 cursor-pointer hover:border-slate-800/80 hover:bg-slate-900/40 hover:shadow-[0_0_30px_-5px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
              >
                {/* Glowing Border Backplate */}
                <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${item.theme.glowGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[2px] -z-10`} />

                {/* Top Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] w-0 ${item.theme.accentBg} group-hover:w-full transition-all duration-500 rounded-t-2xl`} />

                <div className="relative z-10">
                  {/* Icon and Standard Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-xl ${item.theme.iconBg} border ${item.theme.iconBorder} flex items-center justify-center ${item.theme.iconText} ${item.theme.iconHoverBg} group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:rotate-3 transition-all duration-300`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all duration-300 font-bold tracking-wider ${item.theme.tagStyle}`}>
                      {item.name}
                    </span>
                  </div>

                  {/* Text Content */}
                  <h3 className={`text-xl font-bold text-slate-100 ${item.theme.textHover} transition-colors duration-300`}>
                    {item.subName}
                  </h3>
                  <p className="mt-2.5 text-slate-400 text-xs leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                    {item.desc}
                  </p>
                </div>

                {/* Card Action Link */}
                <div className={`mt-6 flex items-center gap-1.5 text-indigo-400 ${item.theme.textHover} font-semibold text-xs transition-colors duration-300`}>
                  <span>Manage Stock</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
