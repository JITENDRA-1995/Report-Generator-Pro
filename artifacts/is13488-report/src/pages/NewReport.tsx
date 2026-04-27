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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Save, Eye, Wand2, Pencil, Download, Printer } from "lucide-react";
import { getPresets, saveReport, getDefaultPresetId } from "@/lib/storage";
import { generateRandomReport, emptyReport } from "@/lib/random";
import type { BasicInfo, Preset, ReportData } from "@/lib/types";
import { ReportTemplate } from "@/components/ReportTemplate";

type Step = "initial" | "preset" | "mode" | "edit";
type Mode = "auto" | "manual";

const MC_NO_OPTIONS = [
  "FLAT - 1", "FLAT - 2", "FLAT - 3", "FLAT - 4", "FLAT - 5",
  "ROUND - 1", "ROUND - 2", "ROUND - 3", "ROUND - 4",
];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function isoToBatch(iso: string): string {
  return iso.replace(/-/g, "");
}

import { HeaderActions } from "@/components/HeaderActions";

export default function NewReport() {
  const presets = useMemo(() => getPresets(), []);
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("initial");
  const [presetId, setPresetId] = useState<string>(() => {
    const defId = getDefaultPresetId();
    // Use saved default if it exists in presets list, otherwise fall back to first preset
    return (defId && presets.some(p => p.id === defId)) ? defId : (presets[0]?.id ?? "");
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

  // Choose-Preset extra fields
  const [dateOfMfg, setDateOfMfg] = useState<string>(todayIso());
  const [dateOfTest, setDateOfTest] = useState<string>(todayIso());
  const [batchNo, setBatchNo] = useState<string>(isoToBatch(todayIso()));
  const [batchTouched, setBatchTouched] = useState(false);
  const [mcNo, setMcNo] = useState<string>("");
  const [qty, setQty] = useState<number>(0);
  const [reportType, setReportType] = useState<"Daily" | "Weekly">("Daily");
  const [cbcPerformed, setCbcPerformed] = useState<boolean>(false);
  const [isManualDischarge, setIsManualDischarge] = useState<boolean>(false);
  const [manualDischargeText, setManualDischargeText] = useState<string>("");

  const preset = presets.find((p) => p.id === presetId) ?? null;

  useEffect(() => {
    if (preset && !spacingId) setSpacingId(preset.spacings[0]?.id ?? "");
  }, [preset, spacingId]);

  // auto-fill batch from MFG when user hasn't manually edited it
  useEffect(() => {
    if (!batchTouched) setBatchNo(isoToBatch(dateOfMfg));
  }, [dateOfMfg, batchTouched]);

  const overrides: Partial<BasicInfo> = {
    dateOfMfg: isoToDisplay(dateOfMfg),
    dateOfTest: isoToDisplay(dateOfTest),
    batchNo,
    mcNo,
    qtyOfProduction: qty > 0 ? `${qty} Coil X 500 Mtr` : "",
    reportType,
    cbcPerformed,
  };

  useEffect(() => {
    if (step === "edit" && preset) {
      const manualValues = isManualDischarge 
        ? manualDischargeText.split(/[\s,]+/).map(v => parseFloat(v)).filter(v => !isNaN(v))
        : undefined;
      setData(
        mode === "auto"
          ? generateRandomReport(preset, spacingId, overrides, manualValues)
          : emptyReport(preset, spacingId, overrides),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, mode, preset, spacingId]);

  if (presets.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">No presets yet</h2>
            <p className="text-muted-foreground mb-6">
              Create at least one preset in Data Management before starting a new report.
            </p>
            <Button onClick={() => navigate("/data")}>Go to Data Management</Button>
          </Card>
        </div>
      </div>
    );
  }

  const requiredOk =
    presetId && spacingId && dateOfMfg && dateOfTest && batchNo.trim() && mcNo.trim() && qty > 0;

  if (step === "initial") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-2">New Test Report</h2>
          <p className="text-muted-foreground mb-8">Let's start with basic configuration.</p>
          <Card className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-2 block">Report Frequency</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant={reportType === "Daily" ? "default" : "outline"}
                    className="h-16 text-lg"
                    onClick={() => setReportType("Daily")}
                  >
                    Daily
                  </Button>
                  <Button 
                    variant={reportType === "Weekly" ? "default" : "outline"}
                    className="h-16 text-lg"
                    onClick={() => setReportType("Weekly")}
                  >
                    Weekly
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-2 block">CBC Performed? (Carbon Black Content)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant={cbcPerformed ? "default" : "outline"}
                    className="h-16 text-lg"
                    onClick={() => setCbcPerformed(true)}
                  >
                    Yes
                  </Button>
                  <Button 
                    variant={!cbcPerformed ? "default" : "outline"}
                    className="h-16 text-lg"
                    onClick={() => setCbcPerformed(false)}
                  >
                    No
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-2 block">Discharge Generation Mode</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant={!isManualDischarge ? "default" : "outline"}
                    className="h-16 text-lg"
                    onClick={() => setIsManualDischarge(false)}
                  >
                    Automatic (Magic)
                  </Button>
                  <Button 
                    variant={isManualDischarge ? "default" : "outline"}
                    className="h-16 text-lg"
                    onClick={() => setIsManualDischarge(true)}
                  >
                    Manual Paste (Excel)
                  </Button>
                </div>
              </div>

              {isManualDischarge && (
                <div>
                  <Label className="text-base font-semibold mb-2 block">Paste 25 Discharge Values (LPH)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Paste 25 values separated by commas, spaces, or newlines. These will be used for the 1.0 kg nominal pressure table and uniformity calculations.
                  </p>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="e.g. 2.05, 2.01, 1.98..."
                    value={manualDischargeText}
                    onChange={(e) => setManualDischargeText(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Detected values: {manualDischargeText.split(/[\s,]+/).filter(v => v.trim() !== "" && !isNaN(parseFloat(v))).length} / 25
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button className="w-full h-12 text-lg" onClick={() => setStep("preset")}>
                Proceed to Select Preset
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "preset") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <h2 className="text-2xl font-bold mb-1">Choose Preset</h2>
          <p className="text-muted-foreground mb-6">All fields below are required to create a report.</p>
          <Card className="p-6 space-y-5">
            <div>
              <Label>Preset *</Label>
              <Select value={presetId} onValueChange={(v) => { setPresetId(v); setSpacingId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select a preset" /></SelectTrigger>
                <SelectContent>
                  {presets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name || "(unnamed)"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {preset && (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm border rounded-md p-3 bg-muted/30">
                  <div><span className="text-muted-foreground">Size:</span> <strong>{preset.size}</strong></div>
                  <div><span className="text-muted-foreground">Class:</span> <strong>{preset.className}</strong></div>
                  <div><span className="text-muted-foreground">Discharge:</span> <strong>{(preset.discharge || 0).toFixed(2)} LPH</strong></div>
                  <div><span className="text-muted-foreground">Category:</span> <strong>{preset.category}</strong></div>
                </div>
                <div>
                  <Label>Spacing (cm) *</Label>
                  <Select value={spacingId} onValueChange={setSpacingId}>
                    <SelectTrigger><SelectValue placeholder="Select spacing" /></SelectTrigger>
                    <SelectContent>
                      {preset.spacings.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.value.toFixed(2)} cm  ({s.min.toFixed(2)}–{s.max.toFixed(2)} cm)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label>Date of Mfg *</Label>
                <Input
                  type="date"
                  value={dateOfMfg}
                  onChange={(e) => setDateOfMfg(e.target.value)}
                />
              </div>
              <div>
                <Label>Date of Test *</Label>
                <Input
                  type="date"
                  value={dateOfTest}
                  onChange={(e) => setDateOfTest(e.target.value)}
                />
              </div>
              <div>
                <Label>Batch No * <span className="text-xs text-muted-foreground">(auto from Mfg, editable)</span></Label>
                <Input
                  value={batchNo}
                  placeholder="YYYYMMDD"
                  onChange={(e) => { setBatchTouched(true); setBatchNo(e.target.value); }}
                />
              </div>
              <div>
                <Label>M/C No *</Label>
                <Input
                  list="mc-no-options"
                  value={mcNo}
                  placeholder="select or type custom"
                  onChange={(e) => setMcNo(e.target.value)}
                />
                <datalist id="mc-no-options">
                  {MC_NO_OPTIONS.map((o) => <option key={o} value={o} />)}
                </datalist>
              </div>
              <div className="md:col-span-2">
                <Label>Qty of Production *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="1"
                    className="w-32"
                    placeholder="e.g. 5"
                    value={qty === 0 ? "" : qty}
                    onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                  />
                  <span className="text-sm font-medium">Coil X 500 Mtr</span>
                </div>
              </div>
              
              {/* Moved to Step 1 */}
            </div>

            <div className="pt-2 flex justify-end">
              <Button disabled={!requiredOk} onClick={() => setStep("mode")}>
                Continue
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "mode") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => setStep("preset")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Change preset
          </Button>
          <h2 className="text-2xl font-bold mb-1">Fill Method</h2>
          <p className="text-muted-foreground mb-8">How do you want to fill the report data?</p>
          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="p-6 cursor-pointer hover-elevate active-elevate-2"
              onClick={() => {
                setMode("auto");
                const manualValues = isManualDischarge 
                  ? manualDischargeText.split(/[\s,]+/).map(v => parseFloat(v)).filter(v => !isNaN(v))
                  : undefined;
                setData(generateRandomReport(preset!, spacingId, overrides, manualValues));
                setStep("edit");
              }}
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <Wand2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Auto-fill (Magic)</h3>
              <p className="text-sm text-muted-foreground">Random values generated using preset limits.</p>
            </Card>
            <Card
              className="p-6 cursor-pointer hover-elevate active-elevate-2"
              onClick={() => { 
                setMode("manual");
                setData(emptyReport(preset!, spacingId, overrides));
                setStep("edit");
              }}
            >
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <Pencil className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Manual Entry</h3>
              <p className="text-sm text-muted-foreground">Fill in every value yourself.</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !preset) return null;

  if (showPreview) {
    const filename = `${data.basicInfo.mcNo}_${data.basicInfo.batchNo}`.replace(/[\/\\?%*:|"<>]/g, '-');
    
    const handlePrint = () => {
      const oldTitle = document.title;
      document.title = filename;
      window.print();
      document.title = oldTitle;
    };

    const handleExport = async () => {
      if (isExporting) return;
      setIsExporting(true);
      
      // Wait for React to render all pages by passing isExporting=true to ReportTemplate
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        const pages = document.querySelectorAll(".print-area .report-page");
        if (pages.length === 0) throw new Error("No pages found");
        
        // @ts-ignore
        const jsPDFLib = window.jspdf?.jsPDF || window.jsPDF;
        // @ts-ignore
        const html2canvasLib = window.html2canvas;
        
        if (!jsPDFLib || !html2canvasLib) throw new Error("PDF libraries not loaded");
        
        const pdf = new jsPDFLib('p', 'mm', [210, 294.1]);
        
        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvasLib(pages[i], {
            scale: 3,
            useCORS: true,
            backgroundColor: '#ffffff',
            scrollY: 0,
            scrollX: 0,
            logging: false
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          if (i > 0) pdf.addPage([210, 294.1], 'p');
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 294.1);
        }
        
        pdf.save(`${filename}.pdf`);
      } catch (err) {
        console.error("Export failed:", err);
        alert("Failed to generate PDF. Please try again.");
      } finally {
        setIsExporting(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-100/50">
        <HeaderActions>
          <div className="flex items-center gap-2 pr-4 border-r mr-2">
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              Preview
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            <Download className="w-4 h-4 mr-1" />
            {isExporting ? 'Generating...' : 'PDF'}
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              saveReport(data);
              navigate("/saved");
            }}
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </HeaderActions>
        <div className="py-8">
          <ReportTemplate data={data} isExporting={isExporting} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {mode === "auto" ? "Auto-filled Report" : "Manual Entry"} · {preset.name}
            </h2>
            <p className="text-sm text-muted-foreground">Review or edit values, then preview the full report.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep("preset")}>
              Change preset
            </Button>
            {mode === "auto" && (
              <Button variant="outline" onClick={() => setData(generateRandomReport(preset, spacingId, overrides))}>
                <Wand2 className="w-4 h-4 mr-1" />
                Regenerate
              </Button>
            )}
            <Button onClick={() => setShowPreview(true)}>
              <Eye className="w-4 h-4 mr-1" />
              Preview Report
            </Button>
          </div>
        </div>

        <Tabs defaultValue="basic">
          <TabsList>
            <TabsTrigger value="basic">Basic Details</TabsTrigger>
            <TabsTrigger value="dim">Dimensions</TabsTrigger>
            <TabsTrigger value="flow">Flow & Spacing</TabsTrigger>
            <TabsTrigger value="uniformity">Uniformity</TabsTrigger>
            <TabsTrigger value="hyd">Hydraulic / Tension</TabsTrigger>
            <TabsTrigger value="pres">Pressure</TabsTrigger>
          </TabsList>

          <TabsContent value="basic"><BasicForm data={data} setData={setData} preset={preset} /></TabsContent>
          <TabsContent value="dim"><DimensionForm data={data} setData={setData} /></TabsContent>
          <TabsContent value="flow"><FlowSpacingForm data={data} setData={setData} /></TabsContent>
          <TabsContent value="uniformity"><UniformityForm data={data} setData={setData} /></TabsContent>
          <TabsContent value="hyd"><HydraulicForm data={data} setData={setData} /></TabsContent>
          <TabsContent value="pres"><PressureForm data={data} setData={setData} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}



function field(label: string, child: React.ReactNode) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{child}</div>
    </div>
  );
}

function BasicForm({ data, setData, preset }: { data: ReportData; setData: (r: ReportData) => void; preset: Preset }) {
  const b = data.basicInfo;
  const upd = (k: keyof typeof b, v: string) => setData({ ...data, basicInfo: { ...b, [k]: v } });

  return (
    <Card className="p-6 mt-4">
      <div className="grid md:grid-cols-3 gap-4">
        {field("Format No", <Input value={b.formatNo} onChange={(e) => upd("formatNo", e.target.value)} />)}
        {field("Date of Mfg", <Input value={b.dateOfMfg} onChange={(e) => upd("dateOfMfg", e.target.value)} />)}
        {field("Date of Test", <Input value={b.dateOfTest} onChange={(e) => upd("dateOfTest", e.target.value)} />)}
        {field("Size", <Input value={b.size} onChange={(e) => upd("size", e.target.value)} />)}
        {field("Class", <Input value={b.className} onChange={(e) => upd("className", e.target.value)} />)}
        {field("Discharge", <Input value={b.discharge} onChange={(e) => upd("discharge", e.target.value)} />)}
        {field("Batch No", <Input value={b.batchNo} onChange={(e) => upd("batchNo", e.target.value)} />)}
        {field(
          "Spacing (cm)",
          <Select
            value={b.spacing}
            onValueChange={(v) => {
              const sp = preset.spacings.find((s) => String(s.value) === v);
              setData({
                ...data,
                basicInfo: { ...b, spacing: v },
                spacing: { ...data.spacing, declared: sp ? sp.value : parseFloat(v) || 0 },
              });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {preset.spacings.map((s) => (
                <SelectItem key={s.id} value={String(s.value)}>{s.value} cm</SelectItem>
              ))}
            </SelectContent>
          </Select>,
        )}
        {field("Qty of Production", <Input value={b.qtyOfProduction} onChange={(e) => upd("qtyOfProduction", e.target.value)} />)}
        {field("Category", <Input value={b.category} onChange={(e) => upd("category", e.target.value)} />)}
        {field("M/C No", <Input value={b.mcNo} onChange={(e) => upd("mcNo", e.target.value)} />)}
        {field(
          "Report Frequency",
          <Select
            value={b.reportType}
            onValueChange={(v: "Daily" | "Weekly") => upd("reportType", v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </Card>
  );
}

function NumGrid({
  rows, cols, values, set, rowLabels, colLabels,
}: {
  rows: number; cols: number;
  values: number[][];
  set: (r: number, c: number, v: number) => void;
  rowLabels: string[]; colLabels: string[];
}) {
  return (
    <table className="w-full border text-sm">
      <thead>
        <tr>
          <th className="border p-1"></th>
          {colLabels.map((c) => <th key={c} className="border p-1">{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            <td className="border p-1 font-medium">{rowLabels[r]}</td>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} className="border p-1">
                <Input
                  type="number" step="any" className="h-8"
                  value={values[r]?.[c] ?? 0}
                  onChange={(e) => set(r, c, parseFloat(e.target.value) || 0)}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DimensionForm({ data, setData }: { data: ReportData; setData: (r: ReportData) => void }) {
  const setId = (r: number, c: number, v: number) => {
    const next = data.dimensions.map((row, i) =>
      i === r ? { ...row, insideDiameter: row.insideDiameter.map((x, j) => (j === c ? v : x)) } : row,
    );
    setData({ ...data, dimensions: next });
  };
  const setWt = (r: number, c: number, v: number) => {
    const next = data.dimensions.map((row, i) =>
      i === r ? { ...row, wallThickness: row.wallThickness.map((x, j) => (j === c ? v : x)) } : row,
    );
    setData({ ...data, dimensions: next });
  };
  return (
    <Card className="p-6 mt-4 space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Inside Diameter (mm)</h3>
        <NumGrid rows={3} cols={4} rowLabels={["1","2","3"]} colLabels={["I","II","III","IV"]}
          values={data.dimensions.map((d) => d.insideDiameter)} set={setId} />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Wall Thickness (mm)</h3>
        <NumGrid rows={3} cols={4} rowLabels={["1","2","3"]} colLabels={["I","II","III","IV"]}
          values={data.dimensions.map((d) => d.wallThickness)} set={setWt} />
      </div>
    </Card>
  );
}

function FlowSpacingForm({ data, setData }: { data: ReportData; setData: (r: ReportData) => void }) {
  return (
    <Card className="p-6 mt-4 space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Flow Path (mm) — 5 samples</h3>
        <div className="grid grid-cols-5 gap-2">
          {data.flowPath.values.map((v, i) => (
            <Input key={i} type="number" step="any" value={v}
              onChange={(e) => {
                const next = [...data.flowPath.values];
                next[i] = parseFloat(e.target.value) || 0;
                setData({ ...data, flowPath: { ...data.flowPath, values: next } });
              }} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {field("Declared Min (mm)",
            <Input type="number" step="any" value={data.flowPath.declaredMin}
              onChange={(e) => setData({ ...data, flowPath: { ...data.flowPath, declaredMin: parseFloat(e.target.value) || 0 } })} />)}
          {field("Declared (mm)",
            <Input type="number" step="any" value={data.flowPath.declared}
              onChange={(e) => setData({ ...data, flowPath: { ...data.flowPath, declared: parseFloat(e.target.value) || 0 } })} />)}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Spacing of Emitting Unit (cm) — 10 samples</h3>
        <div className="grid grid-cols-5 gap-2">
          {data.spacing.values.map((v, i) => (
            <Input key={i} type="number" step="any" value={v}
              onChange={(e) => {
                const next = [...data.spacing.values];
                next[i] = parseFloat(e.target.value) || 0;
                setData({ ...data, spacing: { ...data.spacing, values: next } });
              }} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function UniformityForm({ data, setData }: { data: ReportData; setData: (r: ReportData) => void }) {
  return (
    <Card className="p-6 mt-4">
      <h3 className="font-semibold mb-2">Uniformity of Emission Rate — 25 emitting units (LPH)</h3>
      <div className="grid grid-cols-5 gap-2">
        {data.uniformity.map((u, i) => (
          <div key={i}>
            <Label className="text-xs">{i + 1}</Label>
            <Input type="number" step="any" value={u.emissionRate}
              onChange={(e) => {
                const next = [...data.uniformity];
                next[i] = { emissionRate: parseFloat(e.target.value) || 0 };
                setData({ ...data, uniformity: next });
              }} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function HydraulicForm({ data, setData }: { data: ReportData; setData: (r: ReportData) => void }) {
  const sectionEditor = (
    label: string,
    section: "hydraulicAmbient" | "hydraulicElevated" | "tension",
    fld: "dischargeBefore" | "dischargeAfter" | "lengthBefore" | "lengthAfter",
  ) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="grid grid-cols-5 gap-2 mt-1">
        {(data[section] as any)[fld].map((v: number, i: number) => (
          <Input key={i} type="number" step="any" value={v}
            onChange={(e) => {
              const arr = [...(data[section] as any)[fld]];
              arr[i] = parseFloat(e.target.value) || 0;
              setData({ ...data, [section]: { ...(data[section] as any), [fld]: arr } });
            }} />
        ))}
      </div>
    </div>
  );
  return (
    <Card className="p-6 mt-4 space-y-6">
      <div className="space-y-3">
        <h3 className="font-semibold">11. Hydraulic Pressure at Ambient Temp.</h3>
        {sectionEditor("Discharge Before (LPH)", "hydraulicAmbient", "dischargeBefore")}
        {sectionEditor("Discharge After (LPH)", "hydraulicAmbient", "dischargeAfter")}
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold">12. Hydraulic Pressure at Elevated Temp.</h3>
        {sectionEditor("Discharge Before (LPH)", "hydraulicElevated", "dischargeBefore")}
        {sectionEditor("Discharge After (LPH)", "hydraulicElevated", "dischargeAfter")}
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold">13. Tension at Elevated Temp.</h3>
        {sectionEditor("Discharge Before (LPH)", "tension", "dischargeBefore")}
        {sectionEditor("Discharge After (LPH)", "tension", "dischargeAfter")}
        {sectionEditor("Length Before (mm)", "tension", "lengthBefore")}
        {sectionEditor("Length After (mm)", "tension", "lengthAfter")}
      </div>
    </Card>
  );
}

function PressureForm({ data, setData }: { data: ReportData; setData: (r: ReportData) => void }) {
  return (
    <Card className="p-6 mt-4">
      <h3 className="font-semibold mb-2">14. Emission Rate vs Inlet Pressure (4 readings each)</h3>
      <table className="w-full border text-sm">
        <thead>
          <tr>
            <th className="border p-1">Pressure (kg/sq.cm)</th>
            <th className="border p-1">Reading 3</th>
            <th className="border p-1">Reading 12</th>
            <th className="border p-1">Reading 13</th>
            <th className="border p-1">Reading 23</th>
          </tr>
        </thead>
        <tbody>
          {data.pressureTest.map((row, r) => (
            <tr key={r}>
              <td className="border p-1">
                <Input type="number" step="any" value={row.pressure}
                  onChange={(e) => {
                    const next = [...data.pressureTest];
                    next[r] = { ...row, pressure: parseFloat(e.target.value) || 0 };
                    setData({ ...data, pressureTest: next });
                  }} />
              </td>
              {row.readings.map((v, c) => (
                <td key={c} className="border p-1">
                  <Input type="number" step="any" value={v}
                    onChange={(e) => {
                      const next = [...data.pressureTest];
                      const readings = [...row.readings];
                      readings[c] = parseFloat(e.target.value) || 0;
                      next[r] = { ...row, readings };
                      setData({ ...data, pressureTest: next });
                    }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
