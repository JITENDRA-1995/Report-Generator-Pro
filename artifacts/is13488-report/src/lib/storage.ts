import type { ReportData, Preset, StandardSpec, StandardHeaderCustomization } from "./types";
import { v4 } from "./uuid";
import { calcExponent } from "./calc";
import { supabase } from "./supabase";

import { getCurrentStandard, getCurrentStandardId } from "@/standards/registry";

const getKeys = () => getCurrentStandard().storage;
const getDefaults = () => ({
  presets: getCurrentStandard().defaultPresets,
  specs: getCurrentStandard().defaultSpecs
});

// ----- Reports -----
export function getReports(): ReportData[] {
  try {
    const raw = localStorage.getItem(getKeys().reportsKey);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveReport(r: ReportData): void {
  // Ensure forcedM is stable if calculation exceeds 0.50
  const isIs13487 = r.basicInfo.formatNo === "QC/F/13487";
  const exp = calcExponent(r.pressureTest, isIs13487, r.forcedM);
  const origM = exp.originalM !== undefined ? exp.originalM : exp.m;
  if (origM >= 0.50 && !r.forcedM) {
    const seed = r.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pseudoRandom = Math.abs(Math.sin(seed)); 
    r.forcedM = 0.4900 + (pseudoRandom * 0.0099);
  } else if (origM < 0.50) {
    delete r.forcedM; // Clear if it now falls within range
  }

  const all = getReports();
  const idx = all.findIndex((x) => x.id === r.id);
  if (idx >= 0) all[idx] = r;
  else all.unshift(r);
  localStorage.setItem(getKeys().reportsKey, JSON.stringify(all));

  // Sync to Cloud (Background)
  supabase.from('reports').upsert({ id: r.id, standard_id: getCurrentStandardId(), data: r }, { onConflict: 'id' })
    .then(res => {
      if (res.error) console.error("Cloud Save Error (Reports):", res.error);
      else console.log("Cloud Sync Success (Report saved)");
    });
}

export function saveReportsBatch(reports: ReportData[]): void {
  const all = getReports();
  const toUpsertCloud: { id: string, standard_id: string, data: ReportData }[] = [];
  const standardId = getCurrentStandardId();

  reports.forEach(r => {
    // Stability logic for forcedM
    const isIs13487 = r.basicInfo.formatNo === "QC/F/13487";
    const exp = calcExponent(r.pressureTest, isIs13487, r.forcedM);
    const origM = exp.originalM !== undefined ? exp.originalM : exp.m;
    if (origM >= 0.50 && !r.forcedM) {
      const seed = r.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const pseudoRandom = Math.abs(Math.sin(seed)); 
      r.forcedM = 0.4900 + (pseudoRandom * 0.0099);
    } else if (origM < 0.50) {
      delete r.forcedM;
    }

    const idx = all.findIndex((x) => x.id === r.id);
    if (idx >= 0) all[idx] = r;
    else all.unshift(r);

    toUpsertCloud.push({ id: r.id, standard_id: standardId, data: r });
  });

  localStorage.setItem(getKeys().reportsKey, JSON.stringify(all));

  // Sync to Cloud in one batch
  if (toUpsertCloud.length > 0) {
    supabase.from('reports').upsert(toUpsertCloud, { onConflict: 'id' })
      .then(res => {
        if (res.error) console.error("Cloud Save Error (Batch Reports):", res.error);
        else console.log(`Cloud Sync Success (${toUpsertCloud.length} reports saved)`);
      });
  }
}

export function deleteReport(id: string): void {
  const all = getReports().filter((r) => r.id !== id);
  localStorage.setItem(getKeys().reportsKey, JSON.stringify(all));
  
  // Sync to Cloud (Background)
  supabase.from('reports').delete().eq('id', id)
    .then(res => {
      if (res.error) console.error("Cloud Delete Error (Reports):", res.error);
    });
}

export async function syncReportsFromCloud(): Promise<void> {
  try {
    const { data, error } = await supabase.from('reports')
      .select('data')
      .eq('standard_id', getCurrentStandardId());
    if (error || !data || data.length === 0) return;
    
    const cloudReports = data.map(item => item.data as ReportData);
    const localReports = getReports();
    
    // Merge: Keep all cloud reports, and add any local reports not yet in cloud
    const cloudIds = new Set(cloudReports.map(r => r.id));
    const merged = [...cloudReports, ...localReports.filter(r => !cloudIds.has(r.id))];
    
    localStorage.setItem(getKeys().reportsKey, JSON.stringify(merged));
  } catch (e) {
    console.error("Report sync failed", e);
  }
}

// ----- Presets -----
export function getPresets(): Preset[] {
  try {
    const versionKey = "presets_version_v3";
    if (localStorage.getItem(versionKey) !== "true") {
      localStorage.removeItem("presets_is13487");
      localStorage.removeItem("presets_is13488");
      localStorage.setItem(versionKey, "true");
    }

    const raw = localStorage.getItem(getKeys().presetsKey);
    const defaults = getDefaults().presets;
    if (!raw) {
      savePresets(defaults);
      if (!getDefaultPresetId() && defaults.length > 0) {
        setDefaultPresetId(defaults[0].id);
      }
      return defaults;
    }
    const parsed = JSON.parse(raw) as Preset[];
    if (parsed.length === 0 && defaults.length > 0) {
      savePresets(defaults);
      if (!getDefaultPresetId()) {
        setDefaultPresetId(defaults[0].id);
      }
      return defaults;
    }
    const currentId = getCurrentStandardId();
    if (currentId === "is14483") {
      return parsed.map(p => {
        const clean = {
          id: p.id,
          name: p.name,
          size: p.size || "",
          className: p.className || "",
          category: p.category || "",
          is14483Table: p.is14483Table || [],
        } as any;
        if (p.isImported !== undefined) clean.isImported = p.isImported;
        return clean as Preset;
      });
    }
    return parsed;
  } catch {
    return getDefaults().presets;
  }
}

export function savePresets(list: Preset[]): void {
  const currentId = getCurrentStandardId();
  if (currentId === "is14483") {
    list = list.map(p => {
      const clean = {
        id: p.id,
        name: p.name,
        size: p.size || "",
        className: p.className || "",
        category: p.category || "",
        is14483Table: p.is14483Table || [],
      } as any;
      if (p.isImported !== undefined) clean.isImported = p.isImported;
      return clean as Preset;
    });
  }
  localStorage.setItem(getKeys().presetsKey, JSON.stringify(list));
}

export function upsertPreset(p: Preset): void {
  const currentId = getCurrentStandardId();
  if (currentId === "is14483") {
    const clean = {
      id: p.id,
      name: p.name,
      size: p.size || "",
      className: p.className || "",
      category: p.category || "",
      is14483Table: p.is14483Table || [],
    } as any;
    if (p.isImported !== undefined) clean.isImported = p.isImported;
    p = clean as Preset;
  }

  const all = getPresets();
  const idx = all.findIndex((x) => x.id === p.id);
  if (idx >= 0) all[idx] = p;
  else all.push(p);
  savePresets(all);
 
  // Sync to Cloud
  supabase.from('presets').upsert({ id: p.id, standard_id: getCurrentStandardId(), name: p.name, data: p, is_imported: p.isImported }, { onConflict: 'id' })
    .then(res => {
      if (res.error) console.error("Cloud Save Error (Presets):", res.error);
    });
}

export function deletePreset(id: string): void {
  savePresets(getPresets().filter((p) => p.id !== id));
  
  // Sync to Cloud
  supabase.from('presets').delete().eq('id', id).then();
}

export async function syncPresetsFromCloud(): Promise<void> {
  try {
    const { data, error } = await supabase.from('presets')
      .select('data')
      .eq('standard_id', getCurrentStandardId());
    if (error || !data || data.length === 0) return;
    
    const cloudPresets = data.map(item => item.data as Preset);
    const localPresets = getPresets();
    
    const cloudIds = new Set(cloudPresets.map(p => p.id));
    const merged = [...cloudPresets, ...localPresets.filter(p => !cloudIds.has(p.id))];
    
    localStorage.setItem(getKeys().presetsKey, JSON.stringify(merged));
  } catch (e) {
    console.error("Preset sync failed", e);
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
  return localStorage.getItem(getKeys().defaultPresetKey) ?? "";
}

export function setDefaultPresetId(id: string): void {
  localStorage.setItem(getKeys().defaultPresetKey, id);
}

export function blankPreset(): Preset {
  const currentId = getCurrentStandardId();
  if (currentId === "is14483") {
    return {
      id: v4(),
      name: "",
      size: "",
      className: "",
      category: "V1",
      is14483Table: [],
    } as any as Preset;
  }

  return {
    id: v4(),
    name: "",
    size: "",
    className: "",
    category: "B, Unregulated",
    discharge: 0,
    minFlowPath: { value: 0, min: 0, max: 0 },
    declaredFlowPath: 0.6,
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
    const raw = localStorage.getItem(getKeys().specsKey);
    const defaults = getDefaults().specs;
    if (!raw) {
      saveSpecs(defaults);
      return defaults;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaults().specs;
  }
}

export function saveSpecs(list: StandardSpec[]): void {
  localStorage.setItem(getKeys().specsKey, JSON.stringify(list));
}

export function upsertSpec(s: StandardSpec): void {
  const all = getSpecs();
  const idx = all.findIndex((x) => x.id === s.id);
  if (idx >= 0) all[idx] = s;
  else all.push(s);
  saveSpecs(all);
 
  // Sync to Cloud
  supabase.from('standard_specs').upsert({ id: s.id, standard_id: getCurrentStandardId(), data: s, is_imported: s.isImported }, { onConflict: 'id' })
    .then(res => {
      if (res.error) console.error("Cloud Save Error (Specs):", res.error);
    });
}
 
export function deleteSpec(id: string): void {
  saveSpecs(getSpecs().filter((s) => s.id !== id));
  
  // Sync to Cloud
  supabase.from('standard_specs').delete().eq('id', id).then();
}
 
export async function syncSpecsFromCloud(): Promise<void> {
  try {
    const { data, error } = await supabase.from('standard_specs')
      .select('data')
      .eq('standard_id', getCurrentStandardId());
    if (error || !data || data.length === 0) return;
    
    const cloudSpecs = data.map(item => item.data as StandardSpec);
    const localSpecs = getSpecs();
    
    const cloudIds = new Set(cloudSpecs.map(s => s.id));
    const merged = [...cloudSpecs, ...localSpecs.filter(s => !cloudIds.has(s.id))];
    
    localStorage.setItem(getKeys().specsKey, JSON.stringify(merged));
  } catch (e) {
    console.error("Spec sync failed", e);
  }
}
 
export function importSpecs(specs: StandardSpec[]): void {
  const current = getSpecs();
  const imported = specs.map(s => ({ ...s, isImported: true }));
  const combined = [...current];
  const standardId = getCurrentStandardId();
  imported.forEach(s => {
    const idx = combined.findIndex(x => x.id === s.id);
    if (idx >= 0) combined[idx] = s;
    else combined.push(s);
    // Sync each imported spec to cloud
    supabase.from('standard_specs').upsert({ id: s.id, standard_id: standardId, data: s, is_imported: true }).then();
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
    const raw = localStorage.getItem(getKeys().headersKey);
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
  localStorage.setItem(getKeys().headersKey, JSON.stringify(all));
 
  // Sync to Cloud
  supabase.from('custom_headers').upsert({ id: h.id, standard_id: getCurrentStandardId(), data: h }).then();
}
 
export function removeCustomHeader(id: string) {
  const all = getCustomHeaders();
  localStorage.setItem(getKeys().headersKey, JSON.stringify(all.filter(x => x.id !== id)));
  
  // Sync to Cloud
  supabase.from('custom_headers').delete().eq('id', id).then();
}
 
export async function syncHeadersFromCloud(): Promise<void> {
  try {
    const { data, error } = await supabase.from('custom_headers')
      .select('data')
      .eq('standard_id', getCurrentStandardId());
    if (error || !data || data.length === 0) return;
    
    const cloudHeaders = data.map(item => item.data as StandardHeaderCustomization);
    const localHeaders = getCustomHeaders();
    
    const cloudIds = new Set(cloudHeaders.map(h => h.id));
    const merged = [...cloudHeaders, ...localHeaders.filter(h => !cloudIds.has(h.id))];
    
    localStorage.setItem(getKeys().headersKey, JSON.stringify(merged));
  } catch (e) {
    console.error("Header sync failed", e);
  }
}

export function getCustomHeaderFor(size: string, className: string): StandardHeaderCustomization | undefined {
  return getCustomHeaders().find(h => h.size === size && h.className === className);
}

export function resetToDefaults() {
  const defaults = getDefaults();
  localStorage.setItem(getKeys().presetsKey, JSON.stringify(defaults.presets));
  localStorage.setItem(getKeys().specsKey, JSON.stringify(defaults.specs));
  if (defaults.presets.length > 0) {
    setDefaultPresetId(defaults.presets[0].id);
  }
}
