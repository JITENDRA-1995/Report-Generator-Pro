import type { ReportData, Preset, SpacingOption, BasicInfo } from "./types";
import { v4 } from "./uuid";

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

export function generateRandomReport(p: Preset, spacingId: string | undefined, overrides: Partial<BasicInfo>): ReportData {
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
    rnd(p.minFlowPath.min, p.minFlowPath.max, 0),
  );

  const spacingValues = Array.from({ length: 10 }).map(() =>
    rnd(sp.min, sp.max, 2),
  );

  const declaredDischarge = p.discharge || 2;
  const uniformity = Array.from({ length: 25 }).map(() => ({
    emissionRate: rnd(declaredDischarge * 0.95, declaredDischarge * 1.05, 2),
  }));

  const hAmbB = Array.from({ length: 5 }).map(() => rnd(declaredDischarge * 0.96, declaredDischarge * 1.04, 2));
  const hAmbA = hAmbB.map((v) => rnd(v * 0.97, v * 1.03, 2));
  const hElB = Array.from({ length: 5 }).map(() => rnd(declaredDischarge * 0.96, declaredDischarge * 1.04, 2));
  const hElA = hElB.map((v) => rnd(v * 0.97, v * 1.03, 2));

  const tenB = Array.from({ length: 5 }).map(() => rnd(declaredDischarge * 0.96, declaredDischarge * 1.04, 2));
  const tenA = tenB.map((v) => rnd(v * 0.97, v * 1.03, 2));
  const lenBefore = Array.from({ length: 5 }).map(() => p.specimenLength || 150);
  const lenAfter = lenBefore.map((v) => rnd(v + 0.2, v + 1.5, 2));

  const carbonCru = rnd(18, 22, 4);
  const carbonSamp = rnd(0.45, 0.55, 4);
  const carbonAfter = rnd(carbonCru + carbonSamp * 0.96, carbonCru + carbonSamp * 0.985, 4);

  const pressureRows = p.declaredDischargePerPressure.map((dp) => {
    // ml in 360 sec; LPH = ml / 100 → ml ≈ LPH * 100
    return {
      pressure: dp.pressure,
      readings: Array.from({ length: 4 }).map(() =>
        Math.round(rnd(dp.min * 100, dp.max * 100, 0)),
      ),
    };
  });

  const loadKn = p.appliedLoad || 0.05;
  const loadStr = `${loadKn.toFixed(3)} KN`;

  return {
    id: v4(),
    createdAt: new Date().toISOString(),
    presetId: p.id,
    basicInfo: {
      formatNo: "QC/2025-26",
      dateOfMfg: "",
      dateOfTest: "",
      size: p.size,
      discharge: `${p.discharge} LPH`,
      batchNo: "",
      className: p.className,
      spacing: String(sp.value),
      qtyOfProduction: "",
      category: p.category,
      mcNo: "",
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
      discharge: `${p.discharge} LPH`,
      batchNo: "",
      className: p.className,
      spacing: String(sp.value),
      qtyOfProduction: "",
      category: p.category,
      mcNo: "",
      ...overrides,
    },
    dimensions: [dim(), dim(), dim()],
    visualAppearance: "Satisfy",
    carbonContent: { wtOfCrucible: 0, wtOfCrucibleSample: 0, wtOfCrucibleCarbonAfterHeating: 0 },
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
      lengthBefore: Array(5).fill(p.specimenLength || 150),
      lengthAfter: Array(5).fill(p.specimenLength || 150),
      appliedLoad: loadStr,
    },
    pressureTest: p.declaredDischargePerPressure.map((dp) => ({
      pressure: dp.pressure,
      readings: [0, 0, 0, 0],
    })),
  };
}
