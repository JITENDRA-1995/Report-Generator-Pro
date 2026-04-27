export const avg = (a: number[]): number => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
export const sum = (a: number[]): number => a.reduce((s, x) => s + x, 0);

export const fmt = (v: number, d = 2): string => {
  if (!isFinite(v)) return (0).toFixed(d);
  return v.toFixed(d);
};

export interface UniformityCalcRow {
  no: number;
  discharge360sec: number; // ml
  dischargeLph: number; // x = ml * 6
  meanRateQ1: number;
  ascNo: number;
  ascValue: number; // sorted x
  xMinusX1: number; // ascending - mean
  xMinusX1Sq: number;
}

export interface UniformityCalc {
  rows: UniformityCalcRow[];
  meanQ: number; // LPH
  declaredEmissionRate: number;
  sumOfSquares: number;
  sq: number; // standard deviation
  cv: number;
  deviation: number; // (mean - declared)/declared * 100
}

export function calcUniformity(emissionRates: number[], declared: number): UniformityCalc {
  const n = emissionRates.length;
  // discharge in 360 sec (ml) reverse-derived from LPH:  ml in 6 min: LPH * 1000 / 60 * 6 / ... -- use LPH/6 = ml in 360 sec? Approx use LPH/6 for ml. Actually 1 LPH = 1L/60min => in 6 min = 100 ml.
  // ml in 360 sec = LPH * 100 (as 1 LPH for 6 min = 100 ml)... but format shows small "Discharge in 360 Sec. (ML)" e.g. 0 in template. We'll compute realistically: ml = LPH/60 * 6 * 1000 = LPH * 100.
  const xs = emissionRates.slice();
  const meanX = avg(xs);
  const withIndices = xs.map((v, i) => ({ v, i: i + 1 }));
  const sorted = [...withIndices].sort((a, b) => a.v - b.v);
  
  const rows: UniformityCalcRow[] = xs.map((x, i) => {
    const sortedItem = sorted[i];
    const ascValue = sortedItem?.v ?? 0;
    return {
      no: i + 1,
      discharge360sec: Math.round(x * 100),
      dischargeLph: x,
      meanRateQ1: meanX,
      ascNo: sortedItem?.i ?? 0,
      ascValue,
      xMinusX1: ascValue - meanX,
      xMinusX1Sq: Math.pow(ascValue - meanX, 2),
    };
  });
  const sumSq = sum(rows.map((r) => r.xMinusX1Sq));
  const sq = Math.sqrt(sumSq / n);
  const cv = meanX === 0 ? 0 : (sq / meanX) * 100;
  const deviation = declared === 0 ? 0 : ((meanX - declared) / declared) * 100;
  return {
    rows,
    meanQ: meanX,
    declaredEmissionRate: declared,
    sumOfSquares: sumSq,
    sq,
    cv,
    deviation,
  };
}

export interface ExponentRow {
  no: number;
  pi_kg: number;
  pi_kpa: number;
  qi: number;
  logPi: number;
  logQi: number;
  logPi_logQi: number;
  logPi_sq: number;
}

export interface ExponentCalc {
  rows: ExponentRow[];
  sumLogPi: number;
  sumLogQi: number;
  sumLogPiLogQi: number;
  sumLogPiSq: number;
  m: number;
}

export function calcExponent(pressureRows: { pressure: number; readings: number[] }[]): ExponentCalc {
  const n = pressureRows.length;
  const rows: ExponentRow[] = pressureRows.map((pr, i) => {
    const pi_kg = pr.pressure;
    const pi_kpa = pi_kg * 98.0665;
    const qi = avg(pr.readings) / 100; // readings are stored as ml (LPH × 100); convert to LPH
    const logPi = pi_kpa > 0 ? Math.log10(pi_kpa) : 0;
    const logQi = qi > 0 ? Math.log10(qi) : 0;
    return {
      no: i + 1,
      pi_kg,
      pi_kpa,
      qi,
      logPi,
      logQi,
      logPi_logQi: logPi * logQi,
      logPi_sq: logPi * logPi,
    };
  });
  const sumLogPi = sum(rows.map((r) => r.logPi));
  const sumLogQi = sum(rows.map((r) => r.logQi));
  const sumLogPiLogQi = sum(rows.map((r) => r.logPi_logQi));
  const sumLogPiSq = sum(rows.map((r) => r.logPi_sq));
  const num = sumLogPiLogQi - (1 / n) * sumLogPi * sumLogQi;
  const den = sumLogPiSq - (1 / n) * sumLogPi * sumLogPi;
  const m = den === 0 ? 0 : num / den;
  return { rows, sumLogPi, sumLogQi, sumLogPiLogQi, sumLogPiSq, m };
}
