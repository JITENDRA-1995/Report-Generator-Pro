import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { getPresets, savePresets, defaultPresets } from "@/lib/storage";
import type { DataManagementPresets, RangeConfig } from "@/lib/types";

type ListKey = "sizes" | "classes" | "categories" | "discharges" | "spacings" | "qtyOfProduction";
type RangeKey = Exclude<keyof DataManagementPresets, ListKey>;

export default function DataManagement() {
  const [, navigate] = useLocation();
  const [p, setP] = useState<DataManagementPresets>(getPresets());
  const [saved, setSaved] = useState(false);

  const updateRange = (key: RangeKey, patch: Partial<RangeConfig>) =>
    setP({ ...p, [key]: { ...p[key], ...patch } });

  const listEditor = (label: string, key: ListKey) => (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">{label}</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setP({ ...p, [key]: [...p[key], ""] })}
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {p[key].map((val, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={val}
              onChange={(e) => {
                const next = [...p[key]];
                next[i] = e.target.value;
                setP({ ...p, [key]: next });
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setP({ ...p, [key]: p[key].filter((_, j) => j !== i) })}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
        {p[key].length === 0 && <div className="text-xs text-muted-foreground">Empty</div>}
      </div>
    </Card>
  );

  const rangeEditor = (label: string, key: RangeKey) => (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">{label}</h3>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Min</Label>
          <Input
            type="number"
            step="any"
            value={p[key].min}
            onChange={(e) => updateRange(key, { min: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label className="text-xs">Max</Label>
          <Input
            type="number"
            step="any"
            value={p[key].max}
            onChange={(e) => updateRange(key, { max: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label className="text-xs">Decimals</Label>
          <Input
            type="number"
            value={p[key].decimals}
            onChange={(e) => updateRange(key, { decimals: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-white px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Home
        </Button>
        <span className="font-semibold">Data Management</span>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("Reset to defaults?")) setP(defaultPresets);
            }}
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              savePresets(p);
              setSaved(true);
              setTimeout(() => setSaved(false), 1500);
            }}
          >
            <Save className="w-4 h-4 mr-1" />
            {saved ? "Saved!" : "Save"}
          </Button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-4">Quick-Pick Lists</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {listEditor("Sizes", "sizes")}
            {listEditor("Classes", "classes")}
            {listEditor("Categories", "categories")}
            {listEditor("Discharges (LPH)", "discharges")}
            {listEditor("Spacings (cm)", "spacings")}
            {listEditor("Qty of Production", "qtyOfProduction")}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Auto-fill Ranges</h2>
          <p className="text-sm text-muted-foreground mb-4">
            When a user chooses "Auto-fill (Random)", values are picked uniformly within these ranges.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {rangeEditor("Inside Diameter (mm)", "insideDiameter")}
            {rangeEditor("Wall Thickness (mm)", "wallThickness")}
            {rangeEditor("Flow Path (mm)", "flowPath")}
            {rangeEditor("Spacing Value (cm)", "spacingValue")}
            {rangeEditor("Emission Rate (LPH)", "emissionRate")}
            {rangeEditor("Hydraulic Discharge (LPH)", "hydraulicDischarge")}
            {rangeEditor("Carbon Wt. Crucible (g)", "carbonWtCrucible")}
            {rangeEditor("Carbon Wt. Sample (g)", "carbonWtSample")}
            {rangeEditor("Carbon Wt. After (g)", "carbonWtAfter")}
          </div>
        </section>
      </div>
    </div>
  );
}
