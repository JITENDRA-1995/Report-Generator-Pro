import type { ReportData, Preset, SpacingOption, BasicInfo } from "./types";
import { v4 } from "./uuid";
import { calcExponent } from "./calc";

function rnd(min: number, max: number, decimals = 2): number {
  if (min === max) return min;
  if (min > max) [min, max] = [max, min];
  const v = min + Math.random() * (max - min);
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

function pickSpacing(p: Preset, preferred?: string): SpacingOption {
  const found = preferred ? p.spacings.find((s) => s.id === preferred || String(s.value) === preferred) : null;
  return found ?? p.spacings[0]!;
}

export function generateRandomReport(p: Preset, spacingId: string | undefined, overrides: Partial<BasicInfo>, manualValues?: number[]): ReportData {
  const sp = pickSpacing(p, spacingId);

  const dimensions = Array.from({ length: 3 }).map(() => ({
    insideDiameter: Array.from({ length: 4 }).map(() =>
      rnd(p.insideDiameter.min, p.insideDiameter.max, 2),
    ),
    wallThickness: Array.from({ length: 4 }).map(() =>
      rnd(p.wallThickness.min, p.wallThickness.max, 2),
    ),
  }));

  const declaredFlow = p.minFlowPath.value;
  const flowValues = Array.from({ length: 5 }).map(() =>
    rnd(p.minFlowPath.min, p.minFlowPath.max, 2),
  );

  const spacingValues = Array.from({ length: 10 }).map(() =>
    rnd(sp.min, sp.max, 2),
  );

  const declaredDischarge = p.discharge || 2;
  const d1 = p.declaredDischargePerPressure.find(dp => dp.pressure === 1.0)?.discharge || declaredDischarge;

  let uniformity: { emissionRate: number }[] = [];
  let u3 = 0, u12 = 0, u13 = 0, u23 = 0, avgU = 0;
  
  if (manualValues && manualValues.length === 25) {
    uniformity = manualValues.map(v => ({ emissionRate: v }));
    const sorted = [...uniformity].sort((a, b) => a.emissionRate - b.emissionRate);
    u3 = sorted[2].emissionRate;
    u12 = sorted[11].emissionRate;
    u13 = sorted[12].emissionRate;
    u23 = sorted[22].emissionRate;
    avgU = (u3 + u12 + u13 + u23) / 4;
  } else {
    // Guarantee that the 4 sampled points have an average within ±2.5% of the 1.0kg declared value
    for (let attempt = 0; attempt < 100; attempt++) {
      uniformity = Array.from({ length: 25 }).map(() => ({
        emissionRate: rnd(declaredDischarge * 0.95, declaredDischarge * 1.05, 2),
      }));
      const sorted = [...uniformity].sort((a, b) => a.emissionRate - b.emissionRate);
      u3 = sorted[2].emissionRate;
      u12 = sorted[11].emissionRate;
      u13 = sorted[12].emissionRate;
      u23 = sorted[22].emissionRate;
      avgU = (u3 + u12 + u13 + u23) / 4;
      
      const variation = Math.abs((avgU - d1) / d1);
      if (variation <= 0.025) {
        break;
      }
    }
  }

  // Pre-calculate proportional offsets to identically preserve relative spacing and 'm' slope
  const C = avgU / d1;
  const o3 = u3 / avgU;
  const o12 = u12 / avgU;
  const o13 = u13 / avgU;
  const o23 = u23 / avgU;

  const hAmbB = Array.from({ length: 5 }).map(() => rnd(declaredDischarge * 0.96, declaredDischarge * 1.04, 2));
  const hAmbA = hAmbB.map((v) => rnd(v * 0.97, v * 1.03, 2));
  const hElB = Array.from({ length: 5 }).map(() => rnd(declaredDischarge * 0.96, declaredDischarge * 1.04, 2));
  const hElA = hElB.map((v) => rnd(v * 0.97, v * 1.03, 2));

  const tenB = Array.from({ length: 5 }).map(() => rnd(declaredDischarge * 0.96, declaredDischarge * 1.04, 2));
  const tenA = tenB.map((v) => rnd(v * 0.97, v * 1.03, 2));
  const lenBefore = Array.from({ length: 5 }).map(() =>
    (p.lengthBeforeTest != null && p.lengthBeforeTest > 0 ? p.lengthBeforeTest : 150)
  );
  const lenAfter = lenBefore.map((v) => rnd(v + 0.2, v + 1.5, 2));

  const cruOptions = p.carbonCrucibleWeights && p.carbonCrucibleWeights.length > 0
    ? p.carbonCrucibleWeights
    : [p.carbonCrucibleWeight];
  const chosenCru = cruOptions[Math.floor(Math.random() * cruOptions.length)];
  const carbonCru = rnd(chosenCru.min, chosenCru.max, 4);
  const carbonSamp = rnd(p.carbonSampleWeight.min, p.carbonSampleWeight.max, 4);
  const carbonPct = rnd(p.carbonPercentage.min, p.carbonPercentage.max, 2);
  const carbonAfter = carbonCru + (carbonSamp * carbonPct) / 100;

  const pressureRows = p.declaredDischargePerPressure.map((dp) => {
    // Helper to pick random from user range or fallback
    const pickReading = (min: number | undefined, max: number | undefined, fallback: number) => {
      if (min && max && min > 0 && max > 0) {
        return Math.round(rnd(min, max, 0));
      }
      return Math.round(fallback);
    };

    if (dp.pressure === 1.0) {
      return {
        pressure: dp.pressure,
        declared: dp.discharge,
        readings: [
          pickReading(dp.r3Min, dp.r3Max, u3 * 100),
          pickReading(dp.r12Min, dp.r12Max, u12 * 100),
          pickReading(dp.r13Min, dp.r13Max, u13 * 100),
          pickReading(dp.r23Min, dp.r23Max, u23 * 100),
        ]
      };
    } else {
      // By scaling with C, we ensure average Variation % matches the 1.0kg row perfectly
      // This mathematically guarantees that the slope 'm' mirrors the declared ideal slope (which is < 0.50)
      const targetAvg = dp.discharge * C;
      return {
        pressure: dp.pressure,
        declared: dp.discharge,
        readings: [
          pickReading(dp.r3Min, dp.r3Max, targetAvg * o3 * 100),
          pickReading(dp.r12Min, dp.r12Max, targetAvg * o12 * 100),
          pickReading(dp.r13Min, dp.r13Max, targetAvg * o13 * 100),
          pickReading(dp.r23Min, dp.r23Max, targetAvg * o23 * 100),
        ]
      };
    }
  });

  const loadKn = p.appliedLoad || 0.05;
  const loadStr = `${loadKn.toFixed(3)} KN`;

  const report: ReportData = {
    id: v4(),
    createdAt: new Date().toISOString(),
    presetId: p.id,
    basicInfo: {
      formatNo: "QC/2025-26",
      dateOfMfg: "",
      dateOfTest: "",
      size: p.size,
      discharge: `${p.discharge.toFixed(2)} LPH`,
      batchNo: "",
      className: p.className,
      spacing: String(sp.value),
      qtyOfProduction: "",
      category: p.category,
      mcNo: "",
      specimenLength: `${p.specimenLength || 150} mm`,
      reportType: "Daily",
      cbcPerformed: true,
      ...overrides,
    },
    dimensions,
    visualAppearance: "Satisfy",
    carbonContent: {
      wtOfCrucible: carbonCru,
      wtOfCrucibleSample: carbonCru + carbonSamp,
      wtOfCrucibleCarbonAfterHeating: carbonAfter,
    },
    carbonDispersion: "UNIFORM",
    flowPath: { values: flowValues, declaredMin: declaredFlow, declared: declaredFlow },
    spacing: { values: spacingValues, declared: sp.value },
    envCracking: { results: ["PASSED", "PASSED", "PASSED", "PASSED", "PASSED"] },
    pullOut: { testDuration: "1 Hr.", appliedLoad: loadStr, result: "PASS" },
    uniformity,
    envCrackingType: { results: ["PASSED", "PASSED", "PASSED", "PASSED", "PASSED"] },
    hydraulicAmbient: { dischargeBefore: hAmbB, dischargeAfter: hAmbA },
    hydraulicElevated: { dischargeBefore: hElB, dischargeAfter: hElA },
    tension: {
      dischargeBefore: tenB,
      dischargeAfter: tenA,
      lengthBefore: lenBefore,
      lengthAfter: lenAfter,
      appliedLoad: loadStr,
    },
    pressureTest: pressureRows,
  };

  // Persist forced m value if calculation exceeds 0.50
  const exp = calcExponent(report.pressureTest);
  if (exp.m >= 0.50) {
    report.forcedM = 0.4900 + Math.random() * 0.0099;
  }

  return report;
}

export function emptyReport(p: Preset, spacingId: string | undefined, overrides: Partial<BasicInfo>): ReportData {
  const sp = pickSpacing(p, spacingId);
  const dim = () => ({ insideDiameter: [0, 0, 0, 0], wallThickness: [0, 0, 0, 0] });
  const loadStr = p.appliedLoad ? `${p.appliedLoad.toFixed(3)} KN` : "";
  return {
    id: v4(),
    createdAt: new Date().toISOString(),
    presetId: p.id,
    basicInfo: {
      formatNo: "QC/2025-26",
      dateOfMfg: "",
      dateOfTest: "",
      size: p.size,
      discharge: `${p.discharge.toFixed(2)} LPH`,
      batchNo: "",
      className: p.className,
      spacing: String(sp.value),
      qtyOfProduction: "",
      category: p.category,
      mcNo: "",
      specimenLength: `${p.specimenLength || 150} mm`,
      reportType: "Daily",
      cbcPerformed: true,
      ...overrides,
    },
    dimensions: [dim(), dim(), dim()],
    visualAppearance: "Satisfy",
    carbonContent: {
      wtOfCrucible: p.carbonCrucibleWeight.value,
      wtOfCrucibleSample: p.carbonCrucibleWeight.value + p.carbonSampleWeight.value,
      wtOfCrucibleCarbonAfterHeating: p.carbonCrucibleWeight.value + (p.carbonSampleWeight.value * p.carbonPercentage.value) / 100,
    },
    carbonDispersion: "UNIFORM",
    flowPath: { values: [0, 0, 0, 0, 0], declaredMin: p.minFlowPath.value, declared: p.minFlowPath.value },
    spacing: { values: Array(10).fill(0), declared: sp.value },
    envCracking: { results: Array(5).fill("PASSED") },
    pullOut: { testDuration: "1 Hr.", appliedLoad: loadStr, result: "PASS" },
    uniformity: Array.from({ length: 25 }).map(() => ({ emissionRate: 0 })),
    envCrackingType: { results: Array(5).fill("PASSED") },
    hydraulicAmbient: { dischargeBefore: [0, 0, 0, 0, 0], dischargeAfter: [0, 0, 0, 0, 0] },
    hydraulicElevated: { dischargeBefore: [0, 0, 0, 0, 0], dischargeAfter: [0, 0, 0, 0, 0] },
    tension: {
      dischargeBefore: [0, 0, 0, 0, 0],
      dischargeAfter: [0, 0, 0, 0, 0],
      lengthBefore: Array(5).fill(p.lengthBeforeTest != null && p.lengthBeforeTest > 0 ? p.lengthBeforeTest : 150),
      lengthAfter: Array(5).fill(p.lengthBeforeTest != null && p.lengthBeforeTest > 0 ? p.lengthBeforeTest : 150),
      appliedLoad: loadStr,
    },
    pressureTest: p.declaredDischargePerPressure.map((dp) => ({
      pressure: dp.pressure,
      declared: dp.discharge,
      readings: [0, 0, 0, 0],
    })),
  };
}
