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
      declaredLimit: typeof preset.declaredFlowPath === 'object' ? (preset.declaredFlowPath as any)?.value ?? 0.8 : preset.declaredFlowPath ?? 0.8
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
  const declaredFp = typeof preset.declaredFlowPath === 'object' ? (preset.declaredFlowPath as any)?.value ?? 0.8 : preset.declaredFlowPath ?? 0.8;
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
    const dp = preset.declaredDischargePerPressure?.find(d => d.pressure === p);
    
    // 1. Determine the "Declared" LPH for this pressure
    // Priority: Preset's specific discharge > Preset's specific value (legacy) > Average of preset limits > Formula-based value
    let q = dp?.discharge || (dp as any)?.value || (dp?.min && dp?.max ? (dp.min + dp.max) / 2 : qBase * Math.pow(p, targetM));
    
    if (p === 1.0 && !dp?.discharge && !(dp as any)?.value && !(dp?.min && dp?.max)) q = qBase;
    
    // Override with manual values if available
    if (manualValues && manualValues[i] !== undefined) {
      q = manualValues[i];
    }
    
    // 2. Determine target ml for collection time (360s = LPH * 100)
    const mlTarget = q * 100;
    
    // 3. Generate 4 readings respecting sample-specific bounds if available
    const readings = [0, 1, 2, 3].map(readingIdx => {
      let rMin = mlTarget * 0.98;
      let rMax = mlTarget * 1.02;

      if (dp) {
        // Map reading index to sample-specific properties in the preset
        // R1->#3, R2->#12, R3->#13, R4->#23
        const sampleBounds = [
          { min: dp.r3Min, max: dp.r3Max },
          { min: dp.r12Min, max: dp.r12Max },
          { min: dp.r13Min, max: dp.r13Max },
          { min: dp.r23Min, max: dp.r23Max }
        ][readingIdx];

        if (sampleBounds?.min !== undefined && sampleBounds?.max !== undefined) {
          rMin = sampleBounds.min;
          rMax = sampleBounds.max;
        } else if (dp.min !== undefined && dp.max !== undefined) {
          // Fallback to global pressure limits (converted to ml)
          rMin = Math.max(rMin, dp.min * 100);
          rMax = Math.min(rMax, dp.max * 100);
          if (rMin >= rMax) { rMin = dp.min * 100; rMax = dp.max * 100; }
        }
      }

      return Number(randomBetween(rMin, rMax).toFixed(1));
    });

    return {
      pressure: p,
      readings,
      declared: q
    };
  });
  
  report.forcedM = targetM;

  // 4. Uniformity (25 samples)
  // Get limit range for nominal pressure (1.0 kg/cm2 or default)
  const nominalPreset = preset.declaredDischargePerPressure?.find(p => p.pressure === 1.0) || preset.declaredDischargePerPressure?.[0];
  const qMin = nominalPreset?.min || qBase * 0.95;
  const qMax = nominalPreset?.max || qBase * 1.05;

  // Make mean emission rate exactly equal to declared only 10% of the time
  let targetMean = qBase;
  if (Math.random() > 0.10) {
    const offset = qBase * randomBetween(0.01, 0.05); // 1% to 5% offset
    targetMean += Math.random() > 0.5 ? offset : -offset;
  }
  
  // Ensure targetMean is within bounds
  targetMean = Math.max(qMin + 0.01, Math.min(qMax - 0.01, targetMean));
  // Safe spread to avoid generating out-of-bounds values
  const safeSpread = Math.min(targetMean - qMin, qMax - targetMean);

  report.uniformity = Array.from({ length: 25 }, () => {
    const lph = randomBetween(targetMean - safeSpread, targetMean + safeSpread);
    const ml = lph * 50;
    return {
      emissionRate: Number(lph.toFixed(3)),
      dischargeInSecs: Number(ml.toFixed(1)),
      dischargeLph: Number(lph.toFixed(3))
    };
  });

  return report;
}
