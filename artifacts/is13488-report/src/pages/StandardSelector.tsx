import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Pipette, 
  Droplets, 
  Waves, 
  ChevronRight, 
  ShieldCheck,
  FileText,
  Activity
} from "lucide-react";

export const STANDARDS = [
  { 
    id: 'is13488', 
    name: 'IS 13488 : 2008', 
    title: 'Emitting Pipe', 
    desc: 'Specification for Polyethylene Pipes for Irrigation',
    icon: Pipette,
    color: 'emerald'
  },
  { 
    id: 'is13487', 
    name: 'IS 13487 : 2024', 
    title: 'Emitters', 
    desc: 'Specification for Emitters/Drippers for Drip Irrigation',
    icon: Droplets,
    color: 'blue'
  },
  { 
    id: 'is14483', 
    name: 'IS 14483 : 2024', 
    title: 'Drippers', 
    desc: 'Inline Emitters and Emitting Pipes (New Standard)',
    icon: Waves,
    color: 'indigo'
  },
];

export function getCurrentStandard() {
  return localStorage.getItem('current_standard') || 'is13488';
}

export default function StandardSelector() {
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState(getCurrentStandard());

  const handleSelect = (id: string) => {
    localStorage.setItem('current_standard', id);
    // Reload to re-initialize storage keys and state
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />

      <div className="max-w-5xl w-full relative z-10">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
            <ShieldCheck className="w-3 h-3" /> Secure Command Center
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Select Testing Standard
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Choose the IS standard to begin generating manufacturing and test reports.
            Each standard maintains separate presets and history.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STANDARDS.map((s, idx) => (
            <Card 
              key={s.id}
              onClick={() => handleSelect(s.id)}
              className={`group relative p-8 cursor-pointer transition-all duration-300 border-white/10 hover:border-white/20 bg-white/5 backdrop-blur-sm overflow-hidden animate-in fade-in zoom-in duration-500 delay-[${idx * 100}ms] ${
                selected === s.id ? 'ring-2 ring-emerald-500 bg-white/10' : ''
              }`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-${s.color}-500/10 rounded-full blur-3xl group-hover:bg-${s.color}-500/20 transition-colors`} />
              
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-${s.color}-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <s.icon className={`w-8 h-8 text-${s.color}-400`} />
                </div>
                
                <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-2">
                  {s.name}
                </h3>
                <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                  {s.title}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 min-h-[48px]">
                  {s.desc}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Ready for Testing
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-500">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          <p className="text-slate-600 text-xs font-medium uppercase tracking-[0.2em]">
            Paragon Industrial Solutions • Quality Management System
          </p>
        </div>
      </div>
    </div>
  );
}
