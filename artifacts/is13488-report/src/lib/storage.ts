import type { ReportData, DataManagementPresets } from "./types";

const REPORTS_KEY = "is13488_reports_v1";
const PRESETS_KEY = "is13488_presets_v1";

export const defaultPresets: DataManagementPresets = {
  sizes: ['16 mm', '20 mm', '12 mm'],
  classes: ['2.5', '4.0', '6.0'],
  categories: ['B, Unregulated', 'A, Regulated'],
  discharges: ['2 LPH', '4 LPH', '8 LPH'],
  spacings: ['30', '40', '50', '60'],
  qtyOfProduction: ['Coils X 500 Mtr', 'Coils X 400 Mtr'],

  insideDiameter: { min: 13.8, max: 14.2, decimals: 2 },
  wallThickness: { min: 0.95, max: 1.10, decimals: 2 },
  flowPath: { min: 280, max: 320, decimals: 0 },
  spacingValue: { min: 29.5, max: 30.5, decimals: 2 },
  emissionRate: { min: 1.95, max: 2.10, decimals: 2 },
  hydraulicDischarge: { min: 1.95, max: 2.10, decimals: 2 },
  carbonWtCrucible: { min: 18.0, max: 22.0, decimals: 4 },
  carbonWtSample: { min: 0.45, max: 0.55, decimals: 4 },
  carbonWtAfter: { min: 18.4, max: 22.4, decimals: 4 },
  pressureReading: { min: 0, max: 0, decimals: 0 },
};

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

export function getReport(id: string): ReportData | null {
  return getReports().find((r) => r.id === id) ?? null;
}

export function getPresets(): DataManagementPresets {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return defaultPresets;
    return { ...defaultPresets, ...JSON.parse(raw) };
  } catch {
    return defaultPresets;
  }
}

export function savePresets(p: DataManagementPresets): void {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(p));
}
