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
  pressure: number; // kg/sq.cm
  readings: number[]; // 4 readings (3, 12, 13, 23 columns)
}

export interface ReportData {
  id: string;
  createdAt: string;
  basicInfo: BasicInfo;
  dimensions: DimensionRow[]; // 3 samples
  visualAppearance: string;
  carbonContent: CarbonContent;
  carbonDispersion: string;
  flowPath: FlowPath;
  spacing: SpacingTest;
  envCracking: CrackTest;
  pullOut: PullOutTest;
  uniformity: UniformityRow[]; // 25 emitting units
  envCrackingType: CrackTest;
  hydraulicAmbient: HydraulicTest;
  hydraulicElevated: HydraulicTest;
  tension: TensionTest;
  pressureTest: PressureRow[]; // 4 pressure rows
}

export interface RangeConfig {
  min: number;
  max: number;
  decimals: number;
}

export interface DataManagementPresets {
  sizes: string[];
  classes: string[];
  categories: string[];
  discharges: string[];
  spacings: string[];
  qtyOfProduction: string[];

  // Ranges for auto-fill
  insideDiameter: RangeConfig;
  wallThickness: RangeConfig;
  flowPath: RangeConfig;
  spacingValue: RangeConfig;
  emissionRate: RangeConfig;
  hydraulicDischarge: RangeConfig;
  carbonWtCrucible: RangeConfig;
  carbonWtSample: RangeConfig;
  carbonWtAfter: RangeConfig;
  pressureReading: RangeConfig;
}
