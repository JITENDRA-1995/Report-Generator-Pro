import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Eye, Wand2, Pencil, Download, Printer } from "lucide-react";
import { getPresets, saveReport, saveReportsBatch, getDefaultPresetId } from "@/lib/storage";
import type { BasicInfo, Preset, ReportData } from "@/lib/types";
import { HeaderActions } from "@/components/HeaderActions";
import * as XLSX from "xlsx";
import { getCurrentStandard } from "@/standards/registry";

type Step = "selection" | "initial" | "preset" | "mode" | "edit" | "batch";
type Mode = "auto" | "manual";

const MC_NO_OPTIONS = [
  "FLAT - 1", "FLAT - 2", "FLAT - 3", "FLAT - 4", "FLAT - 5",
  "ROUND - 1", "ROUND - 2", "ROUND - 3", "ROUND - 4",
];

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const ymd = iso.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  const dmyMatch = iso.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  return iso;
}

function isoToBatch(iso: string): string {
  if (!iso) return "";
  const ymdMatch = iso.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}${m.padStart(2, "0")}${d.padStart(2, "0")}`;
  }
  const dmyMatch = iso.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}${m.padStart(2, "0")}${d.padStart(2, "0")}`;
  }
  return iso.replace(/[\/\-.]/g, "");
}

export default function NewReport() {
  const currentStandard = getCurrentStandard();
  const presets = useMemo(() => getPresets(), [currentStandard.id]);
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("selection");
  const [presetId, setPresetId] = useState<string>(() => {
    const defId = getDefaultPresetId();
    return (defId && presets.some((p: Preset) => p.id === defId)) ? defId : (presets[0]?.id ?? "");
  });
  const [spacingId, setSpacingId] = useState<string>("");
  const [mode, setMode] = useState<Mode>("auto");
  const [data, setData] = useState<ReportData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      const reports = JSON.parse(localStorage.getItem("reports") || "[]") as ReportData[];
      const existing = reports.find((r) => r.id === editId);
      if (existing) {
        setData(existing);
        setStep("edit");
        setMode("manual");
        setIsEditing(true);
      }
    }
  }, []);

  const [dateOfMfg, setDateOfMfg] = useState<string>(todayIso());
  const [dateOfTest, setDateOfTest] = useState<string>(todayIso());
  const [batchNo, setBatchNo] = useState<string>(isoToBatch(todayIso()));
  const [batchTouched, setBatchTouched] = useState(false);
  const [mcNo, setMcNo] = useState<string>("");
  const [qty, setQty] = useState<number>(0);
  const [coilLength, setCoilLength] = useState<number>(500);
  const [reportType, setReportType] = useState<"Daily" | "Weekly">("Daily");
  const [cbcPerformed, setCbcPerformed] = useState<boolean>(false);
  const [isManualDischarge, setIsManualDischarge] = useState<boolean>(false);
  const [manualDischargeText, setManualDischargeText] = useState<string>("");

  const preset = presets.find((p: Preset) => p.id === presetId) ?? null;

  useEffect(() => {
    if (preset && preset.spacings && !spacingId) setSpacingId(preset.spacings[0]?.id ?? "");
  }, [preset, spacingId]);

  useEffect(() => {
    if (!batchTouched) setBatchNo(isoToBatch(dateOfMfg));
  }, [dateOfMfg, batchTouched]);

  const isEmitterBase = currentStandard.id === "is13487" || currentStandard.id === "is14483";

  const overrides: Partial<BasicInfo> = {
    dateOfMfg: isoToDisplay(dateOfMfg),
    dateOfTest: isoToDisplay(dateOfTest),
    batchNo,
    mcNo,
    qtyOfProduction: qty > 0 ? (isEmitterBase ? `${qty} NOS` : `${qty} Coil X ${coilLength} Mtr`) : "",
    reportType,
    cbcPerformed,
    ...(currentStandard.id === "is13487" ? { discharge: "1.00 KG/CM2" } : {})
  };

  useEffect(() => {
    if (step === "edit" && preset) {
      const manualValues = isManualDischarge 
        ? manualDischargeText.split(/[\s,]+/).map(v => parseFloat(v)).filter(v => !isNaN(v))
        : undefined;
      setData(
        mode === "auto"
          ? currentStandard.generator.generateRandom(preset, spacingId, overrides, manualValues)
          : currentStandard.generator.getEmpty(preset, spacingId, overrides),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, mode, preset, spacingId]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const downloadTemplate = () => {
    const data = isEmitterBase
      ? [{
          "Preset *": presets[0]?.name || "",
          "Date of Mfg *": todayIso(),
          "Date of Test *": todayIso(),
          "Batch No *": isoToBatch(todayIso()),
          "Qty of Production *": "5"
        }]
      : [{
          "Report Frequency": "Daily",
          "CBC Performed? (Carbon Black Content)": "No",
          "Preset *": presets[0]?.name || "",
          "Spacing (cm) *": presets[0]?.spacings?.[0]?.value || "",
          "Date of Mfg *": todayIso(),
          "Date of Test *": todayIso(),
          "Batch No *": isoToBatch(todayIso()),
          "M/C No *": MC_NO_OPTIONS[0],
          "Qty of Production *": "5",
          "Coil Length (Mtr)": "500"
        }];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BatchData");
    XLSX.writeFile(workbook, `${currentStandard.id.toUpperCase()}_Batch_Template.xlsx`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setProcessingProgress(0);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: false });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json(ws) as any[];

        const parseExcelDate = (val: any): string => {
          if (!val) return todayIso();
          if (typeof val === "number") {
            try {
              const d = XLSX.SSF.parse_date_code(val);
              return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
            } catch (e) { return todayIso(); }
          }
          const s = String(val).trim();
          const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
          if (dmy) {
            let [ , d, m, y] = dmy;
            if (y.length === 2) y = "20" + y;
            return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
          const ymd = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
          if (ymd) {
            const [ , y, m, d] = ymd;
            return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
          return s;
        };

        const getNormalizedName = (str: string): string => {
          if (!str) return "";
          let s = str.toLowerCase().replace(/\s+/g, "");
          s = s.replace(/(\d+\.\d+)/g, (match) => String(parseFloat(match)));
          return s.replace(/[-_,,]/g, "");
        };

        const generatedReports: ReportData[] = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const pName = row["Preset *"];
          const normalizedPName = getNormalizedName(pName);
          const targetPreset = presets.find((p: Preset) => getNormalizedName(p.name) === normalizedPName) || presets[0];
          const sVal = parseFloat(row["Spacing (cm) *"]);
          const targetSpacing = (!isEmitterBase && targetPreset?.spacings)
            ? (targetPreset.spacings.find((s: any) => s.value === sVal) || targetPreset.spacings[0])
            : null;
          const mfgDate = parseExcelDate(row["Date of Mfg *"]);
          const testDate = parseExcelDate(row["Date of Test *"]);
          let batchStr = row["Batch No *"];
          if (!batchStr) batchStr = isoToBatch(mfgDate);
          else if (typeof batchStr === "number" || batchStr instanceof Date) batchStr = isoToBatch(parseExcelDate(batchStr));
          else batchStr = String(batchStr).trim();

          const coilLenVal = row["Coil Length (Mtr)"] ? parseInt(row["Coil Length (Mtr)"]) || 500 : 500;
          const batchOverrides: Partial<BasicInfo> = {
            reportType: isEmitterBase ? "Daily" : (row["Report Frequency"] === "Weekly" ? "Weekly" : "Daily"),
            cbcPerformed: isEmitterBase ? false : String(row["CBC Performed? (Carbon Black Content)"]).toLowerCase() === "yes",
            dateOfMfg: isoToDisplay(mfgDate),
            dateOfTest: isoToDisplay(testDate),
            batchNo: batchStr,
            mcNo: isEmitterBase ? "" : String(row["M/C No *"] || ""),
            qtyOfProduction: row["Qty of Production *"] ? (
              isEmitterBase 
                ? `${row["Qty of Production *"]} NOS` 
                : `${row["Qty of Production *"]} Coil X ${coilLenVal} Mtr`
            ) : "",
          };

          const report = currentStandard.generator.generateRandom(targetPreset, targetSpacing?.id || "", batchOverrides);
          generatedReports.push(report);
          setProcessingProgress(Math.round(((i + 1) / rows.length) * 100));
          await new Promise(r => setTimeout(r, rows.length > 20 ? 0 : 50));
        }
        saveReportsBatch(generatedReports);
        navigate("/saved");
      } catch (err) {
        console.error("Batch error:", err);
        alert("Failed to process file.");
      } finally { setIsProcessing(false); }
    };
    reader.readAsBinaryString(file);
  };

  if (step === "selection") {
    return (
      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-3.5rem)] relative overflow-hidden">
        <div className="max-w-4xl w-full relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              {currentStandard.fullName}
            </h1>
            <p className="text-xl text-slate-400">Select your generation workflow</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div 
              className="group relative rounded-2xl border border-slate-900 bg-slate-900/30 p-8 cursor-pointer hover:border-slate-800/80 hover:bg-slate-900/40 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] transition-all duration-300 hover:-translate-y-1 overflow-hidden" 
              onClick={() => {
                if (currentStandard.id === "is13487" || currentStandard.id === "is14483") {
                  setStep("preset");
                } else {
                  setStep("initial");
                }
              }}
            >
              {/* Glowing Border Backplate */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[2px] -z-10" />
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] w-0 bg-emerald-500 group-hover:w-full transition-all duration-500 rounded-t-2xl" />

              <div className="relative z-10">
                <div className="w-16 h-16 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:rotate-3 transition-all duration-300"><Pencil className="w-8 h-8" /></div>
                <h3 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-emerald-400 transition-colors duration-300">Single Report</h3>
                <p className="text-slate-400 leading-relaxed text-sm group-hover:text-slate-300 transition-colors duration-300">Create a single {currentStandard.id.toUpperCase()} test report with full manual control or auto-fill magic.</p>
              </div>
            </div>

            <div 
              className="group relative rounded-2xl border border-slate-900 bg-slate-900/30 p-8 cursor-pointer hover:border-slate-800/80 hover:bg-slate-900/40 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)] transition-all duration-300 hover:-translate-y-1 overflow-hidden" 
              onClick={() => setStep("batch")}
            >
              {/* Glowing Border Backplate */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[2px] -z-10" />
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] w-0 bg-blue-500 group-hover:w-full transition-all duration-500 rounded-t-2xl" />

              <div className="relative z-10">
                <div className="w-16 h-16 bg-blue-500/5 border border-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:rotate-3 transition-all duration-300"><Wand2 className="w-8 h-8" /></div>
                <h3 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-blue-400 transition-colors duration-300">Batch Generator</h3>
                <span className="absolute top-4 right-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">PRO</span>
                <p className="text-slate-400 leading-relaxed text-sm group-hover:text-slate-300 transition-colors duration-300">Upload an Excel sheet to generate dozens of reports instantly. Uses high-speed auto-fill logic.</p>
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Button variant="ghost" className="text-slate-400 hover:text-slate-200" onClick={() => navigate("/saved")}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Saved Reports</Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "batch") {
    return (
      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-3.5rem)] relative overflow-hidden">
        <Card className="max-w-2xl w-full p-10 relative bg-slate-900/40 border-slate-800/80">
          <Button variant="ghost" className="absolute top-4 left-4 text-slate-400 hover:text-slate-200" onClick={() => setStep("selection")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <div className="text-center mb-10 mt-4">
            <div className="w-20 h-20 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"><Download className="w-10 h-10" /></div>
            <h2 className="text-3xl font-bold mb-2 text-slate-100">Batch Automation</h2>
            <p className="text-slate-400 text-sm">Follow the steps below to generate reports in bulk.</p>
          </div>
          <div className="space-y-8">
            <div className="flex items-start gap-4 p-4 border border-slate-800 rounded-xl bg-slate-900/20">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <div>
                <h4 className="font-bold mb-1 text-slate-200">Download Template</h4>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">Get the preformatted Excel file with the required headers.</p>
                <Button variant="outline" size="sm" className="border-slate-800 hover:bg-slate-800/50 text-slate-300 hover:text-slate-100" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" /> Download {currentStandard.id.toUpperCase()}_Template.xlsx</Button>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border border-slate-800 rounded-xl bg-slate-900/20">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <div className="flex-1">
                <h4 className="font-bold mb-1 text-slate-200">Upload Data</h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">Fill the data in the template and upload it here.</p>
                <div className="relative group">
                  <input type="file" accept=".xlsx, .xls" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFileUpload} disabled={isProcessing} />
                  <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center group-hover:border-blue-500/50 group-hover:bg-blue-500/5 transition-all">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3"><Save className="w-6 h-6" /></div>
                    <p className="font-medium text-sm text-slate-300">Click to upload or drag & drop</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-xl p-10 text-center">
              <div className="relative w-32 h-32 mb-8">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle className="text-slate-800 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                  <circle className="text-blue-400 stroke-current transition-all duration-300" strokeWidth="8" strokeLinecap="round" fill="transparent" r="40" cx="50" cy="50" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * processingProgress) / 100} transform="rotate(-90 50 50)" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-blue-400">{processingProgress}%</div>
              </div>
              <h3 className="text-2xl font-bold mb-2 animate-pulse text-slate-200">Generating Reports...</h3>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const isMcRequired = !isEmitterBase;
  const isSpacingRequired = !isEmitterBase;
  const requiredOk = presetId && (!isSpacingRequired || spacingId) && dateOfMfg && dateOfTest && batchNo.trim() && (!isMcRequired || mcNo.trim()) && qty > 0 && (isEmitterBase || coilLength > 0);

  if (step === "initial") {
    return (
      <div className="flex items-center justify-center py-12 min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-xl w-full px-6">
          <h2 className="text-3xl font-bold mb-2 text-slate-100">New Test Report</h2>
          <Card className="p-8 space-y-6 bg-slate-900/40 border-slate-800/80">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block text-slate-300">Report Frequency</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant={reportType === "Daily" ? "default" : "outline"} className={`h-16 text-lg font-bold rounded-xl ${reportType === "Daily" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`} onClick={() => setReportType("Daily")}>Daily</Button>
                  <Button variant={reportType === "Weekly" ? "default" : "outline"} className={`h-16 text-lg font-bold rounded-xl ${reportType === "Weekly" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`} onClick={() => setReportType("Weekly")}>Weekly</Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block text-slate-300">CBC Performed?</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant={cbcPerformed ? "default" : "outline"} className={`h-16 text-lg font-bold rounded-xl ${cbcPerformed ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`} onClick={() => setCbcPerformed(true)}>Yes</Button>
                  <Button variant={!cbcPerformed ? "default" : "outline"} className={`h-16 text-lg font-bold rounded-xl ${!cbcPerformed ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`} onClick={() => setCbcPerformed(false)}>No</Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block text-slate-300">Generation Mode</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant={!isManualDischarge ? "default" : "outline"} className={`h-16 text-lg font-bold rounded-xl ${!isManualDischarge ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`} onClick={() => setIsManualDischarge(false)}>Automatic</Button>
                  <Button variant={isManualDischarge ? "default" : "outline"} className={`h-16 text-lg font-bold rounded-xl ${isManualDischarge ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`} onClick={() => setIsManualDischarge(true)}>Manual Paste</Button>
                </div>
              </div>
              {isManualDischarge && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-slate-300">Paste Values</Label>
                  <textarea className="flex min-h-[120px] w-full rounded-md border border-slate-800 bg-slate-900/50 text-slate-100 placeholder:text-slate-600 px-3 py-2 text-sm focus:border-emerald-500 outline-none" value={manualDischargeText} onChange={(e) => setManualDischargeText(e.target.value)} />
                </div>
              )}
              {!isEmitterBase && (
                <div className="space-y-3">
                  <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">M/C No.</Label>
                  <Input 
                    className="h-14 bg-slate-900/50 border-slate-800 text-slate-100 focus:border-emerald-500 rounded-xl"
                    placeholder="Enter machine number"
                    value={mcNo}
                    onChange={(e) => setMcNo(e.target.value)}
                  />
                </div>
              )}
            </div>
            <Button className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl" onClick={() => setStep("preset")}>Proceed</Button>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "preset") {
    return (
      <div className="py-12 min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="max-w-3xl w-full px-6">
          <h2 className="text-2xl font-bold mb-2 text-slate-100">Choose Preset</h2>
          <Card className="p-6 space-y-5 bg-slate-900/40 border-slate-800/80">
            <div>
              <Label className="text-slate-300">Preset *</Label>
              <Select value={presetId} onValueChange={(v: string) => { setPresetId(v); setSpacingId(""); }}>
                <SelectTrigger className="bg-slate-900/50 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-900 text-slate-100">{presets.map((p: Preset) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {preset && isSpacingRequired && (
              <div>
                <Label className="text-slate-300">Spacing (cm) *</Label>
                <Select value={spacingId} onValueChange={setSpacingId}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-900 text-slate-100">{preset.spacings.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.value} cm</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div><Label className="text-slate-300">Date of Mfg *</Label><Input type="date" value={dateOfMfg} onChange={(e) => setDateOfMfg(e.target.value)} className="bg-slate-900/50 border-slate-800 text-slate-100" /></div>
              <div><Label className="text-slate-300">Date of Test *</Label><Input type="date" value={dateOfTest} onChange={(e) => setDateOfTest(e.target.value)} className="bg-slate-900/50 border-slate-800 text-slate-100" /></div>
              <div><Label className="text-slate-300">Batch No *</Label><Input value={batchNo} onChange={(e) => { setBatchTouched(true); setBatchNo(e.target.value); }} className="bg-slate-900/50 border-slate-800 text-slate-100" /></div>
              {isEmitterBase ? (
                <div>
                  <Label className="text-slate-300">Qty *</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={qty === 0 ? "" : qty} 
                      onChange={(e) => setQty(parseInt(e.target.value) || 0)} 
                      onWheel={(e) => e.currentTarget.blur()}
                      className="bg-slate-900/50 border-slate-800 text-slate-100"
                    />
                    <span className="text-slate-400">Nos</span>
                  </div>
                </div>
              ) : (
                <>
                  {!isEmitterBase && (
                    <div>
                      <Label className="text-slate-300">M/C No *</Label>
                      <Input list="mc-no-options" value={mcNo} onChange={(e) => setMcNo(e.target.value)} className="bg-slate-900/50 border-slate-800 text-slate-100" />
                      <datalist id="mc-no-options">{MC_NO_OPTIONS.map((o) => <option key={o} value={o} />)}</datalist>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <Label className="text-slate-300">Qty *</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        value={qty === 0 ? "" : qty} 
                        onChange={(e) => setQty(parseInt(e.target.value) || 0)} 
                        placeholder="Quantity"
                        onWheel={(e) => e.currentTarget.blur()}
                        className="bg-slate-900/50 border-slate-800 text-slate-100"
                      />
                      <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">Coil X</span>
                      <Input 
                        type="number" 
                        value={coilLength === 0 ? "" : coilLength} 
                        onChange={(e) => setCoilLength(parseInt(e.target.value) || 0)} 
                        placeholder="Meter selection"
                        className="w-32 text-center bg-slate-900/50 border-slate-800 text-slate-100"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                      <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">Mtr</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="pt-2 flex justify-end"><Button disabled={!requiredOk} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold" onClick={() => setStep("mode")}>Continue</Button></div>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "mode") {
    return (
      <div className="py-12 min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="max-w-3xl w-full px-6">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-400 hover:text-slate-200" onClick={() => setStep("preset")}><ArrowLeft className="w-4 h-4 mr-1" /> Change preset</Button>
          <h2 className="text-2xl font-bold mb-4 text-slate-100">Fill Method</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div 
              className="group relative rounded-2xl border border-slate-900 bg-slate-900/30 p-8 cursor-pointer hover:border-emerald-500/40 hover:bg-slate-900/40 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.1)] transition-all duration-300 hover:-translate-y-1 overflow-hidden" 
              onClick={() => { setMode("auto"); setStep("edit"); }}
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[2px] -z-10" />
              <div className="absolute top-0 left-0 right-0 h-[2px] w-0 bg-emerald-500 group-hover:w-full transition-all duration-500 rounded-t-2xl" />
              <Wand2 className="w-8 h-8 mb-4 text-emerald-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors duration-300">Auto-fill</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">Let the reporting engine generate random, validated data parameters automatically.</p>
            </div>
            
            <div 
              className="group relative rounded-2xl border border-slate-900 bg-slate-900/30 p-8 cursor-pointer hover:border-blue-500/40 hover:bg-slate-900/40 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.1)] transition-all duration-300 hover:-translate-y-1 overflow-hidden" 
              onClick={() => { setMode("manual"); setStep("edit"); }}
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[2px] -z-10" />
              <div className="absolute top-0 left-0 right-0 h-[2px] w-0 bg-blue-500 group-hover:w-full transition-all duration-500 rounded-t-2xl" />
              <Pencil className="w-8 h-8 mb-4 text-blue-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors duration-300">Manual Paste / Edit</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">Manually type or paste raw values directly into the quality worksheets.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !preset) return null;

  if (showPreview) {
    const Template = currentStandard.components.Template;
    return (
      <div className="min-h-screen bg-slate-950">
        <HeaderActions>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200" onClick={() => setShowPreview(false)}><ArrowLeft className="w-4 h-4 mr-1" />Edit</Button>
          <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />Print</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold" onClick={() => { saveReport(data); navigate("/saved"); }}><Save className="w-4 h-4 mr-1" />Save</Button>
        </HeaderActions>
        <div className="py-8"><Template data={data} isExporting={isExporting} /></div>
      </div>
    );
  }

  const StandardWizard = currentStandard.components.Wizard;

  return (
    <div className="py-8 min-h-[calc(100vh-3.5rem)] relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100">{preset.name} · {currentStandard.fullName}</h2>
          <div className="flex gap-2">
            <Button variant="ghost" className="text-slate-400 hover:text-slate-250" onClick={() => setStep("preset")}>Back</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold" onClick={() => setShowPreview(true)}><Eye className="w-4 h-4 mr-1" />Preview</Button>
          </div>
        </div>
        <StandardWizard data={data} setData={(d) => setData(d)} preset={preset} onPreview={() => setShowPreview(true)} />
      </div>
    </div>
  );
}
