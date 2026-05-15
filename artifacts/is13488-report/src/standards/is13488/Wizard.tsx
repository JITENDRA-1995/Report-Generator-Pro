import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReportData, Preset } from "@/lib/types";

interface WizardProps {
  data: ReportData;
  setData: (data: ReportData) => void;
  preset: Preset;
}

export function IS13488Wizard({ data, setData, preset }: WizardProps) {
  return (
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
            onValueChange={(v: string) => {
              const sp = preset.spacings.find((s: any) => String(s.value) === v);
              setData({
                ...data,
                basicInfo: { ...b, spacing: v },
                spacing: { ...data.spacing, declared: sp ? sp.value : parseFloat(v) || 0 },
              });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {preset.spacings.map((s: any) => (
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

function NumGrid({ rows, cols, values, set, rowLabels, colLabels }: any) {
  return (
    <table className="w-full border text-sm">
      <thead>
        <tr>
          <th className="border p-1"></th>
          {colLabels.map((c: string) => <th key={c} className="border p-1">{c}</th>)}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set(r, c, parseFloat(e.target.value) || 0)}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DimensionForm({ data, setData }: any) {
  const setId = (r: number, c: number, v: number) => {
    const next = data.dimensions.map((row: any, i: number) =>
      i === r ? { ...row, insideDiameter: row.insideDiameter.map((x: number, j: number) => (j === c ? v : x)) } : row,
    );
    setData({ ...data, dimensions: next });
  };
  const setWt = (r: number, c: number, v: number) => {
    const next = data.dimensions.map((row: any, i: number) =>
      i === r ? { ...row, wallThickness: row.wallThickness.map((x: number, j: number) => (j === c ? v : x)) } : row,
    );
    setData({ ...data, dimensions: next });
  };
  return (
    <Card className="p-6 mt-4 space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Inside Diameter (mm)</h3>
        <NumGrid rows={3} cols={4} rowLabels={["1","2","3"]} colLabels={["I","II","III","IV"]}
          values={data.dimensions.map((d: any) => d.insideDiameter)} set={setId} />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Wall Thickness (mm)</h3>
        <NumGrid rows={3} cols={4} rowLabels={["1","2","3"]} colLabels={["I","II","III","IV"]}
          values={data.dimensions.map((d: any) => d.wallThickness)} set={setWt} />
      </div>
    </Card>
  );
}

function FlowSpacingForm({ data, setData }: any) {
  return (
    <Card className="p-6 mt-4 space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Flow Path (mm) — 5 samples</h3>
        <div className="grid grid-cols-5 gap-2">
          {data.flowPath.values.map((v: number, i: number) => (
            <Input key={i} type="number" step="any" value={v}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
          {data.spacing.values.map((v: number, i: number) => (
            <Input key={i} type="number" step="any" value={v}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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

function UniformityForm({ data, setData }: any) {
  return (
    <Card className="p-6 mt-4">
      <h3 className="font-semibold mb-2">Uniformity of Emission Rate — 25 emitting units (LPH)</h3>
      <div className="grid grid-cols-5 gap-2">
        {data.uniformity.map((u: any, i: number) => (
          <div key={i}>
            <Label className="text-xs">{i + 1}</Label>
            <Input type="number" step="any" value={u.emissionRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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

function HydraulicForm({ data, setData }: any) {
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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

function PressureForm({ data, setData }: any) {
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
          {data.pressureTest.map((row: any, r: number) => (
            <tr key={r}>
              <td className="border p-1">
                <Input type="number" step="any" value={row.pressure}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const next = [...data.pressureTest];
                    next[r] = { ...row, pressure: parseFloat(e.target.value) || 0 };
                    setData({ ...data, pressureTest: next });
                  }} />
              </td>
              {row.readings.map((v: number, c: number) => (
                <td key={c} className="border p-1">
                  <Input type="number" step="any" value={v}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
