import type { ReportData, DataManagementPresets } from "./types";
import { v4 } from "./uuid";

function rnd(min: number, max: number, decimals = 2): number {
  if (min === max) return min;
  const v = min + Math.random() * (max - min);
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function todayStr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function generateRandomReport(p: DataManagementPresets): ReportData {
  const size = pick(p.sizes);
  const cls = pick(p.classes);
  const cat = pick(p.categories);
  const dis = pick(p.discharges);
  const sp = pick(p.spacings);
  const qty = pick(p.qtyOfProduction);

  const dimensions = Array.from({ length: 3 }).map(() => ({
    insideDiameter: Array.from({ length: 4 }).map(() =>
      rnd(p.insideDiameter.min, p.insideDiameter.max, p.insideDiameter.decimals),
    ),
    wallThickness: Array.from({ length: 4 }).map(() =>
      rnd(p.wallThickness.min, p.wallThickness.max, p.wallThickness.decimals),
    ),
  }));

  const declaredFlow = rnd(p.flowPath.min, p.flowPath.max, p.flowPath.decimals);
  const flowValues = Array.from({ length: 5 }).map(() =>
    rnd(declaredFlow * 0.97, declaredFlow * 1.03, p.flowPath.decimals),
  );
  const declaredSpacing = parseFloat(sp);
  const spacingValues = Array.from({ length: 10 }).map(() =>
    rnd(declaredSpacing * 0.97, declaredSpacing * 1.03, p.spacingValue.decimals),
  );

  const declaredDischarge = parseFloat(dis) || 2;
  const uniformity = Array.from({ length: 25 }).map(() => ({
    emissionRate: rnd(declaredDischarge * 0.95, declaredDischarge * 1.05, p.emissionRate.decimals),
  }));

  const hAmbB = Array.from({ length: 5 }).map(() =>
    rnd(declaredDischarge * 0.95, declaredDischarge * 1.05, p.hydraulicDischarge.decimals),
  );
  const hAmbA = hAmbB.map((v) => rnd(v * 0.97, v * 1.03, p.hydraulicDischarge.decimals));
  const hElB = Array.from({ length: 5 }).map(() =>
    rnd(declaredDischarge * 0.95, declaredDischarge * 1.05, p.hydraulicDischarge.decimals),
  );
  const hElA = hElB.map((v) => rnd(v * 0.97, v * 1.03, p.hydraulicDischarge.decimals));

  const tenB = Array.from({ length: 5 }).map(() =>
    rnd(declaredDischarge * 0.95, declaredDischarge * 1.05, p.hydraulicDischarge.decimals),
  );
  const tenA = tenB.map((v) => rnd(v * 0.97, v * 1.03, p.hydraulicDischarge.decimals));
  const lenBefore = Array.from({ length: 5 }).map(() => 150);
  const lenAfter = lenBefore.map(() => rnd(150.2, 151.6, 2));

  const carbonCru = rnd(p.carbonWtCrucible.min, p.carbonWtCrucible.max, p.carbonWtCrucible.decimals);
  const carbonSamp = rnd(p.carbonWtSample.min, p.carbonWtSample.max, p.carbonWtSample.decimals);
  const carbonAfter = rnd(carbonCru + carbonSamp * 0.95, carbonCru + carbonSamp * 0.99, p.carbonWtAfter.decimals);

  const pressureRows = [0.5, 1.0, 1.5, 1.8].map((pr) => ({
    pressure: pr,
    readings: Array.from({ length: 4 }).map(() => rnd(declaredDischarge * 0.5 * pr, declaredDischarge * 0.6 * pr, 2)),
  }));

  return {
    id: v4(),
    createdAt: new Date().toISOString(),
    basicInfo: {
      formatNo: "QC/2025-26",
      dateOfMfg: todayStr(),
      dateOfTest: todayStr(),
      size,
      discharge: dis,
      batchNo: `B-${Math.floor(Math.random() * 9000 + 1000)}`,
      className: cls,
      spacing: sp,
      qtyOfProduction: qty,
      category: cat,
      mcNo: `M-${Math.floor(Math.random() * 90 + 10)}`,
    },
    dimensions,
    visualAppearance: "Satisfy",
    carbonContent: {
      wtOfCrucible: carbonCru,
      wtOfCrucibleSample: carbonCru + carbonSamp,
      wtOfCrucibleCarbonAfterHeating: carbonAfter,
    },
    carbonDispersion: "UNIFORM",
    flowPath: {
      values: flowValues,
      declaredMin: declaredFlow,
      declared: declaredFlow,
    },
    spacing: { values: spacingValues, declared: declaredSpacing },
    envCracking: { results: ["PASSED", "PASSED", "PASSED", "PASSED", "PASSED"] },
    pullOut: { testDuration: "1 Hr.", appliedLoad: `${rnd(50, 80, 1)} N`, result: "PASS" },
    uniformity,
    envCrackingType: { results: ["PASSED", "PASSED", "PASSED", "PASSED", "PASSED"] },
    hydraulicAmbient: { dischargeBefore: hAmbB, dischargeAfter: hAmbA },
    hydraulicElevated: { dischargeBefore: hElB, dischargeAfter: hElA },
    tension: {
      dischargeBefore: tenB,
      dischargeAfter: tenA,
      lengthBefore: lenBefore,
      lengthAfter: lenAfter,
      appliedLoad: `${rnd(40, 60, 1)} N`,
    },
    pressureTest: pressureRows,
  };
}

export function emptyReport(p: DataManagementPresets): ReportData {
  const dim = () => ({ insideDiameter: [0, 0, 0, 0], wallThickness: [0, 0, 0, 0] });
  return {
    id: v4(),
    createdAt: new Date().toISOString(),
    basicInfo: {
      formatNo: "QC/2025-26",
      dateOfMfg: "",
      dateOfTest: "",
      size: p.sizes[0] ?? "",
      discharge: p.discharges[0] ?? "",
      batchNo: "",
      className: p.classes[0] ?? "",
      spacing: p.spacings[0] ?? "",
      qtyOfProduction: p.qtyOfProduction[0] ?? "",
      category: p.categories[0] ?? "",
      mcNo: "",
    },
    dimensions: [dim(), dim(), dim()],
    visualAppearance: "Satisfy",
    carbonContent: { wtOfCrucible: 0, wtOfCrucibleSample: 0, wtOfCrucibleCarbonAfterHeating: 0 },
    carbonDispersion: "UNIFORM",
    flowPath: { values: [0, 0, 0, 0, 0], declaredMin: 0, declared: 0 },
    spacing: { values: Array(10).fill(0), declared: parseFloat(p.spacings[0] ?? "0") || 0 },
    envCracking: { results: Array(5).fill("PASSED") },
    pullOut: { testDuration: "1 Hr.", appliedLoad: "", result: "PASS" },
    uniformity: Array.from({ length: 25 }).map(() => ({ emissionRate: 0 })),
    envCrackingType: { results: Array(5).fill("PASSED") },
    hydraulicAmbient: { dischargeBefore: [0, 0, 0, 0, 0], dischargeAfter: [0, 0, 0, 0, 0] },
    hydraulicElevated: { dischargeBefore: [0, 0, 0, 0, 0], dischargeAfter: [0, 0, 0, 0, 0] },
    tension: {
      dischargeBefore: [0, 0, 0, 0, 0],
      dischargeAfter: [0, 0, 0, 0, 0],
      lengthBefore: [150, 150, 150, 150, 150],
      lengthAfter: [150, 150, 150, 150, 150],
      appliedLoad: "",
    },
    pressureTest: [0.5, 1.0, 1.5, 1.8].map((pr) => ({ pressure: pr, readings: [0, 0, 0, 0] })),
  };
}
