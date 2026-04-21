import { useState } from "react";
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
import { ArrowLeft, Plus, Trash2, Copy, Pencil, Save, X } from "lucide-react";
import {
  getPresets,
  upsertPreset,
  deletePreset,
  blankPreset,
  getSpecs,
  upsertSpec,
  deleteSpec,
} from "@/lib/storage";
import { v4 } from "@/lib/uuid";
import type { Preset, StandardSpec } from "@/lib/types";

export default function DataManagement() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-white px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Home
        </Button>
        <span className="font-semibold">Data Management</span>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="presets">
          <TabsList>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="specs">Standard Specifications</TabsTrigger>
          </TabsList>
          <TabsContent value="presets">
            <PresetsTab />
          </TabsContent>
          <TabsContent value="specs">
            <SpecsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ===================== PRESETS =====================
function PresetsTab() {
  const [presets, setPresets] = useState<Preset[]>(getPresets());
  const [editing, setEditing] = useState<Preset | null>(null);
  const [confirmDel, setConfirmDel] = useState<Preset | null>(null);

  const refresh = () => setPresets(getPresets());

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
        <Button onClick={() => setEditing(blankPreset())}>
          <Plus className="w-4 h-4 mr-1" /> New Preset
        </Button>
      </div>
      {presets.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No presets yet. Create one to get started.</Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {presets.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {p.size} · Class {p.className} · {p.discharge} LPH · {p.category}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Spacings: {p.spacings.map((s) => `${s.value}cm`).join(", ") || "—"}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(p)} title="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Duplicate"
                    onClick={() => {
                      const dup: Preset = { ...p, id: v4(), name: `${p.name} (copy)`, spacings: p.spacings.map((s) => ({ ...s, id: v4() })) };
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
              "{confirmDel?.name}" will be removed permanently.
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

function NumInput({
  value,
  onChange,
  step = "any",
}: {
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) {
  return (
    <Input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}

function ValVarRow({
  label,
  unit,
  value,
  variation,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  variation: number;
  onChange: (value: number, variation: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 items-end">
      <div className="col-span-1">
        <Label className="text-xs">{label}</Label>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Value ({unit})</Label>
        <NumInput value={value} onChange={(v) => onChange(v, variation)} />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Allowed Variation (%)</Label>
        <NumInput value={variation} onChange={(v) => onChange(value, v)} />
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

  const upd = <K extends keyof Preset>(k: K, v: Preset[K]) => setP({ ...p, [k]: v });

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{preset.name === "New Preset" ? "Create Preset" : "Edit Preset"}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button onClick={() => onSave(p)}>
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Basic</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Preset Name</Label>
            <Input value={p.name} onChange={(e) => upd("name", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Size</Label>
            <Input value={p.size} onChange={(e) => upd("size", e.target.value)} placeholder="e.g. 16 mm" />
          </div>
          <div>
            <Label className="text-xs">Class</Label>
            <Input value={p.className} onChange={(e) => upd("className", e.target.value)} placeholder="e.g. 2.5" />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Input value={p.category} onChange={(e) => upd("category", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Discharge (LPH)</Label>
            <NumInput value={p.discharge} onChange={(v) => upd("discharge", v)} />
          </div>
          <div>
            <Label className="text-xs">Specimen Length (mm) — Sr No 7 & 10</Label>
            <NumInput value={p.specimenLength} onChange={(v) => upd("specimenLength", v)} />
          </div>
          <div>
            <Label className="text-xs">Applied Load (KN) — Sr No 8 & 13</Label>
            <NumInput value={p.appliedLoad} onChange={(v) => upd("appliedLoad", v)} />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Limits & Variations</h3>
        <ValVarRow
          label="Min. Flow Path"
          unit="mm"
          value={p.minFlowPath.value}
          variation={p.minFlowPath.variation}
          onChange={(value, variation) => upd("minFlowPath", { value, variation })}
        />
        <ValVarRow
          label="Inside Diameter (ID)"
          unit="mm"
          value={p.insideDiameter.value}
          variation={p.insideDiameter.variation}
          onChange={(value, variation) => upd("insideDiameter", { value, variation })}
        />
        <ValVarRow
          label="Wall Thickness"
          unit="mm"
          value={p.wallThickness.value}
          variation={p.wallThickness.variation}
          onChange={(value, variation) => upd("wallThickness", { value, variation })}
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
                { pressure: 0, discharge: 0, variation: 10 },
              ])
            }
          >
            <Plus className="w-4 h-4 mr-1" /> Add Row
          </Button>
        </div>
        <table className="w-full border text-sm">
          <thead>
            <tr>
              <th className="border p-2">Pressure (kg/sq.cm)</th>
              <th className="border p-2">Discharge (LPH)</th>
              <th className="border p-2">Allowed Variation (%)</th>
              <th className="border p-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {p.declaredDischargePerPressure.map((row, i) => (
              <tr key={i}>
                <td className="border p-1">
                  <NumInput
                    value={row.pressure}
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
                    onChange={(v) => {
                      const next = [...p.declaredDischargePerPressure];
                      next[i] = { ...row, discharge: v };
                      upd("declaredDischargePerPressure", next);
                    }}
                  />
                </td>
                <td className="border p-1">
                  <NumInput
                    value={row.variation}
                    onChange={(v) => {
                      const next = [...p.declaredDischargePerPressure];
                      next[i] = { ...row, variation: v };
                      upd("declaredDischargePerPressure", next);
                    }}
                  />
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
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Spacing Options (cm)</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => upd("spacings", [...p.spacings, { id: v4(), value: 30, variation: 5 }])}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Spacing
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          When creating a new report, the user will see a dropdown of these spacings.
        </p>
        <table className="w-full border text-sm">
          <thead>
            <tr>
              <th className="border p-2">Spacing (cm)</th>
              <th className="border p-2">Allowed Variation (%)</th>
              <th className="border p-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {p.spacings.map((s, i) => (
              <tr key={s.id}>
                <td className="border p-1">
                  <NumInput
                    value={s.value}
                    onChange={(v) => {
                      const next = [...p.spacings];
                      next[i] = { ...s, value: v };
                      upd("spacings", next);
                    }}
                  />
                </td>
                <td className="border p-1">
                  <NumInput
                    value={s.variation}
                    onChange={(v) => {
                      const next = [...p.spacings];
                      next[i] = { ...s, variation: v };
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
    </div>
  );
}

// ===================== STANDARD SPECS =====================
function SpecsTab() {
  const [specs, setSpecs] = useState<StandardSpec[]>(getSpecs());

  const refresh = () => setSpecs(getSpecs());

  const addRow = () => {
    upsertSpec({
      id: v4(),
      size: "",
      insideDiameterMin: 0,
      insideDiameterMax: 0,
      wallThicknessMin: 0,
      wallThicknessMax: 0,
      notes: "",
    });
    refresh();
  };

  const updateRow = (s: StandardSpec) => {
    upsertSpec(s);
    refresh();
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Standard Specifications</h2>
          <p className="text-sm text-muted-foreground">Size-wise standard specifications used as reference in reports.</p>
        </div>
        <Button onClick={addRow}>
          <Plus className="w-4 h-4 mr-1" /> Add Specification
        </Button>
      </div>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 text-left">Size</th>
              <th className="border p-2">ID Min (mm)</th>
              <th className="border p-2">ID Max (mm)</th>
              <th className="border p-2">Wall Min (mm)</th>
              <th className="border p-2">Wall Max (mm)</th>
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
                  <Input value={s.size} onChange={(e) => updateRow({ ...s, size: e.target.value })} />
                </td>
                <td className="border p-1">
                  <NumInput value={s.insideDiameterMin} onChange={(v) => updateRow({ ...s, insideDiameterMin: v })} />
                </td>
                <td className="border p-1">
                  <NumInput value={s.insideDiameterMax} onChange={(v) => updateRow({ ...s, insideDiameterMax: v })} />
                </td>
                <td className="border p-1">
                  <NumInput value={s.wallThicknessMin} onChange={(v) => updateRow({ ...s, wallThicknessMin: v })} />
                </td>
                <td className="border p-1">
                  <NumInput value={s.wallThicknessMax} onChange={(v) => updateRow({ ...s, wallThicknessMax: v })} />
                </td>
                <td className="border p-1">
                  <Input value={s.notes} onChange={(e) => updateRow({ ...s, notes: e.target.value })} />
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
