// ===== Report data (matches printed format) =====
export interface BasicInfo {
  formatNo: string;
  dateOfMfg: string;
  dateOfTest: string;
  size: string;
  discharge: string;
  batchNo: string;
  className: string;
  spacing: string;
  qtyOfProduction: string;
  category: string;
  mcNo: string;
}

export interface DimensionRow {
  insideDiameter: number[];
  wallThickness: number[];
}

export interface CarbonContent {
  wtOfCrucible: number;
  wtOfCrucibleSample: number;
  wtOfCrucibleCarbonAfterHeating: number;
}

export interface FlowPath {
  values: number[];
  declaredMin: number;
  declared: number;
}

export interface SpacingTest {
  values: number[];
  declared: number;
}

export interface CrackTest {
  results: ("PASSED" | "FAILED")[];
}

export interface PullOutTest {
  testDuration: string;
  appliedLoad: string;
  result: "PASS" | "FAIL";
}

export interface UniformityRow {
  emissionRate: number;
}

export interface HydraulicTest {
  dischargeBefore: number[];
  dischargeAfter: number[];
}

export interface TensionTest {
  dischargeBefore: number[];
  dischargeAfter: number[];
  lengthBefore: number[];
  lengthAfter: number[];
  appliedLoad: string;
}

export interface PressureRow {
  pressure: number;
  readings: number[];
}

export interface ReportData {
  id: string;
  createdAt: string;
  presetId?: string;
  basicInfo: BasicInfo;
  dimensions: DimensionRow[];
  visualAppearance: string;
  carbonContent: CarbonContent;
  carbonDispersion: string;
  flowPath: FlowPath;
  spacing: SpacingTest;
  envCracking: CrackTest;
  pullOut: PullOutTest;
  uniformity: UniformityRow[];
  envCrackingType: CrackTest;
  hydraulicAmbient: HydraulicTest;
  hydraulicElevated: HydraulicTest;
  tension: TensionTest;
  pressureTest: PressureRow[];
}

// ===== Presets =====
export interface ValRange {
  value: number;
  min: number;
  max: number;
}

export interface SpacingOption {
  id: string;
  value: number;
  min: number;
  max: number;
}

export interface DischargePerPressure {
  pressure: number;
  discharge: number;
  min: number;
  max: number;
}

export interface Preset {
  id: string;
  name: string;
  size: string;
  className: string;
  category: string;
  discharge: number;
  minFlowPath: ValRange;
  specimenLength: number;
  appliedLoad: number;
  insideDiameter: ValRange;
  wallThickness: ValRange;
  declaredDischargePerPressure: DischargePerPressure[];
  spacings: SpacingOption[];
}

export interface StandardSpec {
  id: string;
  size: string;
  insideDiameterMin: number;
  insideDiameterMax: number;
  wallThicknessMin: number;
  wallThicknessMax: number;
  notes: string;
}
