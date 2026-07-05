import type { Preset, ReportData } from "@/lib/types";
import { v4 } from "@/lib/uuid";

function generateValueWithVariation(declared: number): number {
  if (declared === 0) return 0;
  
  // 1% chance of exact match
  if (Math.random() < 0.01) {
    return declared;
  }
  
  // Otherwise, random variation magnitude between 1% and 7%
  const magnitude = 0.01 + Math.random() * 0.06;
  const sign = Math.random() < 0.5 ? 1 : -1;
  const variation = magnitude * sign;
  
  let val = Math.round(declared * (1 + variation));
  
  // Force a difference if rounding somehow made it equal
  if (val === declared) {
    val += sign;
  }
  
  return val;
}

function generatePerformance(preset: Preset) {
  const table = preset.is14483Table || [];
  
  let lastSuction = Infinity;
  return table.map(row => {
    const declaredMotive = row.motiveFlow;
    const observedMotive = generateValueWithVariation(declaredMotive);
    const declaredSuction = row.waterSuction;
    
    // Observed suction must be within +-7% (generateValueWithVariation range)
    const minAllowed = Math.ceil(declaredSuction * 0.93);
    const maxAllowed = Math.floor(declaredSuction * 1.07);
    
    // It must also be <= lastSuction (since suction decreases as pressure increases)
    const upperLimit = Math.min(maxAllowed, lastSuction);
    
    let observedSuction: number;
    if (upperLimit >= minAllowed) {
      const val = generateValueWithVariation(declaredSuction);
      if (val >= minAllowed && val <= upperLimit) {
        observedSuction = val;
      } else {
        observedSuction = minAllowed + Math.floor(Math.random() * (upperLimit - minAllowed + 1));
      }
    } else {
      observedSuction = lastSuction;
    }
    
    lastSuction = observedSuction;
    
    return {
      inlet: row.pressure,
      outlet: 0,
      declaredMotive,
      observedMotive,
      declaredSuction,
      observedSuction
    };
  });
}

function generatePressureDrop(preset: Preset) {
  const table = preset.is14483Table || [];
  
  return table.map(row => {
    return {
      inlet: row.pressure,
      declaredDrop: row.pressure,
      actualDrop: row.pressure // Defaults to matching declared exactly, leading to 0 difference.
    };
  });
}

export const is14483Generator = {
  getEmpty(): ReportData {
    return {
      id: v4(),
      createdAt: new Date().toISOString(),
      presetId: "",
      basicInfo: { formatNo: "", dateOfMfg: "", dateOfTest: "", size: "", discharge: "", batchNo: "", className: "", spacing: "", qtyOfProduction: "", category: "", mcNo: "", specimenLength: "", reportType: "Daily", cbcPerformed: false },
      visualAppearance: "Confirmed",
      is14483_hydrostatic: Array(8).fill("Confirmed") as ("Confirmed" | "Failed")[],
      is14483_performanceA: [],
      is14483_performanceB: [],
      is14483_pressureDropA: [],
      is14483_pressureDropB: [],
      dimensions: [],
      carbonContent: { wtOfCrucible: 0, wtOfCrucibleSample: 0, wtOfCrucibleCarbonAfterHeating: 0 },
      carbonDispersion: "",
      flowPath: { values: [], declaredMin: 0, declared: 0 },
      spacing: { values: [], declared: 0 },
      envCracking: { results: [] },
      pullOut: { testDuration: "", appliedLoad: "", result: "PASS" },
      uniformity: [],
      envCrackingType: { results: [] },
      hydraulicAmbient: { dischargeBefore: [], dischargeAfter: [] },
      hydraulicElevated: { dischargeBefore: [], dischargeAfter: [] },
      tension: { dischargeBefore: [], dischargeAfter: [], lengthBefore: [], lengthAfter: [], appliedLoad: "" },
      pressureTest: []
    };
  },
  generateRandom(preset: Preset, spacingId: string, overrides: Partial<ReportData['basicInfo']>, manualDischarge?: number[]): ReportData {
    
    // Performance A & B
    const performanceA = generatePerformance(preset);
    const performanceB = generatePerformance(preset);
    
    // Pressure Drops A & B
    const pressureDropA = generatePressureDrop(preset);
    const pressureDropB = generatePressureDrop(preset);
    
    // Hydrostatic Test (8 samples)
    const hydrostatic = Array(8).fill("Confirmed") as ("Confirmed" | "Failed")[];

    return {
      id: v4(),
      createdAt: new Date().toISOString(),
      presetId: preset.id,
      basicInfo: {
        formatNo: "",
        dateOfMfg: "",
        dateOfTest: "",
        size: preset.size || "",
        discharge: "",
        batchNo: "",
        className: preset.className || "",
        spacing: "",
        qtyOfProduction: "",
        category: preset.category || "",
        mcNo: "",
        specimenLength: "",
        reportType: "Daily",
        cbcPerformed: false,
        ...overrides,
      },
      visualAppearance: "Confirmed",
      is14483_hydrostatic: hydrostatic,
      is14483_performanceA: performanceA,
      is14483_performanceB: performanceB,
      is14483_pressureDropA: pressureDropA,
      is14483_pressureDropB: pressureDropB,
      
      // Stub required standard fields for the type checker
      dimensions: [],
      carbonContent: { wtOfCrucible: 0, wtOfCrucibleSample: 0, wtOfCrucibleCarbonAfterHeating: 0 },
      carbonDispersion: "",
      flowPath: { values: [], declaredMin: 0, declared: 0 },
      spacing: { values: [], declared: 0 },
      envCracking: { results: [] },
      pullOut: { testDuration: "", appliedLoad: "", result: "PASS" },
      uniformity: [],
      envCrackingType: { results: [] },
      hydraulicAmbient: { dischargeBefore: [], dischargeAfter: [] },
      hydraulicElevated: { dischargeBefore: [], dischargeAfter: [] },
      tension: { dischargeBefore: [], dischargeAfter: [], lengthBefore: [], lengthAfter: [], appliedLoad: "" },
      pressureTest: []
    };
  }
};
