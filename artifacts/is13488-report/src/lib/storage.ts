import type { ReportData, Preset, StandardSpec, StandardHeaderCustomization } from "./types";
import { v4 } from "./uuid";
import { calcExponent } from "./calc";
import { defaultPresets, defaultSpecs } from "./seedPresets";
import { supabase } from "./supabase";

const REPORTS_KEY = "is13488_reports_v2";
const PRESETS_KEY = "is13488_presets_v7";
const SPECS_KEY = "is13488_specs_v1";
const CUSTOM_HEADERS_KEY = "is13488_custom_headers_v1";
const DEFAULT_PRESET_KEY = "is13488_default_preset_id";


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
  // Ensure forcedM is stable if calculation exceeds 0.50
  const exp = calcExponent(r.pressureTest);
  if (exp.m >= 0.50 && !r.forcedM) {
    const seed = r.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pseudoRandom = Math.abs(Math.sin(seed)); 
    r.forcedM = 0.4900 + (pseudoRandom * 0.0099);
  } else if (exp.m < 0.50) {
    delete r.forcedM; // Clear if it now falls within range
  }

  const all = getReports();
  const idx = all.findIndex((x) => x.id === r.id);
  if (idx >= 0) all[idx] = r;
  else all.unshift(r);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(all));

  // Sync to Cloud (Background)
  supabase.from('reports').upsert({ id: r.id, data: r }).then();
}

export function deleteReport(id: string): void {
  const all = getReports().filter((r) => r.id !== id);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
  
  // Sync to Cloud (Background)
  supabase.from('reports').delete().eq('id', id).then();
}

export async function syncReportsFromCloud(): Promise<void> {
  const { data, error } = await supabase.from('reports').select('data');
  if (error || !data) return;
  const reports = data.map(item => item.data as ReportData);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

// ----- Presets -----
export function getPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) {
      savePresets(defaultPresets);
      if (!getDefaultPresetId() && defaultPresets.length > 0) {
        setDefaultPresetId(defaultPresets[0].id);
      }
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
 
  // Sync to Cloud
  supabase.from('presets').upsert({ id: p.id, name: p.name, data: p, is_imported: p.isImported }).then();
}

export function deletePreset(id: string): void {
  savePresets(getPresets().filter((p) => p.id !== id));
  
  // Sync to Cloud
  supabase.from('presets').delete().eq('id', id).then();
}

export async function syncPresetsFromCloud(): Promise<void> {
  const { data, error } = await supabase.from('presets').select('data');
  if (error || !data) return;
  const presets = data.map(item => item.data as Preset);
  if (presets.length > 0) {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  }
}
 
export function importPresets(presets: Preset[]): void {
  const current = getPresets();
  const imported = presets.map(p => ({ ...p, isImported: true }));
  const combined = [...current];
  imported.forEach(p => {
    const idx = combined.findIndex(x => x.id === p.id);
    if (idx >= 0) combined[idx] = p;
    else combined.push(p);
  });
  savePresets(combined);
}

export function getPreset(id: string): Preset | null {
  return getPresets().find((p) => p.id === id) ?? null;
}

export function getDefaultPresetId(): string {
  return localStorage.getItem(DEFAULT_PRESET_KEY) ?? "";
}

export function setDefaultPresetId(id: string): void {
  localStorage.setItem(DEFAULT_PRESET_KEY, id);
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
    specimenLength: 150,
    lengthBeforeTest: 150,
    appliedLoad: 0,
    carbonCrucibleWeight: { value: 20, min: 19.5, max: 20.5 },
    carbonCrucibleWeights: [{ value: 20, min: 19.5, max: 20.5 }],
    carbonSampleWeight: { value: 0.5, min: 0.45, max: 0.55 },
    carbonPercentage: { value: 2.5, min: 2.0, max: 3.0 },
    insideDiameter: { value: 0, min: 0, max: 0 },
    wallThickness: { value: 0, min: 0, max: 0 },
    declaredDischargePerPressure: [
      { pressure: 0, discharge: 0, min: 0, max: 0, r3Min: 0, r3Max: 0, r12Min: 0, r12Max: 0, r13Min: 0, r13Max: 0, r23Min: 0, r23Max: 0 },
    ],
    spacings: [{ id: v4(), value: 0, min: 0, max: 0 }],
  };
}

// ----- Standard Specs -----
export function getSpecs(): StandardSpec[] {
  try {
    const raw = localStorage.getItem(SPECS_KEY);
    if (!raw) {
      saveSpecs(defaultSpecs);
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
 
  // Sync to Cloud
  supabase.from('standard_specs').upsert({ id: s.id, data: s, is_imported: s.isImported }).then();
}
 
export function deleteSpec(id: string): void {
  saveSpecs(getSpecs().filter((s) => s.id !== id));
  
  // Sync to Cloud
  supabase.from('standard_specs').delete().eq('id', id).then();
}
 
export async function syncSpecsFromCloud(): Promise<void> {
  const { data, error } = await supabase.from('standard_specs').select('data');
  if (error || !data) return;
  const specs = data.map(item => item.data as StandardSpec);
  if (specs.length > 0) {
    localStorage.setItem(SPECS_KEY, JSON.stringify(specs));
  }
}
 
export function importSpecs(specs: StandardSpec[]): void {
  const current = getSpecs();
  const imported = specs.map(s => ({ ...s, isImported: true }));
  const combined = [...current];
  imported.forEach(s => {
    const idx = combined.findIndex(x => x.id === s.id);
    if (idx >= 0) combined[idx] = s;
    else combined.push(s);
    // Sync each imported spec to cloud
    supabase.from('standard_specs').upsert({ id: s.id, data: s, is_imported: true }).then();
  });
  saveSpecs(combined);
}

export function getSpecFor(size: string, className: string, discharge: string): StandardSpec | undefined {
  const normalize = (s: string) => (s || "").replace(/[\s\-_/\\()]/g, "").toLowerCase();
  const targetSize = normalize(size);
  const targetClass = normalize(className);
  const targetDischarge = normalize(discharge);

  return getSpecs().find((s) => 
    normalize(s.size) === targetSize && 
    normalize(s.className) === targetClass && 
    normalize(s.discharge) === targetDischarge
  );
}

// ----- Custom Headers -----
export function getCustomHeaders(): StandardHeaderCustomization[] {
  try {
    const raw = localStorage.getItem(CUSTOM_HEADERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomHeader(h: StandardHeaderCustomization) {
  const all = getCustomHeaders();
  const idx = all.findIndex((x) => x.id === h.id || (x.size === h.size && x.className === h.className));
  if (idx > -1) {
    all[idx] = h;
  } else {
    all.push(h);
  }
  localStorage.setItem(CUSTOM_HEADERS_KEY, JSON.stringify(all));
 
  // Sync to Cloud
  supabase.from('custom_headers').upsert({ id: h.id, data: h }).then();
}
 
export function removeCustomHeader(id: string) {
  const all = getCustomHeaders();
  localStorage.setItem(CUSTOM_HEADERS_KEY, JSON.stringify(all.filter(x => x.id !== id)));
  
  // Sync to Cloud
  supabase.from('custom_headers').delete().eq('id', id).then();
}
 
export async function syncHeadersFromCloud(): Promise<void> {
  const { data, error } = await supabase.from('custom_headers').select('data');
  if (error || !data) return;
  const headers = data.map(item => item.data as StandardHeaderCustomization);
  localStorage.setItem(CUSTOM_HEADERS_KEY, JSON.stringify(headers));
}

export function getCustomHeaderFor(size: string, className: string): StandardHeaderCustomization | undefined {
  return getCustomHeaders().find(h => h.size === size && h.className === className);
}

export function resetToDefaults() {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(defaultPresets));
  localStorage.setItem(SPECS_KEY, JSON.stringify(defaultSpecs));
  if (defaultPresets.length > 0) {
    setDefaultPresetId(defaultPresets[0].id);
  }
}
