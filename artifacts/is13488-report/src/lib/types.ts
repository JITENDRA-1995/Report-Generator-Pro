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
  specimenLength: string;
  reportType: "Daily" | "Weekly";
  cbcPerformed: boolean;
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
  declaredMin: number; // old
  declared: number;    // old
  minLimit?: number;
  declaredLimit?: number;
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
  dischargeInSecs?: number;
  dischargeLph?: number;
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
  declared: number;
}

export interface ReportData {
  id: string;
  createdAt: string;
  presetId?: string;
  standardId?: string;
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
  forcedM?: number;

  // IS 14483 specific
  is14483_hydrostatic?: ("Confirmed" | "Failed")[];
  is14483_performanceA?: { inlet: number; outlet: number; declaredMotive: number; observedMotive: number; declaredSuction: number; observedSuction: number }[];
  is14483_performanceB?: { inlet: number; outlet: number; declaredMotive: number; observedMotive: number; declaredSuction: number; observedSuction: number }[];
  is14483_pressureDropA?: { inlet: number; declaredDrop: number; actualDrop: number }[];
  is14483_pressureDropB?: { inlet: number; declaredDrop: number; actualDrop: number }[];
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
  r3Min?: number;
  r3Max?: number;
  r12Min?: number;
  r12Max?: number;
  r13Min?: number;
  r13Max?: number;
  r23Min?: number;
  r23Max?: number;
}

export interface IS14483TableEntry {
  pressure: number;
  motiveFlow: number;
  waterSuction: number;
}

export interface Preset {
  id: string;
  name: string;
  size: string;
  className: string;
  category: string;
  discharge: number;
  minFlowPath: ValRange;
  declaredFlowPath?: number;
  specimenLength: number;
  lengthBeforeTest: number;
  appliedLoad: number;
  carbonCrucibleWeight: ValRange;
  carbonCrucibleWeights?: ValRange[];
  carbonSampleWeight: ValRange;
  carbonPercentage: ValRange;
  insideDiameter: ValRange;
  wallThickness: ValRange;
  declaredDischargePerPressure: DischargePerPressure[];
  spacings: SpacingOption[];
  is14483Table?: IS14483TableEntry[];
  isImported?: boolean;
}

export interface StandardHeaderCustomization {
  id: string;
  size: string;
  className: string;
  headers: Record<string, string>; // key = sr no. (e.g. "1", "3", "5"), value = header text
}

export interface StandardSpec {
  id: string;
  size: string;
  className: string;
  discharge: string;
  insideDiameterMin: number;
  insideDiameterMax: number;
  wallThicknessMin: number;
  wallThicknessMax: number;
  flowPathMin: number;
  declaredFlowPath?: number;
  notes: string;
  isImported?: boolean;
}
