import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Activity,
  Eye,
  CheckCircle2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReportData, Preset } from "@/lib/types";

interface WizardProps {
  data: ReportData;
  setData: (data: ReportData) => void;
  preset: Preset;
  onPreview?: () => void;
}

const steps = [
  { id: "basic", title: "Identity", icon: ShieldCheck },
  { id: "performance", title: "Performance (A & B)", icon: Activity },
];

export function IS14483Wizard({ data, setData, preset, onPreview }: WizardProps) {
  const [activeStep, setActiveStep] = useState(0);

  const next = () => setActiveStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setActiveStep(s => Math.max(s - 1, 0));
  const isLastStep = activeStep === steps.length - 1;

  const updateBasicInfo = (key: keyof ReportData["basicInfo"], value: string) => {
    setData({ ...data, basicInfo: { ...data.basicInfo, [key]: value } });
  };

  const updatePerfData = (type: 'A' | 'B', index: number, field: string, value: number) => {
    const key = type === 'A' ? 'is14483_performanceA' : 'is14483_performanceB';
    const arr = [...(data[key] || [])];
    if (arr[index]) {
      arr[index] = { ...arr[index], [field]: value };
      setData({ ...data, [key]: arr });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Progress Bar */}
      <div className="flex justify-between mb-8 relative px-4">
        <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 z-0" />
        <div 
          className="absolute top-5 left-0 h-1 bg-emerald-500 z-0 transition-all duration-500"
          style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeStep;
          const isPast = idx < activeStep;
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm
                  ${isActive ? 'bg-emerald-600 text-white scale-110 shadow-emerald-200 shadow-lg' : 
                    isPast ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border-2 border-slate-100'}`}
              >
                {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs font-semibold mt-2 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Report Identity</h3>
              <Card className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name of the sample</Label>
                    <Input value="Venturi Injector" disabled />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Grade/Variety/Type/Size/Class</Label>
                    <Input value={data.basicInfo.size} onChange={e => updateBasicInfo("size", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Qty of Production</Label>
                    <Input value={data.basicInfo.qtyOfProduction} onChange={e => updateBasicInfo("qtyOfProduction", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Model</Label>
                    <Input value={data.basicInfo.category} onChange={e => updateBasicInfo("category", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Batch No</Label>
                    <Input value={data.basicInfo.batchNo} onChange={e => updateBasicInfo("batchNo", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Visual Appearance (Constructional req.)</Label>
                    <Select value={data.visualAppearance} onValueChange={v => setData({...data, visualAppearance: v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Performance Test (Generated Values)</h3>
              
              <Card className="p-6 space-y-4 overflow-x-auto">
                <h4 className="font-semibold text-emerald-700">Sample 3(A) - Observed Flows</h4>
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-2">Pressure (kg/cm²)</th>
                      <th className="border p-2">Declared Motive Flow</th>
                      <th className="border p-2">Observed Motive Flow</th>
                      <th className="border p-2">Declared Water Suction</th>
                      <th className="border p-2">Observed Water Suction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.is14483_performanceA || []).map((row, i) => (
                      <tr key={i}>
                        <td className="border p-2 text-center font-bold bg-slate-50">{row.inlet}</td>
                        <td className="border p-2 text-center bg-slate-50">{row.declaredMotive}</td>
                        <td className="border p-1"><Input type="number" className="h-8 text-center" value={row.observedMotive} onChange={e => updatePerfData('A', i, 'observedMotive', parseFloat(e.target.value) || 0)} /></td>
                        <td className="border p-2 text-center bg-slate-50">{row.declaredSuction}</td>
                        <td className="border p-1"><Input type="number" className="h-8 text-center" value={row.observedSuction} onChange={e => updatePerfData('A', i, 'observedSuction', parseFloat(e.target.value) || 0)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              
              <Card className="p-6 space-y-4 overflow-x-auto">
                <h4 className="font-semibold text-blue-700">Sample 3(B) - Observed Flows</h4>
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-2">Pressure (kg/cm²)</th>
                      <th className="border p-2">Declared Motive Flow</th>
                      <th className="border p-2">Observed Motive Flow</th>
                      <th className="border p-2">Declared Water Suction</th>
                      <th className="border p-2">Observed Water Suction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.is14483_performanceB || []).map((row, i) => (
                      <tr key={i}>
                        <td className="border p-2 text-center font-bold bg-slate-50">{row.inlet}</td>
                        <td className="border p-2 text-center bg-slate-50">{row.declaredMotive}</td>
                        <td className="border p-1"><Input type="number" className="h-8 text-center" value={row.observedMotive} onChange={e => updatePerfData('B', i, 'observedMotive', parseFloat(e.target.value) || 0)} /></td>
                        <td className="border p-2 text-center bg-slate-50">{row.declaredSuction}</td>
                        <td className="border p-1"><Input type="number" className="h-8 text-center" value={row.observedSuction} onChange={e => updatePerfData('B', i, 'observedSuction', parseFloat(e.target.value) || 0)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-8 pt-6 border-t">
        <Button variant="outline" onClick={prev} disabled={activeStep === 0} className="w-32">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        {isLastStep ? (
          <Button onClick={onPreview} className="w-48 bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-200">
            <Eye className="w-4 h-4 mr-2" /> Preview Report
          </Button>
        ) : (
          <Button onClick={next} className="w-32 bg-slate-800 hover:bg-slate-900">
            Next <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
