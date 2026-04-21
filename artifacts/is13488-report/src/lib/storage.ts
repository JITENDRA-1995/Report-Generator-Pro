import type { ReportData, Preset, StandardSpec } from "./types";
import { v4 } from "./uuid";

const REPORTS_KEY = "is13488_reports_v1";
const PRESETS_KEY = "is13488_presets_v3";
const SPECS_KEY = "is13488_specs_v1";

export const defaultPresets: Preset[] = [];

export const defaultSpecs: StandardSpec[] = [];

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
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
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
    name: "",
    size: "",
    className: "",
    category: "B, Unregulated",
    discharge: 0,
    minFlowPath: { value: 0, min: 0, max: 0 },
    specimenLength: 0,
    appliedLoad: 0,
    insideDiameter: { value: 0, min: 0, max: 0 },
    wallThickness: { value: 0, min: 0, max: 0 },
    declaredDischargePerPressure: [
      { pressure: 0, discharge: 0, min: 0, max: 0 },
    ],
    spacings: [{ id: v4(), value: 0, min: 0, max: 0 }],
  };
}

// ----- Standard Specs -----
export function getSpecs(): StandardSpec[] {
  try {
    const raw = localStorage.getItem(SPECS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
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
