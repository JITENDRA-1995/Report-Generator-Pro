import type { ReportData, Preset, StandardSpec } from "./types";
import { v4 } from "./uuid";

const REPORTS_KEY = "is13488_reports_v1";
const PRESETS_KEY = "is13488_presets_v2";
const SPECS_KEY = "is13488_specs_v1";

export const defaultPresets: Preset[] = [
  {
    id: "preset-default-16-2lph",
    name: '16 mm — Class 2.5 — 2 LPH',
    size: "16 mm",
    className: "2.5",
    category: "B, Unregulated",
    discharge: 2,
    minFlowPath: { value: 300, variation: 10 },
    specimenLength: 150,
    appliedLoad: 0.06,
    insideDiameter: { value: 14.0, variation: 5 },
    wallThickness: { value: 1.0, variation: 8 },
    declaredDischargePerPressure: [
      { pressure: 0.5, discharge: 1.4, variation: 10 },
      { pressure: 1.0, discharge: 2.0, variation: 10 },
      { pressure: 1.5, discharge: 2.45, variation: 10 },
      { pressure: 1.8, discharge: 2.7, variation: 10 },
    ],
    spacings: [
      { id: v4(), value: 30, variation: 5 },
      { id: v4(), value: 40, variation: 5 },
      { id: v4(), value: 50, variation: 5 },
    ],
  },
];

export const defaultSpecs: StandardSpec[] = [
  {
    id: "spec-16",
    size: "16 mm",
    insideDiameterMin: 13.8,
    insideDiameterMax: 14.2,
    wallThicknessMin: 0.9,
    wallThicknessMax: 1.1,
    notes: "As per IS 13488:2008 Annexure",
  },
];

// ----- Reports -----
export function getReports(): ReportData[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveReport(r: ReportData): void {
  const all = getReports();
  const idx = all.findIndex((x) => x.id === r.id);
  if (idx >= 0) all[idx] = r;
  else all.unshift(r);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
}

export function deleteReport(id: string): void {
  const all = getReports().filter((r) => r.id !== id);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
}

// ----- Presets -----
export function getPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(defaultPresets));
      return defaultPresets;
    }
    return JSON.parse(raw);
  } catch {
    return defaultPresets;
  }
}

export function savePresets(list: Preset[]): void {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(list));
}

export function upsertPreset(p: Preset): void {
  const all = getPresets();
  const idx = all.findIndex((x) => x.id === p.id);
  if (idx >= 0) all[idx] = p;
  else all.push(p);
  savePresets(all);
}

export function deletePreset(id: string): void {
  savePresets(getPresets().filter((p) => p.id !== id));
}

export function getPreset(id: string): Preset | null {
  return getPresets().find((p) => p.id === id) ?? null;
}

export function blankPreset(): Preset {
  return {
    id: v4(),
    name: "New Preset",
    size: "",
    className: "",
    category: "B, Unregulated",
    discharge: 0,
    minFlowPath: { value: 0, variation: 10 },
    specimenLength: 150,
    appliedLoad: 0,
    insideDiameter: { value: 0, variation: 5 },
    wallThickness: { value: 0, variation: 8 },
    declaredDischargePerPressure: [
      { pressure: 0.5, discharge: 0, variation: 10 },
      { pressure: 1.0, discharge: 0, variation: 10 },
      { pressure: 1.5, discharge: 0, variation: 10 },
      { pressure: 1.8, discharge: 0, variation: 10 },
    ],
    spacings: [{ id: v4(), value: 30, variation: 5 }],
  };
}

// ----- Standard Specs -----
export function getSpecs(): StandardSpec[] {
  try {
    const raw = localStorage.getItem(SPECS_KEY);
    if (!raw) {
      localStorage.setItem(SPECS_KEY, JSON.stringify(defaultSpecs));
      return defaultSpecs;
    }
    return JSON.parse(raw);
  } catch {
    return defaultSpecs;
  }
}

export function saveSpecs(list: StandardSpec[]): void {
  localStorage.setItem(SPECS_KEY, JSON.stringify(list));
}

export function upsertSpec(s: StandardSpec): void {
  const all = getSpecs();
  const idx = all.findIndex((x) => x.id === s.id);
  if (idx >= 0) all[idx] = s;
  else all.push(s);
  saveSpecs(all);
}

export function deleteSpec(id: string): void {
  saveSpecs(getSpecs().filter((s) => s.id !== id));
}
