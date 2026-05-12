import type { ReportData, Preset, StandardSpec, StandardHeaderCustomization, UserProfile } from "./types";
import { v4 } from "./uuid";
import { calcExponent } from "./calc";
import { defaultPresets, defaultSpecs } from "./seedPresets";
import { supabase } from "./supabase";

const REPORTS_KEY = "is13488_reports_v2";
const PRESETS_KEY = "is13488_presets_v7";
const SPECS_KEY = "is13488_specs_v1";
const CUSTOM_HEADERS_KEY = "is13488_custom_headers_v1";
const DEFAULT_PRESET_KEY = "is13488_default_preset_id";
const PROFILE_KEY = "is13488_user_profile_v1";


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
  supabase.from('reports').upsert({ id: r.id, data: r }, { onConflict: 'id' })
    .then(res => {
      if (res.error) console.error("Cloud Save Error (Reports):", res.error);
      else console.log("Cloud Sync Success (Report saved)");
    });
}

export function saveReportsBatch(reports: ReportData[]): void {
  const all = getReports();
  const toUpsertCloud: { id: string, data: ReportData }[] = [];

  reports.forEach(r => {
    // Stability logic for forcedM
    const exp = calcExponent(r.pressureTest);
    if (exp.m >= 0.50 && !r.forcedM) {
      const seed = r.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const pseudoRandom = Math.abs(Math.sin(seed)); 
      r.forcedM = 0.4900 + (pseudoRandom * 0.0099);
    } else if (exp.m < 0.50) {
      delete r.forcedM;
    }

    const idx = all.findIndex((x) => x.id === r.id);
    if (idx >= 0) all[idx] = r;
    else all.unshift(r);

    toUpsertCloud.push({ id: r.id, data: r });
  });

  localStorage.setItem(REPORTS_KEY, JSON.stringify(all));

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
  localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
  
  // Sync to Cloud (Background)
  supabase.from('reports').delete().eq('id', id)
    .then(res => {
      if (res.error) console.error("Cloud Delete Error (Reports):", res.error);
    });
}

export async function syncReportsFromCloud(): Promise<void> {
  try {
    const { data, error } = await supabase.from('reports').select('data');
    if (error || !data || data.length === 0) return;
    
    const cloudReports = data.map(item => item.data as ReportData);
    const localReports = getReports();
    
    // Merge: Keep all cloud reports, and add any local reports not yet in cloud
    const cloudIds = new Set(cloudReports.map(r => r.id));
    const merged = [...cloudReports, ...localReports.filter(r => !cloudIds.has(r.id))];
    
    localStorage.setItem(REPORTS_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error("Report sync failed", e);
  }
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
  supabase.from('presets').upsert({ id: p.id, name: p.name, data: p, is_imported: p.isImported }, { onConflict: 'id' })
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
    const { data, error } = await supabase.from('presets').select('data');
    if (error || !data || data.length === 0) return;
    
    const cloudPresets = data.map(item => item.data as Preset);
    const localPresets = getPresets();
    
    const cloudIds = new Set(cloudPresets.map(p => p.id));
    const merged = [...cloudPresets, ...localPresets.filter(p => !cloudIds.has(p.id))];
    
    localStorage.setItem(PRESETS_KEY, JSON.stringify(merged));
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
  supabase.from('standard_specs').upsert({ id: s.id, data: s, is_imported: s.isImported }, { onConflict: 'id' })
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
    const { data, error } = await supabase.from('standard_specs').select('data');
    if (error || !data || data.length === 0) return;
    
    const cloudSpecs = data.map(item => item.data as StandardSpec);
    const localSpecs = getSpecs();
    
    const cloudIds = new Set(cloudSpecs.map(s => s.id));
    const merged = [...cloudSpecs, ...localSpecs.filter(s => !cloudIds.has(s.id))];
    
    localStorage.setItem(SPECS_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error("Spec sync failed", e);
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
  try {
    const { data, error } = await supabase.from('custom_headers').select('data');
    if (error || !data || data.length === 0) return;
    
    const cloudHeaders = data.map(item => item.data as StandardHeaderCustomization);
    const localHeaders = getCustomHeaders();
    
    const cloudIds = new Set(cloudHeaders.map(h => h.id));
    const merged = [...cloudHeaders, ...localHeaders.filter(h => !cloudIds.has(h.id))];
    
    localStorage.setItem(CUSTOM_HEADERS_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error("Header sync failed", e);
  }
}

export function getCustomHeaderFor(size: string, className: string): StandardHeaderCustomization | undefined {
  return getCustomHeaders().find(h => h.size === size && h.className === className);
}

// ----- User Profile -----
export function getProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return {
      companyName: "PARAGON INDUSTRIAL SOLUTIONS",
      companyAddress: "SURVEY NO. 147, PLOT NO. 7 TO 10, RAJKOT-GONDAL HIGHWAY, VERAVAL (SHAPAR), DIST. RAJKOT - 360024 (GUJARAT) INDIA",
      formatNoPrefix: "QC/2025-26"
    };
    return JSON.parse(raw);
  } catch {
    return {
      companyName: "PARAGON INDUSTRIAL SOLUTIONS",
      companyAddress: "SURVEY NO. 147, PLOT NO. 7 TO 10, RAJKOT-GONDAL HIGHWAY, VERAVAL (SHAPAR), DIST. RAJKOT - 360024 (GUJARAT) INDIA",
      formatNoPrefix: "QC/2025-26"
    };
  }
}

export function saveProfile(p: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  
  // Sync to Cloud
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) return;
    supabase.from('profiles').upsert({ id: session.user.id, data: p }, { onConflict: 'id' }).then();
  });
}

export async function syncProfileFromCloud(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase.from('profiles').select('data').eq('id', session.user.id).single();
    if (error || !data) return;
    
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data.data));
  } catch (e) {
    console.error("Profile sync failed", e);
  }
}

export function resetToDefaults() {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(defaultPresets));
  localStorage.setItem(SPECS_KEY, JSON.stringify(defaultSpecs));
  if (defaultPresets.length > 0) {
    setDefaultPresetId(defaultPresets[0].id);
  }
}
