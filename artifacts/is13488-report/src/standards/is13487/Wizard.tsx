import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Ruler, 
  Droplets, 
  BarChart3, 
  Activity,
  Calculator,
  Eye
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReportData, Preset } from "@/lib/types";

interface WizardProps {
  data: ReportData;
  setData: (data: ReportData) => void;
  preset: Preset;
}

const steps = [
  { id: "basic", title: "Identity", icon: ShieldCheck },
  { id: "mechanical", title: "Mechanical", icon: Ruler },
  { id: "uniformity", title: "Uniformity", icon: BarChart3 },
  { id: "performance", title: "Performance", icon: Droplets },
  { id: "exponent", title: "Exponent", icon: Activity },
];

export function IS13487Wizard({ data, setData, preset, onPreview }: WizardProps) {
  const [activeStep, setActiveStep] = useState(0);

  const next = () => setActiveStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setActiveStep(s => Math.max(s - 1, 0));
  const isLastStep = activeStep === steps.length - 1;

  return (
    <div className="max-w-6xl mx-auto py-4">
      {/* Progress Bar */}
      <div className="flex justify-between mb-8 relative px-4">
        <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 z-0" />
        <div 
          className="absolute top-5 left-0 h-1 bg-indigo-500 z-0 transition-all duration-500" 
          style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((s, i) => (
          <div key={s.id} className="relative z-10 flex flex-col items-center group">
            <button
              onClick={() => setActiveStep(i)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border-2 ${
                i <= activeStep ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              {i < activeStep ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
            </button>
            <span className={`text-[10px] font-black mt-2 uppercase tracking-tighter ${i <= activeStep ? "text-indigo-600" : "text-slate-400"}`}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="min-h-[500px]"
        >
          {activeStep === 0 && <IdentityStep data={data} setData={setData} />}
          {activeStep === 1 && <MechanicalStep data={data} setData={setData} />}
          {activeStep === 2 && <UniformityStep data={data} setData={setData} />}
          {activeStep === 3 && <PerformanceStep data={data} setData={setData} preset={preset} />}
          {activeStep === 4 && <ExponentStep data={data} setData={setData} />}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-10 p-6 bg-slate-50 rounded-2xl">
        <Button variant="outline" onClick={prev} disabled={activeStep === 0} className="rounded-xl px-8">
          <ChevronLeft className="w-4 h-4 mr-2" /> Previous
        </Button>
        <Button 
          onClick={isLastStep ? onPreview : next} 
          className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-12 shadow-lg shadow-indigo-200"
        >
          {isLastStep ? (
            <span className="flex items-center"><Eye className="w-4 h-4 mr-2" /> Preview</span>
          ) : (
            <span className="flex items-center">Continue <ChevronRight className="w-4 h-4 ml-2" /></span>
          )}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function IdentityStep({ data, setData }: { data: ReportData; setData: (d: ReportData) => void }) {
  const b = data.basicInfo;
  const upd = (k: keyof typeof b, v: string) => setData({ ...data, basicInfo: { ...b, [k]: v } });

  // Helper to convert DD/MM/YYYY to YYYY-MM-DD for <input type="date" />
  const toIso = (display: string) => {
    if (!display) return "";
    const match = display.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (match) {
      const [, d, m, y] = match;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return display;
  };

  // Helper to convert YYYY-MM-DD to DD/MM/YYYY for storage
  const fromIso = (iso: string) => {
    if (!iso) return "";
    const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, y, m, d] = match;
      return `${d}/${m}/${y}`;
    }
    return iso;
  };

  return (
    <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 bg-white">
      <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
        Identity & Traceability
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        <Field label="Brand Name"><Input className="h-12" value={b.className} onChange={e => upd("className", e.target.value)} placeholder="e.g. PARAGON" /></Field>
        <Field label="Size (LPH)"><Input className="h-12" value={b.size} onChange={e => upd("size", e.target.value)} /></Field>
        <Field label="Type & Category"><Input className="h-12" value={b.category} onChange={e => upd("category", e.target.value)} placeholder="e.g. Unregulated, B" /></Field>
        <Field label="Batch Number"><Input className="h-12" value={b.batchNo} onChange={e => upd("batchNo", e.target.value)} /></Field>
        <Field label="Mfg Date"><Input type="date" className="h-12" value={toIso(b.dateOfMfg)} onChange={e => upd("dateOfMfg", fromIso(e.target.value))} /></Field>
        <Field label="Test Date"><Input type="date" className="h-12" value={toIso(b.dateOfTest)} onChange={e => upd("dateOfTest", fromIso(e.target.value))} /></Field>
        <Field label="Mfg Qty (NOS)"><Input className="h-12" value={b.qtyOfProduction} onChange={e => upd("qtyOfProduction", e.target.value)} /></Field>
        <Field label="Nominal Test Pressure"><Input className="h-12" value={b.discharge} onChange={e => upd("discharge", e.target.value)} placeholder="e.g. 1.0 kg/cm²" /></Field>
        <Field label="Format No"><Input className="h-12" value={b.formatNo} onChange={e => upd("formatNo", e.target.value)} /></Field>
      </div>
    </Card>
  );
}

function MechanicalStep({ data, setData }: { data: ReportData; setData: (d: ReportData) => void }) {
  const avgFlow = data.flowPath.values.filter(v => v > 0).length 
    ? data.flowPath.values.reduce((a, b) => a + b, 0) / data.flowPath.values.filter(v => v > 0).length 
    : 0;

  return (
    <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 bg-white">
      <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Ruler className="w-5 h-5" /></div>
        Mechanical Integrity
      </h2>
      <div className="space-y-8">
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Construction & Flow Path (Cl. 7.1 & 7.2)</h3>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Average Flow Path</span>
              <span className="text-lg font-black text-emerald-600">{avgFlow.toFixed(3)} mm</span>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Field label="Visual Appearance (Workmanship)">
              <Input className="h-12" value={data.visualAppearance} onChange={e => setData({...data, visualAppearance: e.target.value})} />
            </Field>
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-500 uppercase">Min Declared Flow Path Readings (mm)</Label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map(i => (
                  <Input key={i} type="number" step="any" className="h-11" placeholder={`R${i+1}`} 
                    value={data.flowPath.values[i] || ""} 
                    onChange={e => {
                      const next = [...data.flowPath.values];
                      next[i] = parseFloat(e.target.value) || 0;
                      setData({...data, flowPath: {...data.flowPath, values: next}});
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Hydrostatic Pressure (Cl. 7.3)</h3>
            <div className="flex gap-4">
              <Button 
                variant={data.hydraulicAmbient.dischargeBefore[0] === 1 ? "default" : "outline"}
                className={`flex-1 h-14 font-bold rounded-xl transition-all ${data.hydraulicAmbient.dischargeBefore[0] === 1 ? "bg-indigo-600" : ""}`}
                onClick={() => setData({...data, hydraulicAmbient: {...data.hydraulicAmbient, dischargeBefore: [1]}})}
              >
                NO LEAKAGE
              </Button>
              <Button 
                variant={data.hydraulicAmbient.dischargeBefore[0] === 0 ? "destructive" : "outline"}
                className="flex-1 h-14 font-bold rounded-xl"
                onClick={() => setData({...data, hydraulicAmbient: {...data.hydraulicAmbient, dischargeBefore: [0]}})}
              >
                FAILURE
              </Button>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-100">
            <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-4">Emitter Pull-Out (Cl. 7.4)</h3>
             <div className="flex gap-4">
              <Button 
                variant={data.pullOut.result === "PASS" ? "default" : "outline"}
                className={`flex-1 h-14 font-bold rounded-xl transition-all ${data.pullOut.result === "PASS" ? "bg-rose-600 hover:bg-rose-700" : ""}`}
                onClick={() => setData({...data, pullOut: {...data.pullOut, result: "PASS"}})}
              >
                PASS
              </Button>
              <Button 
                variant={data.pullOut.result === "FAIL" ? "destructive" : "outline"}
                className="flex-1 h-14 font-bold rounded-xl"
                onClick={() => setData({...data, pullOut: {...data.pullOut, result: "FAIL"}})}
              >
                FAIL
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function UniformityStep({ data, setData }: { data: ReportData; setData: (d: ReportData) => void }) {
  // Initialize 25 rows if empty
  useEffect(() => {
    if (data.uniformity.length !== 25) {
      const rows = Array.from({ length: 25 }, () => ({ emissionRate: 0, dischargeInSecs: 0, dischargeLph: 0 }));
      setData({ ...data, uniformity: rows });
    }
  }, []);

  const updateRow = (i: number, val: number) => {
    const next = [...data.uniformity];
    // val is discharge in 180s
    const lph = (val / 180) * 3600;
    next[i] = { 
      ...next[i], 
      dischargeInSecs: val, 
      dischargeLph: Number(lph.toFixed(3)),
      emissionRate: Number(lph.toFixed(3)) 
    };
    setData({ ...data, uniformity: next });
  };

  const lphValues = data.uniformity.map(u => u.dischargeLph || 0).filter(v => v > 0);
  const mean = lphValues.length ? lphValues.reduce((a, b) => a + b, 0) / lphValues.length : 0;
  const stdDev = lphValues.length > 1 ? Math.sqrt(lphValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (lphValues.length - 1)) : 0;
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  return (
    <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 bg-white">
      <div className="flex justify-between items-start mb-8">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><BarChart3 className="w-5 h-5" /></div>
          Uniformity of Emission (25 Samples)
        </h2>
        <div className="flex gap-4">
           <StatBox label="Mean (LPH)" value={mean.toFixed(3)} color="text-blue-600" />
           <StatBox label="CV (%)" value={cv.toFixed(2)} color="text-emerald-600" />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-x-6 gap-y-4">
        {data.uniformity.map((row, i) => (
          <div key={i} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <span className="text-[10px] font-black text-slate-300 w-4">{i + 1}</span>
            <div className="flex-1">
              <Label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">180s (ml)</Label>
              <Input 
                type="number" step="any" className="h-9 font-mono text-xs" 
                value={row.dischargeInSecs || ""} 
                onChange={e => updateRow(i, parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="w-16">
              <Label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">LPH</Label>
              <div className="h-9 flex items-center text-xs font-black text-slate-700 bg-slate-100 rounded px-2">{row.dischargeLph || "0.00"}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PerformanceStep({ data, setData, preset }: { data: ReportData; setData: (d: ReportData) => void; preset: Preset }) {
  // Initialize from preset if empty or length mismatch
  useEffect(() => {
    if (preset.declaredDischargePerPressure?.length && data.pressureTest.length !== preset.declaredDischargePerPressure.length) {
      const points = preset.declaredDischargePerPressure.map(p => ({ 
        pressure: p.pressure, 
        readings: [p.discharge * 50, p.discharge * 50, p.discharge * 50, p.discharge * 50], // Initial ml
        declared: p.discharge 
      }));
      setData({ ...data, pressureTest: points });
    }
  }, [preset]);

  const updateReading = (rowIndex: number, readingIndex: number, val: number) => {
    const next = [...data.pressureTest];
    const readings = [...next[rowIndex].readings];
    while (readings.length < 4) readings.push(0);
    readings[readingIndex] = val;
    next[rowIndex] = { ...next[rowIndex], readings };
    setData({ ...data, pressureTest: next });
  };

  return (
    <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 bg-white">
      <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><Droplets className="w-5 h-5" /></div>
        Emission Rate Vs Inlet Pressure
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-500">
              <th className="border p-2">NO</th>
              <th className="border p-2">Pressure (kg/cm²)</th>
              <th className="border p-2" colSpan={4}>Discharge from Dripper (ml)</th>
              <th className="border p-2">Average (ml)</th>
              <th className="border p-2">Discharge in LPH</th>
              <th className="border p-2">Declared LPH</th>
              <th className="border p-2">Variation %</th>
            </tr>
            <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
              <th className="border p-1" colSpan={2}></th>
              <th className="border p-1">3</th>
              <th className="border p-1">12</th>
              <th className="border p-1">13</th>
              <th className="border p-1">23</th>
              <th className="border p-1" colSpan={4}></th>
            </tr>
          </thead>
          <tbody>
            {data.pressureTest.map((row, i) => {
              const avgMl = row.readings.reduce((a, b) => a + b, 0) / Math.max(row.readings.length, 1);
              const actualLph = avgMl / 50;
              const variation = row.declared ? ((actualLph - row.declared) / row.declared) * 100 : 0;
              
              return (
                <tr key={i} className="text-center font-mono text-xs">
                  <td className="border p-2 font-bold text-slate-400">{i + 1}</td>
                  <td className="border p-2 font-black text-slate-700">{row.pressure.toFixed(1)}</td>
                  {[0, 1, 2, 3].map(ri => (
                    <td key={ri} className="border p-1">
                      <Input 
                        type="number" step="any" className="h-8 text-center text-[11px] bg-transparent border-none focus:ring-0" 
                        value={row.readings[ri] || ""} 
                        onChange={e => updateReading(i, ri, parseFloat(e.target.value) || 0)} 
                      />
                    </td>
                  ))}
                  <td className="border p-2 bg-slate-50 font-bold">{avgMl.toFixed(1)}</td>
                  <td className="border p-2 bg-indigo-50 font-black text-indigo-600">{actualLph.toFixed(2)}</td>
                  <td className="border p-2 text-slate-400">{row.declared.toFixed(2)}</td>
                  <td className={`border p-2 font-bold ${Math.abs(variation) > 7 ? "text-rose-600" : "text-emerald-600"}`}>
                    {variation.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ExponentStep({ data, setData }: { data: ReportData; setData: (d: ReportData) => void }) {
  const calculateM = () => {
    const validPoints = data.pressureTest.filter(r => r.pressure > 0 && r.readings.some(v => v > 0));
    if (validPoints.length < 2) return;

    const p1 = validPoints[0].pressure;
    const avg1 = validPoints[0].readings.reduce((a, b) => a + b, 0) / validPoints[0].readings.length;
    const q1 = avg1 / 50;

    const p2 = validPoints[validPoints.length - 1].pressure;
    const avg2 = validPoints[validPoints.length - 1].readings.reduce((a, b) => a + b, 0) / validPoints[validPoints.length - 1].readings.length;
    const q2 = avg2 / 50;

    if (p1 === p2 || q1 === 0 || q2 === 0) return;
    const m = Math.log(q1 / q2) / Math.log(p1 / p2);
    setData({ ...data, forcedM: Number(m.toFixed(4)) });
  };

  const isMValid = data.forcedM !== undefined && data.forcedM >= 0.21 && data.forcedM <= 0.49;

  return (
    <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 bg-white">
      <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><Activity className="w-5 h-5" /></div>
        Determination of Emitter Exponent (m)
      </h2>
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className={`p-8 rounded-3xl text-white shadow-xl ${isMValid ? "bg-slate-900" : "bg-rose-600 animate-pulse"}`}>
             <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Calculated Exponent (m)</Label>
             <div className="text-6xl font-black tracking-tighter mb-4">{data.forcedM?.toFixed(4) || "0.0000"}</div>
             <p className="text-sm text-slate-300 leading-relaxed italic">
                Required Range: 0.21 to 0.49. 
                {!isMValid && data.forcedM !== undefined && " (OUT OF RANGE)"}
             </p>
          </div>
          <Button onClick={calculateM} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-lg font-bold">
            <Calculator className="w-5 h-5 mr-2" /> Auto-Calculate Exponent
          </Button>
        </div>
        <div className="space-y-6">
           <h3 className="font-bold text-slate-800">Manual Override</h3>
           <Field label="Override Exponent Value">
             <Input 
                type="number" step="any" className="h-12" 
                value={data.forcedM || ""} 
                onChange={e => setData({...data, forcedM: parseFloat(e.target.value) || 0})} 
              />
           </Field>
           <div className="p-4 rounded-xl border-2 border-dashed border-slate-200">
             <p className="text-xs text-slate-500 font-medium">
                Formula used: m = ln(q₁/q₂) / ln(p₁/p₂)<br/>
                Calculated between P={data.pressureTest[0]?.pressure} and P={data.pressureTest[data.pressureTest.length-1]?.pressure} kg/cm².
             </p>
           </div>
        </div>
      </div>
    </Card>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-[100px]">
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-lg font-black tracking-tight ${color}`}>{value}</div>
    </div>
  );
}
