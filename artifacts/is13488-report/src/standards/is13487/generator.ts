import { v4 } from "@/lib/uuid";
import type { ReportData, Preset, BasicInfo } from "@/lib/types";

function randomBetween(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(3));
}

export function emptyReport(preset: Preset, spacingId: string, overrides: Partial<BasicInfo>): ReportData {
  const spacing = preset.spacings.find(s => s.id === spacingId);
  return {
    id: v4(),
    createdAt: new Date().toISOString(),
    presetId: preset.id,
    basicInfo: {
      formatNo: "QC/F/13487",
      dateOfMfg: new Date().toISOString().split('T')[0],
      dateOfTest: new Date().toISOString().split('T')[0],
      size: preset.size,
      discharge: "1.00 KG/CM2",
      batchNo: "BATCH-001",
      className: preset.className,
      spacing: spacing ? String(spacing.value) : "",
      qtyOfProduction: "1000",
      category: preset.category,
      mcNo: "M/C-01",
      specimenLength: String(preset.specimenLength),
      reportType: "Daily",
      cbcPerformed: true,
      ...overrides
    },
    dimensions: [],
    visualAppearance: "Uniform, free from defects.",
    carbonContent: {
      wtOfCrucible: 0,
      wtOfCrucibleSample: 0,
      wtOfCrucibleCarbonAfterHeating: 0
    },
    carbonDispersion: "Satisfactory",
    flowPath: { 
      values: [], 
      declaredMin: preset.minFlowPath?.min || 0, 
      declared: preset.minFlowPath?.value || 0,
      minLimit: preset.minFlowPath?.min || 0,
      declaredLimit: preset.declaredFlowPath?.min || 0.8
    },
    spacing: { values: [], declared: 0 },
    envCracking: { results: ["PASSED"] },
    pullOut: { testDuration: "1 hr", appliedLoad: "0", result: "PASS" },
    uniformity: [],
    envCrackingType: { results: ["PASSED"] },
    hydraulicAmbient: { dischargeBefore: [], dischargeAfter: [] },
    hydraulicElevated: { dischargeBefore: [], dischargeAfter: [] },
    tension: { dischargeBefore: [], dischargeAfter: [], lengthBefore: [], lengthAfter: [], appliedLoad: "0" },
    pressureTest: []
  };
}

export function generateRandomReport(preset: Preset, spacingId: string, overrides: Partial<BasicInfo>, manualValues?: number[]): ReportData {
  const report = emptyReport(preset, spacingId, overrides);
  
  // 1. Flow Path auto-fill between limits
  const fpMin = preset.minFlowPath?.min || 0.6;
  const fpMax = preset.minFlowPath?.max || 1.2;
  const declaredFp = preset.declaredFlowPath?.min || 0.8;
  report.flowPath.minLimit = fpMin;
  report.flowPath.declaredLimit = declaredFp;
  report.flowPath.values = Array.from({ length: 4 }, () => randomBetween(fpMin, fpMax));

  // 2. Hydrostatic Pressure "NO LEAKAGE"
  report.hydraulicAmbient.dischargeBefore = [1]; // 1 = NO LEAKAGE
  
  // 3. Performance & Exponent
  // Emitter exponent m between 0.21 and 0.49
  const targetM = randomBetween(0.35, 0.45);
  
  // Parse base discharge from size (e.g. "4 LPH") if discharge is used for pressure
  let qBase = preset.discharge || 4.0;
  if (qBase < 2) { // Likely Nominal Pressure (1.0)
    const match = preset.size.match(/(\d+(\.\d+)?)/);
    if (match) qBase = parseFloat(match[1]);
  }

  const pressures = preset.declaredDischargePerPressure?.length 
    ? preset.declaredDischargePerPressure.map(p => p.pressure)
    : [0.4, 0.6, 0.8, 1.0, 1.2, 1.4];

  report.pressureTest = pressures.map((p: number, i: number) => {
    let q = qBase * Math.pow(p, targetM);
    if (p === 1.0) q = qBase; // Keep 1.00 KG fixed
    
    // Override with manual values if available (manual values are LPH)
    if (manualValues && manualValues[i] !== undefined) {
      q = manualValues[i];
    }
    
    // Convert LPH to ml (ml = LPH * 50) — assuming 180s collection
    const mlTarget = q * 50;
    
    // Generate 4 readings around mlTarget
    const readings = Array.from({ length: 4 }, () => Number((randomBetween(mlTarget * 0.98, mlTarget * 1.02)).toFixed(1)));

    return {
      pressure: p,
      readings,
      declared: q
    };
  });
  
  report.forcedM = targetM;

  // 4. Uniformity (25 samples)
  // discharge in 180s (ml) = (LPH / 3600) * 180 = LPH / 20
  const mlMean = qBase / 20;
  report.uniformity = Array.from({ length: 25 }, () => {
    const ml = randomBetween(mlMean * 0.95, mlMean * 1.05);
    const lph = (ml / 180) * 3600;
    return {
      emissionRate: Number(lph.toFixed(3)),
      dischargeInSecs: Number(ml.toFixed(2)),
      dischargeLph: Number(lph.toFixed(3))
    };
  });

  return report;
}
