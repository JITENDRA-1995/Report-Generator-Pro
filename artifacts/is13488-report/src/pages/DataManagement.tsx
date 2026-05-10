import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Trash2, Copy, Pencil, Save, X, Star, Download, RotateCcw, Upload } from "lucide-react";
import {
  getPresets,
  upsertPreset,
  deletePreset,
  importPresets,
  blankPreset,
  getSpecs,
  upsertSpec,
  deleteSpec,
  importSpecs,
  getCustomHeaders,
  saveCustomHeader,
  removeCustomHeader,
  getDefaultPresetId,
  setDefaultPresetId,
  resetToDefaults,
} from "@/lib/storage";
import { v4 } from "@/lib/uuid";
import type { Preset, StandardSpec, StandardHeaderCustomization } from "@/lib/types";

export default function DataManagement() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="presets">
          <TabsList>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="specs">Standard Specifications</TabsTrigger>
            <TabsTrigger value="headers">Custom Headers</TabsTrigger>
          </TabsList>
          <TabsContent value="presets">
            <PresetsTab />
          </TabsContent>
          <TabsContent value="specs">
            <SpecsTab />
          </TabsContent>
          <TabsContent value="headers">
            <HeadersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ----- shared input that treats 0 as empty -----
function NumInput({
  value,
  onChange,
  placeholder,
  step = "any",
  precision = 2,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  step?: string;
  precision?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState<string>(
    value === 0 || Number.isNaN(value) ? "" : String(value)
  );

  // Sync internal state when external value changes (e.g. on load or clear)
  useEffect(() => {
    const valStr = value === 0 || Number.isNaN(value) ? "" : String(value);
    if (parseFloat(displayValue || "0") !== value) {
      setDisplayValue(valStr);
    }
  }, [value]);

  const handleBlur = () => {
    let current = displayValue;
    if (current === "." || current === "") {
      if (current === "") {
        onChange(0);
      }
      return;
    }

    if (current.startsWith(".")) {
      current = "0" + current;
    }

    const parsed = parseFloat(current);
    if (!isNaN(parsed)) {
      // Always format to requested precision
      const formatted = parsed.toFixed(precision);
      setDisplayValue(formatted);
      onChange(parsed);
    }
  };

  return (
    <Input
      type="text" // Using text to allow custom formatting control
      placeholder={placeholder}
      className={className}
      value={displayValue}
      onBlur={handleBlur}
      onChange={(e) => {
        let v = e.target.value;
        // Allow only numbers and one decimal point
        v = v.replace(/[^0-9.]/g, "");
        const parts = v.split(".");
        if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");

        setDisplayValue(v);
        onChange(v === "" || v === "." ? 0 : parseFloat(v) || 0);
      }}
    />
  );
}

// ===================== PRESETS =====================
function PresetsTab() {
  const [presets, setPresets] = useState<Preset[]>(getPresets());
  const [editing, setEditing] = useState<Preset | null>(null);
  const [confirmDel, setConfirmDel] = useState<Preset | null>(null);
  const [defaultId, setDefaultId] = useState<string>(getDefaultPresetId());

  const refresh = () => setPresets(getPresets());

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all presets and specifications to their factory defaults? Your custom changes will be lost.")) {
      resetToDefaults();
      refresh();
      setDefaultId(getDefaultPresetId());
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultPresetId(id);
    setDefaultId(id);
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(presets, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `is13488_presets_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
 
  const handleImportJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (Array.isArray(json)) {
            importPresets(json);
            refresh();
            alert("Presets imported successfully!");
          } else {
            alert("Invalid JSON format. Expected an array of presets.");
          }
        } catch (err) {
          alert("Error parsing JSON file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (editing) {
    return (
      <PresetEditor
        preset={editing}
        onCancel={() => setEditing(null)}
        onSave={(p) => {
          upsertPreset(p);
          refresh();
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Presets ({presets.length})</h2>
          <p className="text-sm text-muted-foreground">
            Each preset bundles all limits & ranges for a specific product configuration.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleReset} className="text-muted-foreground hover:text-destructive">
            <RotateCcw className="w-4 h-4 mr-1" /> Reset to Defaults
          </Button>
          <Button variant="outline" onClick={handleImportJSON}>
            <Upload className="w-4 h-4 mr-1" /> Import JSON
          </Button>
          <Button variant="outline" onClick={handleExportJSON}>
            <Download className="w-4 h-4 mr-1" /> Export JSON
          </Button>
          <Button onClick={() => setEditing(blankPreset())}>
            <Plus className="w-4 h-4 mr-1" /> New Preset
          </Button>
        </div>
      </div>
      {presets.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No presets yet. Create one to get started.</Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {presets.map((p) => (
            <Card key={p.id} className={`p-4 transition-colors ${defaultId === p.id ? "border-amber-400 bg-amber-50/40" : ""}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{p.name || "(unnamed)"}</span>
                    {p.isImported && (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Imported</span>
                    )}
                    {defaultId === p.id && (
                      <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">Default</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {p.size || "—"} · Class {p.className || "—"} · {(p.discharge || 0).toFixed(2)} LPH · {p.category}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Spacings: {p.spacings.map((s) => `${s.value}cm`).join(", ") || "—"}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    title={defaultId === p.id ? "Already default" : "Set as default"}
                    onClick={() => handleSetDefault(p.id)}
                    className={defaultId === p.id ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}
                  >
                    <Star className={`w-4 h-4 ${defaultId === p.id ? "fill-amber-400" : ""}`} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(p)} title="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Duplicate"
                    onClick={() => {
                      const newName = window.prompt("Enter name for the duplicate preset:", p.name ? `${p.name} (copy)` : "");
                      if (!newName) {
                        if (newName === "") alert("Preset name is mandatory.");
                        return;
                      }
                      const dup: Preset = {
                        ...p,
                        id: v4(),
                        name: newName,
                        spacings: p.spacings.map((s) => ({ ...s, id: v4() })),
                      };
                      upsertPreset(dup);
                      refresh();
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setConfirmDel(p)} title="Delete">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete preset?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDel?.name || "(unnamed)"}" will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDel) {
                  deletePreset(confirmDel.id);
                  refresh();
                  setConfirmDel(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ValRangeRow({
  label,
  unit,
  min,
  max,
  precision = 2,
  onChange,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  precision?: number;
  onChange: (min: number, max: number) => void;
}) {
  return (
    <div className="grid md:grid-cols-4 gap-4 items-center">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2 md:col-span-3">
        <NumInput value={min} precision={precision} placeholder="min" onChange={(v) => onChange(v, max)} />
        <span className="text-xs text-muted-foreground">to</span>
        <NumInput value={max} precision={precision} placeholder="max" onChange={(v) => onChange(min, v)} />
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function PresetEditor({
  preset,
  onCancel,
  onSave,
}: {
  preset: Preset;
  onCancel: () => void;
  onSave: (p: Preset) => void;
}) {
  const [p, setP] = useState<Preset>(preset);

  const upd = <K extends keyof Preset>(k: K, v: Preset[K]) => setP(prev => ({ ...prev, [k]: v }));

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{preset.name ? "Edit Preset" : "Create Preset"}</h2>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Basic</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Preset Name</Label>
            <Input value={p.name} placeholder="e.g. 16 mm Class 2.5 - 2 LPH" onChange={(e) => upd("name", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Size</Label>
            <Input value={p.size} placeholder="e.g. 16 mm" onChange={(e) => upd("size", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Class</Label>
            <Input value={p.className} placeholder="e.g. 2.5" onChange={(e) => upd("className", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Input value={p.category} placeholder="e.g. B, Unregulated" onChange={(e) => upd("category", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Discharge (LPH)</Label>
            <NumInput value={p.discharge} placeholder="e.g. 2" onChange={(v) => upd("discharge", v)} />
          </div>
          <div>
            <Label className="text-xs">Specimen Length (mm) — Sr No 7 & 10</Label>
            <NumInput value={p.specimenLength} placeholder="e.g. 150" onChange={(v) => upd("specimenLength", v)} />
          </div>
          <div>
            <Label className="text-xs">Applied Load (KN) — Sr No 8 & 13</Label>
            <NumInput value={p.appliedLoad} placeholder="e.g. 0.06" onChange={(v) => upd("appliedLoad", v)} />
          </div>
          <div>
            <Label className="text-xs">Length Before Test (mm) — Sr No 13</Label>
            <NumInput value={p.lengthBeforeTest ?? 150} placeholder="e.g. 150" onChange={(v) => upd("lengthBeforeTest", v)} />
          </div>
        </div>
      </Card>
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Carbon Content Limits (Sr No 3)</h3>
        <div className="space-y-4">
          <div className="space-y-2 border p-3 rounded bg-slate-50/50">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs font-semibold">Crucible Weights (gm)</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const arr = p.carbonCrucibleWeights || [p.carbonCrucibleWeight];
                  upd("carbonCrucibleWeights", [...arr, { value: 20, min: 19.5, max: 20.5 }]);
                }}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Option
              </Button>
            </div>
            {(p.carbonCrucibleWeights || [p.carbonCrucibleWeight]).map((wt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1">
                  <ValRangeRow
                    label={`Option ${i + 1}`}
                    unit="gm"
                    precision={4}
                    min={wt.min}
                    max={wt.max}
                    onChange={(min, max) => {
                      const arr = [...(p.carbonCrucibleWeights || [p.carbonCrucibleWeight])];
                      arr[i] = { value: (min + max) / 2, min, max };
                      upd("carbonCrucibleWeights", arr);
                      if (i === 0) upd("carbonCrucibleWeight", arr[0]); // fallback
                    }}
                  />
                </div>
                {(p.carbonCrucibleWeights?.length || 1) > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const arr = (p.carbonCrucibleWeights || [p.carbonCrucibleWeight]).filter((_, j) => j !== i);
                      upd("carbonCrucibleWeights", arr);
                      if (i === 0) upd("carbonCrucibleWeight", arr[0]);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <ValRangeRow
            label="Sample Weight (gm)"
            unit="gm"
            precision={4}
            min={p.carbonSampleWeight.min}
            max={p.carbonSampleWeight.max}
            onChange={(min, max) => upd("carbonSampleWeight", { value: (min + max) / 2, min, max })}
          />
          <ValRangeRow
            label="Carbon Percentage (%)"
            unit="%"
            min={p.carbonPercentage.min}
            max={p.carbonPercentage.max}
            onChange={(min, max) => upd("carbonPercentage", { value: (min + max) / 2, min, max })}
          />
        </div>
      </Card>


      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Limits — allowed minimum, allowed maximum</h3>
        <ValRangeRow
          label="Min. Flow Path"
          unit="mm"
          min={p.minFlowPath.min}
          max={p.minFlowPath.max}
          onChange={(min, max) => upd("minFlowPath", { value: min, min, max })}
        />
        <ValRangeRow
          label="Inside Diameter (ID)"
          unit="mm"
          min={p.insideDiameter.min}
          max={p.insideDiameter.max}
          onChange={(min, max) => upd("insideDiameter", { value: min, min, max })}
        />
        <ValRangeRow
          label="Wall Thickness"
          unit="mm"
          min={p.wallThickness.min}
          max={p.wallThickness.max}
          onChange={(min, max) => upd("wallThickness", { value: min, min, max })}
        />
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Declared Discharge per Pressure (LPH)</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              upd("declaredDischargePerPressure", [
                ...p.declaredDischargePerPressure,
                { pressure: 0, discharge: 0, min: 0, max: 0, r3Min: 0, r3Max: 0, r12Min: 0, r12Max: 0, r13Min: 0, r13Max: 0, r23Min: 0, r23Max: 0 },
              ])
            }
          >
            <Plus className="w-4 h-4 mr-1" /> Add Row
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm min-w-[1000px]">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2" rowSpan={2}>Pressure (kg/sq.cm)</th>
                <th className="border p-2" rowSpan={2}>Discharge (LPH)</th>
                <th className="border p-2" colSpan={2}>Allowed (LPH)</th>
                <th className="border p-2" colSpan={2}>#3 (ml)</th>
                <th className="border p-2" colSpan={2}>#12 (ml)</th>
                <th className="border p-2" colSpan={2}>#13 (ml)</th>
                <th className="border p-2" colSpan={2}>#23 (ml)</th>
                <th className="border p-2 w-12" rowSpan={2}></th>
              </tr>
              <tr className="bg-muted text-xs">
                <th className="border p-1">Min</th>
                <th className="border p-1">Max</th>
                <th className="border p-1">Min</th>
                <th className="border p-1">Max</th>
                <th className="border p-1">Min</th>
                <th className="border p-1">Max</th>
                <th className="border p-1">Min</th>
                <th className="border p-1">Max</th>
                <th className="border p-1">Min</th>
                <th className="border p-1">Max</th>
              </tr>
            </thead>
            <tbody>
              {p.declaredDischargePerPressure.map((row, i) => (
                <tr key={i}>
                  <td className="border p-1">
                    <NumInput
                      value={row.pressure}
                      placeholder="pressure"
                      onChange={(v) => {
                        const next = [...p.declaredDischargePerPressure];
                        next[i] = { ...row, pressure: v };
                        upd("declaredDischargePerPressure", next);
                      }}
                    />
                  </td>
                  <td className="border p-1">
                    <NumInput
                      value={row.discharge}
                      placeholder="discharge"
                      onChange={(v) => {
                        const next = [...p.declaredDischargePerPressure];
                        next[i] = { ...row, discharge: v };
                        upd("declaredDischargePerPressure", next);
                      }}
                    />
                  </td>
                  <td className="border p-1">
                    <NumInput
                      value={row.min}
                      placeholder="min"
                      onChange={(v) => {
                        const next = [...p.declaredDischargePerPressure];
                        next[i] = { ...row, min: v };
                        upd("declaredDischargePerPressure", next);
                      }}
                    />
                  </td>
                  <td className="border p-1">
                    <NumInput
                      value={row.max}
                      placeholder="max"
                      onChange={(v) => {
                        const next = [...p.declaredDischargePerPressure];
                        next[i] = { ...row, max: v };
                        upd("declaredDischargePerPressure", next);
                      }}
                    />
                  </td>
                  <td className="border p-1">
                    <NumInput value={row.r3Min ?? 0} placeholder="min" onChange={(v) => {
                      const next = [...p.declaredDischargePerPressure];
                      next[i] = { ...row, r3Min: v };
                      upd("declaredDischargePerPressure", next);
                    }} />
                  </td>
                  <td className="border p-1">
                    <NumInput value={row.r3Max ?? 0} placeholder="max" onChange={(v) => {
                      const next = [...p.declaredDischargePerPressure];
                      next[i] = { ...row, r3Max: v };
                      upd("declaredDischargePerPressure", next);
                    }} />
                  </td>
                  <td className="border p-1">
                    <NumInput value={row.r12Min ?? 0} placeholder="min" onChange={(v) => {
                      const next = [...p.declaredDischargePerPressure];
                      next[i] = { ...row, r12Min: v };
                      upd("declaredDischargePerPressure", next);
                    }} />
                  </td>
                  <td className="border p-1">
                    <NumInput value={row.r12Max ?? 0} placeholder="max" onChange={(v) => {
                      const next = [...p.declaredDischargePerPressure];
                      next[i] = { ...row, r12Max: v };
                      upd("declaredDischargePerPressure", next);
                    }} />
                  </td>
                  <td className="border p-1">
                    <NumInput value={row.r13Min ?? 0} placeholder="min" onChange={(v) => {
                      const next = [...p.declaredDischargePerPressure];
                      next[i] = { ...row, r13Min: v };
                      upd("declaredDischargePerPressure", next);
                    }} />
                  </td>
                  <td className="border p-1">
                    <NumInput value={row.r13Max ?? 0} placeholder="max" onChange={(v) => {
                      const next = [...p.declaredDischargePerPressure];
                      next[i] = { ...row, r13Max: v };
                      upd("declaredDischargePerPressure", next);
                    }} />
                  </td>
                  <td className="border p-1">
                    <NumInput value={row.r23Min ?? 0} placeholder="min" onChange={(v) => {
                      const next = [...p.declaredDischargePerPressure];
                      next[i] = { ...row, r23Min: v };
                      upd("declaredDischargePerPressure", next);
                    }} />
                  </td>
                  <td className="border p-1">
                    <NumInput value={row.r23Max ?? 0} placeholder="max" onChange={(v) => {
                      const next = [...p.declaredDischargePerPressure];
                      next[i] = { ...row, r23Max: v };
                      upd("declaredDischargePerPressure", next);
                    }} />
                  </td>
                  <td className="border p-1 text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        upd(
                          "declaredDischargePerPressure",
                          p.declaredDischargePerPressure.filter((_, j) => j !== i),
                        )
                      }
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Spacing Options (cm)</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => upd("spacings", [...p.spacings, { id: v4(), value: 0, min: 0, max: 0 }])}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Spacing
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          When creating a new report the user will see a dropdown of these spacings.
        </p>
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2">Spacing (cm)</th>
              <th className="border p-2">Allowed Min (cm)</th>
              <th className="border p-2">Allowed Max (cm)</th>
              <th className="border p-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {p.spacings.map((s, i) => (
              <tr key={s.id}>
                <td className="border p-1">
                  <NumInput
                    value={s.value}
                    placeholder="value"
                    onChange={(v) => {
                      const next = [...p.spacings];
                      next[i] = { ...s, value: v };
                      upd("spacings", next);
                    }}
                  />
                </td>
                <td className="border p-1">
                  <NumInput
                    value={s.min}
                    placeholder="min"
                    onChange={(v) => {
                      const next = [...p.spacings];
                      next[i] = { ...s, min: v };
                      upd("spacings", next);
                    }}
                  />
                </td>
                <td className="border p-1">
                  <NumInput
                    value={s.max}
                    placeholder="max"
                    onChange={(v) => {
                      const next = [...p.spacings];
                      next[i] = { ...s, max: v };
                      upd("spacings", next);
                    }}
                  />
                </td>
                <td className="border p-1 text-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => upd("spacings", p.spacings.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── Bottom action bar ── */}
      <div className="sticky bottom-0 z-10 bg-white border-t shadow-md px-4 py-3 flex justify-end gap-2 rounded-b-lg">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
        <Button variant="ghost" onClick={() => setP(preset)}>
          Reset
        </Button>
        <Button onClick={() => onSave(p)}>
          <Save className="w-4 h-4 mr-1" /> Save
        </Button>
      </div>
    </div>
  );
}

// ===================== STANDARD SPECS =====================
function SpecsTab() {
  const [specs, setSpecs] = useState<StandardSpec[]>(getSpecs());

  const refresh = () => setSpecs(getSpecs());

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all presets and specifications to their factory defaults? Your custom changes will be lost.")) {
      resetToDefaults();
      refresh();
    }
  };

  const addRow = () => {
    upsertSpec({
      id: v4(),
      size: "",
      className: "",
      discharge: "",
      insideDiameterMin: 0,
      insideDiameterMax: 0,
      wallThicknessMin: 0,
      wallThicknessMax: 0,
      flowPathMin: 0,
      notes: "",
    });
    refresh();
  };

  const updateRow = (s: StandardSpec) => {
    upsertSpec(s);
    refresh();
  };

  const handleExportSpecsJSON = () => {
    const data = JSON.stringify(specs, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `is13488_specs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
 
  const handleImportSpecsJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (Array.isArray(json)) {
            importSpecs(json);
            refresh();
            alert("Specifications imported successfully!");
          } else {
            alert("Invalid JSON format. Expected an array of specifications.");
          }
        } catch (err) {
          alert("Error parsing JSON file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Standard Specifications</h2>
          <p className="text-sm text-muted-foreground">Size-wise standard specifications used as reference in reports.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleReset} className="text-muted-foreground hover:text-destructive">
            <RotateCcw className="w-4 h-4 mr-1" /> Reset to Defaults
          </Button>
          <Button variant="outline" onClick={handleImportSpecsJSON}>
            <Upload className="w-4 h-4 mr-1" /> Import JSON
          </Button>
          <Button variant="outline" onClick={handleExportSpecsJSON}>
            <Download className="w-4 h-4 mr-1" /> Export JSON
          </Button>
          <Button onClick={addRow}>
            <Plus className="w-4 h-4 mr-1" /> Add Specification
          </Button>
        </div>
      </div>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2">Size</th>
              <th className="border p-2">Class</th>
              <th className="border p-2">Discharge</th>
              <th className="border p-2">ID Min (mm)</th>
              <th className="border p-2">ID Max (mm)</th>
              <th className="border p-2">Wall Min (mm)</th>
              <th className="border p-2">Wall Max (mm)</th>
              <th className="border p-2">Flow Min (mm)</th>
              <th className="border p-2 text-left">Notes</th>
              <th className="border p-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {specs.length === 0 && (
              <tr>
                <td className="border p-4 text-center text-muted-foreground" colSpan={7}>
                  No standard specifications yet.
                </td>
              </tr>
            )}
            {specs.map((s) => (
              <tr key={s.id}>
                <td className="border p-1">
                  <div className="relative">
                    <Input value={s.size} placeholder="e.g. 16 mm" onChange={(e) => updateRow({ ...s, size: e.target.value })} />
                    {s.isImported && (
                      <span className="absolute -top-2 -right-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1 rounded border border-blue-200">IMP</span>
                    )}
                  </div>
                </td>
                <td className="border p-1">
                  <Input value={s.className} placeholder="e.g. Class 2" onChange={(e) => updateRow({ ...s, className: e.target.value })} />
                </td>
                <td className="border p-1">
                  <Input value={s.discharge} placeholder="e.g. 2.0 LPH" onChange={(e) => updateRow({ ...s, discharge: e.target.value })} />
                </td>
                <td className="border p-1">
                  <NumInput value={s.insideDiameterMin} placeholder="min" onChange={(v) => updateRow({ ...s, insideDiameterMin: v })} />
                </td>
                <td className="border p-1">
                  <NumInput value={s.insideDiameterMax} placeholder="max" onChange={(v) => updateRow({ ...s, insideDiameterMax: v })} />
                </td>
                <td className="border p-1">
                  <NumInput value={s.wallThicknessMin} placeholder="min" onChange={(v) => updateRow({ ...s, wallThicknessMin: v })} />
                </td>
                <td className="border p-1">
                  <NumInput value={s.wallThicknessMax} placeholder="max" onChange={(v) => updateRow({ ...s, wallThicknessMax: v })} />
                </td>
                <td className="border p-1">
                  <NumInput value={s.flowPathMin} placeholder="min" onChange={(v) => updateRow({ ...s, flowPathMin: v })} />
                </td>
                <td className="border p-1">
                  <Input value={s.notes} placeholder="notes" onChange={(e) => updateRow({ ...s, notes: e.target.value })} />
                </td>
                <td className="border p-1 text-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      deleteSpec(s.id);
                      refresh();
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ===================== CUSTOM HEADERS =====================
function HeadersTab() {
  const [items, setItems] = useState<StandardHeaderCustomization[]>(getCustomHeaders());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [temp, setTemp] = useState<StandardHeaderCustomization | null>(null);

  const refresh = () => setItems(getCustomHeaders());

  const onAdd = () => {
    const newItem: StandardHeaderCustomization = {
      id: v4(),
      size: "",
      className: "",
      headers: {
        "1": "1. Dimension (CL 6.1 IS - 13488 : 2008)",
        "1_id_clause": "(CL 8.3.2 IS - 13488)",
        "1_id_label": "Inside Diameter in mm",
        "1_wt_clause": "(CL 8.3.1 IS - 13488)",
        "1_wt_label": "Wall Thickness in mm",
        "2": "2. Visual Appearance (CL 6.3 IS - 13488 : 2008) :",
        "3": "3. Carbon Content (CL 5.1.2 IS:13488 : 2008) ( 2.5 ± 0.5%) (Once a week)",
        "4": "4. Carbon Dispersion (CL 5.1.2 IS:13488 : 2008) :",
        "5": "5. Flow path in mm (CL 8.3.3 IS:13488 : 2008) Declared Min. Value - {value} mm",
        "6": "6. Spacing of Emitting Unit : (CL 8.3.4 IS:13488 : 2008 ) ( ±5 % from Declared Value)",
        "7": "7. Environmental Stress Cracking Resistance (Acceptance test) (CL 8.7.1 IS - 13488 : 2008) :",
        "8": "8. Resistance to Pull Out of Joint Between Fitting & Emitting Pipe (CL 8.6 IS - 13488 : 2008) :",
        "9": "9. Uniformity of Emission Rate (Cl 8.1 IS - 13488:2008) (C.V. - Max 10% & Mean Deviation - Max 10%)",
        "10": "10. Environmental Stress Cracking Resistance (Type test) (CL 8.7.1 IS - 13488 : 2008) :",
        "11": "Resistance to Hydraulic Pressure at Ambient Temp. (CL 8.4.1 IS - 13488 : 2008)",
        "12": "Resistance to Hydraulic Pressure at Elevated Temp. (CL 8.4.2 IS - 13488 : 2008)",
        "13": "13. Resistance to Tension at Elevated Temp. (CL 8.5 IS - 13488 : 2008) :",
        "14": "14. Variation of Flow Rate with Pressure (CL 8.2 IS - 13488 : 2008)",
        "15": "15. Determination of Emitting Unit Exponent (CL 8.8 IS - 13488 : 2008) {'m' shall be less than 0.5}",
      },
    };
    setTemp(newItem);
    setEditingId(newItem.id);
  };

  const onEdit = (h: StandardHeaderCustomization) => {
    setTemp({ ...h, headers: { ...h.headers } });
    setEditingId(h.id);
  };

  const onSave = () => {
    if (temp) {
      saveCustomHeader(temp);
      setEditingId(null);
      setTemp(null);
      refresh();
    }
  };

  const srEntries = [
    { key: "1", label: "Sr 1 Main Header" },
    { key: "1_id_clause", label: "Sr 1 ID Clause" },
    { key: "1_id_label", label: "Sr 1 ID Label" },
    { key: "1_wt_clause", label: "Sr 1 Wall Clause" },
    { key: "1_wt_label", label: "Sr 1 Wall Label" },
    { key: "2", label: "Sr 2 Visual" },
    { key: "3", label: "Sr 3 Carbon" },
    { key: "4", label: "Sr 4 Carbon Disp" },
    { key: "5", label: "Sr 5 Flow Path" },
    { key: "6", label: "Sr 6 Spacing" },
    { key: "7", label: "Sr 7 Env Stress" },
    { key: "8", label: "Sr 8 Pull Out" },
    { key: "9", label: "Sr 9 Uniformity" },
    { key: "10", label: "Sr 10 Env Type" },
    { key: "11", label: "Sr 11 Hydraulic Ambient" },
    { key: "12", label: "Sr 12 Hydraulic Elevated" },
    { key: "13", label: "Sr 13 Tension" },
    { key: "14", label: "Sr 14 Pressure Var" },
    { key: "15", label: "Sr 15 Exponent" },
  ];

  return (
    <div className="mt-4 space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Custom Section Headers</h2>
          <p className="text-sm text-muted-foreground">Customize titles for each serial number per Size/Class.</p>
        </div>
        {!editingId && (
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add Customization
          </Button>
        )}
      </div>

      {editingId && temp ? (
        <Card className="p-6 space-y-4 bg-slate-50 border-2 border-primary/20">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Size</Label>
              <Input value={temp.size} onChange={(e) => setTemp({ ...temp, size: e.target.value })} placeholder="e.g. 16 mm" />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Class</Label>
              <Input value={temp.className} onChange={(e) => setTemp({ ...temp, className: e.target.value })} placeholder="e.g. Class 2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {srEntries.map((ent) => (
              <div key={ent.key} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{ent.label}</Label>
                <Input
                  value={temp.headers[ent.key] || ""}
                  onChange={(e) => setTemp({ ...temp, headers: { ...temp.headers, [ent.key]: e.target.value } })}
                  placeholder={`Default text...`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setEditingId(null); setTemp(null); }}>
              Cancel
            </Button>
            <Button onClick={onSave}>
              <Save className="w-4 h-4 mr-1" /> Save Customization
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((h) => (
            <Card key={h.id} className="p-4 flex flex-col justify-between hover:border-primary/50 transition-colors">
              <div>
                <h3 className="font-bold text-lg">{h.size || "Unknown Size"}</h3>
                <p className="text-sm text-muted-foreground mb-2">{h.className || "No Class"}</p>
                <div className="text-xs text-muted-foreground line-clamp-2 italic">
                  {Object.keys(h.headers).length} headers customized
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 border-t pt-3">
                <Button variant="ghost" size="sm" onClick={() => {
                  if (window.confirm("Delete this customization?")) {
                    removeCustomHeader(h.id);
                    refresh();
                  }
                }}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
                <Button size="sm" onClick={() => onEdit(h)}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
              </div>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              No custom headers found. Click "Add Customization" to start.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
