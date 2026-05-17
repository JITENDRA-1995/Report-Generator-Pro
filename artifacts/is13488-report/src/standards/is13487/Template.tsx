import React from "react";
import type { ReportData } from "@/lib/types";
import { avg, fmt, calcUniformity } from "@/lib/calc";
import { getPreset, getSpecFor } from "@/lib/storage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import logoUrl from "@assets/PARAGON_LOGO_1776781679624.png";

interface TemplateProps {
  data: ReportData;
}

export function IS13487Template({ data }: TemplateProps) {
  const b = data.basicInfo;
  const preset = data.presetId ? getPreset(data.presetId) : null;
  const specRef = getSpecFor(b.size, b.className, b.discharge);

  let declaredFp = typeof data.flowPath.declaredLimit === 'object' ? (data.flowPath.declaredLimit as any)?.value ?? 0.8 : data.flowPath.declaredLimit ?? 0.8;
  if (preset) {
    const pFp = typeof preset.declaredFlowPath === 'object' ? (preset.declaredFlowPath as any)?.value ?? 0.8 : preset.declaredFlowPath ?? 0.8;
    declaredFp = pFp;
  }
  if (specRef) {
    declaredFp = specRef.declaredFlowPath ?? declaredFp;
  }

  // --- CALCULATIONS FOR UNIFORMITY (Using shared logic) ---
  const lphValues = data.uniformity.map(u => u.dischargeLph || 0).filter(v => v > 0);
  const u = calcUniformity(lphValues, parseFloat(b.size) || 4.0);
  
  const meanQ = u.meanQ;
  const sq = u.sq;
  const cv = u.cv;
  const declaredQ = u.declaredEmissionRate;
  const deviation = u.deviation;

  // --- CALCULATIONS FOR EXPONENT (Page 3) ---
  const initialExp = calcExponent(data.pressureTest, true);
  const finalPressureRows = data.pressureTest.map((pr, i) => {
    const readings = initialExp.adjustedReadings ? initialExp.adjustedReadings[i] : pr.readings;
    return { ...pr, readings };
  });
  const exp = initialExp.adjustedReadings ? calcExponent(finalPressureRows, true) : initialExp;
  const m_calc = exp.m;
  const n = exp.rows.length;

  // --- CHART DATA ---
  const chartData = finalPressureRows.map(row => {
    const sortedReadings = [...row.readings].sort((a, b) => a - b);
    const rowAvgMl = avg(sortedReadings);
    return {
      pressure: row.pressure,
      discharge: rowAvgMl / 50, // LPH = ml / 50 (for 180s)
      declared: row.declared,
    };
  });

  return (
    <div className="bg-slate-500 min-h-screen py-8 print:p-0 print:bg-white print-area" id="report-content">
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white; }
          .page-break { page-break-after: always; }
        }
        .report-table th, .report-table td { border: 1px solid #000; padding: 0 4px 4px 4px; }
        .report-table { border-collapse: collapse; width: 100%; border: none; }
        .formula-box { border: 1px solid #000; border-radius: 0px; padding: 1rem; background: white; }
      `}</style>

      {/* --- PAGE 1 --- */}
      <Page pageNo={1}>
        <ReportHeader b={b} />
        <IdentityTable b={b} />

        <div className="mt-3">
          <SectionHeader title="[1] MECHANICAL TESTS :" separated />
          <table className="report-table">
            <thead>
              <tr className="uppercase text-[11px] tracking-wide" style={{ backgroundColor: '#f8fafc' }}>
                <th className="w-16 text-center leading-tight py-2 font-black">Sr.<br/>No</th>
                <th className="w-48 text-center font-black">Type of Test</th>
                <th className="w-20 text-center font-black">Clause</th>
                <th className="text-center font-black">Reference Value</th>
                <th className="w-44 text-center font-black">Test Result</th>
              </tr>
            </thead>
            <tbody>
              <tr className="align-middle text-[12px] h-[50px]">
                <td className="text-center py-2">1.1</td>
                <td className="px-3 py-2">Construction and Workmanship</td>
                <td className="text-center py-2">7.1</td>
                <td className="px-3 py-2">No manufacturing defects such as grooves, cracks or cavities</td>
                <td className="text-center font-black uppercase text-[12px] py-2">{data.visualAppearance || "Satisfactory"}</td>
              </tr>
              <tr className="h-[56px] align-middle text-[12px]">
                <td className="text-center py-2">1.2</td>
                <td className="px-3 py-2">Flow Paths</td>
                <td className="text-center py-2">7.2</td>
                <td className="px-3 text-center py-2">
                  Declared Flow Path = {fmt(declaredFp)} mm
                </td>
                <td className="p-0">
                  <div className="flex flex-col h-full text-center">
                    <div className="py-1 px-2 text-[11px] font-black">
                      I) {fmt(data.flowPath.values[0] || 0)} &nbsp; II) {fmt(data.flowPath.values[1] || 0)} &nbsp; III) {fmt(data.flowPath.values[2] || 0)}
                    </div>
                    <div className="border-t-2 border-black py-1 font-black text-[14px] flex-1 flex items-center justify-center">
                      Avg. - {fmt(avg(data.flowPath.values.slice(0,3).filter(v => v > 0)))}
                    </div>
                  </div>
                </td>
              </tr>
              <tr className="align-middle text-[12px] h-[50px]">
                <td className="text-center py-2">1.3</td>
                <td className="px-3 py-2">Resistance to Hydrostatic Pressure</td>
                <td className="text-center py-2">7.3</td>
                <td className="px-3 py-2">No leakage shall occur through emitter bodies or connections.</td>
                <td className="text-center font-black uppercase text-[12px] py-2">{data.hydraulicAmbient.dischargeBefore[0] === 1 ? "Satisfactory" : "Leakage"}</td>
              </tr>
              <tr className="align-middle text-[12px] h-[50px]">
                <td className="text-center py-2">1.4</td>
                <td className="px-3 py-2">Emitter Pull-Out</td>
                <td className="text-center py-2">7.4</td>
                <td className="px-3 py-2">Withstand pulling force without pulling out pipe wall.</td>
                <td className="text-center font-black uppercase text-[11px] py-2">{data.pullOut.result || "Satisfactory"} (40 N / 1 Hr)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <SectionHeader title="[2] FUNCTIONAL TESTS :" separated />
          <table className="report-table">
            <tbody>
              <tr className="h-[160px]">
                <td className="text-center align-middle text-[14px] w-16">2.1</td>
                <td className="px-3 align-middle text-[13px] w-48 leading-tight">Uniformity of Emission Rate</td>
                <td className="text-center align-middle text-[12px] w-20">8.1</td>
                <td className="p-0 align-top h-[160px]">
                  <div className="h-[80px] px-3 border-b-2 border-black text-[11.5px] leading-tight font-medium flex flex-col justify-center text-justify">
                    The mean emission rate not deviate by more than 5 percent for Category A, not more than 10 percent for Category B
                  </div>
                  <div className="h-[80px] px-3 text-[11.5px] leading-tight font-medium flex flex-col justify-center text-justify">
                    The coefficient of variation(Cv) of the emission rate of the test sample shall not exceed 5 percent for Category A not more than 10 percent for Category B
                  </div>
                </td>
                <td className="p-0 align-top w-44 h-[160px]" style={{ backgroundColor: '#f8fafc' }}>
                  <div className="h-[80px] px-4 border-b-2 border-black flex flex-col justify-center items-center">
                    <div className="text-[10px] font-bold uppercase" style={{ color: '#475569' }}>Mean Emission Rate</div>
                    <div className="text-[17px] font-black leading-none mb-1">{fmt(meanQ)} LPH</div>
                    <div className="text-[13px] font-black">Dev. {fmt(deviation)} %</div>
                  </div>
                  <div className="h-[80px] px-4 flex flex-col justify-center items-center">
                    <div className="text-[15px] font-bold">Sq = {fmt(sq, 4)}</div>
                    <div className="text-[14px] font-bold">Cv = {fmt(cv)} %</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="formula-box mt-1 w-full">
          <div className="text-[13px] space-y-6 font-medium flex flex-col items-start w-full">
            <div className="w-full flex justify-between text-[14px] font-bold px-12">
              <div>Mean Emission Rate q = {fmt(meanQ)} LPH</div>
              <div>Declared Emission Rate = {fmt(declaredQ)} LPH</div>
            </div>
            
            <div className="w-full space-y-10">
              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-[250px_auto] items-center gap-4">
                  <div className="text-right font-black text-[14px]">Deviation from Mean =</div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center min-w-[240px] text-[15px]">
                      <div className="w-full text-center pb-1">Declared - Mean</div>
                      <div className="h-[2px] bg-black w-full my-[1px]"></div>
                      <div className="pt-1">Declared</div>
                    </div>
                    <div className="text-[15px] font-medium">X 100</div>
                  </div>
                </div>
                <div className="grid grid-cols-[250px_auto] gap-4">
                  <div />
                  <div className="text-[16px] font-black uppercase tracking-tight">
                    Deviation from Mean = <span className="ml-2">{fmt(deviation)} %</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-[250px_auto] items-center gap-4">
                  <div className="text-right font-black text-[14px]">Co-eff. of Variation Cv =</div>
                  <div className="flex items-center">
                    <div className="flex flex-col items-center min-w-[240px] text-[15px]">
                      <div className="w-full text-center pb-1">Sq x 100</div>
                      <div className="h-[2px] bg-black w-full my-[1px]"></div>
                      <div className="pt-1">q</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[250px_auto] gap-4">
                  <div />
                  <div className="text-[16px] font-black uppercase tracking-tight">
                    Co-eff. of Variation Cv = <span className="ml-2">{fmt(cv)} %</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </Page>

      {/* --- PAGE 2 --- */}
      <Page pageNo={2}>
        <ReportHeader b={b} />
        <div className="mt-3">
           <SectionHeader title="[2.2] UNIFORMITY TABLE (CLAUSE 8.1 CONTINUED) :" separated />
           <table className="report-table text-[10px]">
             <thead>
               <tr className="h-10" style={{ backgroundColor: '#f1f5f9' }}>
                 <th className="w-8">NO</th>
                 <th className="w-24">Discharge 180s (ml)</th>
                 <th className="w-20">Discharge LPH (X)</th>
                 <th className="w-20">Mean Emission Rate (q)</th>
                 <th className="w-8">No.</th>
                 <th className="w-20">Ascending Order</th>
                 <th className="w-20">(X-q)</th>
                 <th className="w-20">(X-q)²</th>
                 <th className="w-20">Sq = √ Σ(X-q)² / n</th>
                 <th className="w-20">CV = (Sq/q) x 100</th>
               </tr>
             </thead>
             <tbody>
               {[...Array(25)].map((_, i) => {
                 const row = data.uniformity[i] || { dischargeInSecs: 0, dischargeLph: 0 };
                 const x = row.dischargeLph || 0;
                 const rawSecs = row.dischargeInSecs || 0;
                 const mlVal = rawSecs > 0 ? (rawSecs < 10 ? rawSecs * 1000 : rawSecs) : (x > 0 ? x * 100 : 0);
                 const diff = x > 0 ? (x - meanQ) : 0;
                 const diffSq = Math.pow(diff, 2);
                 
                 const calcRow = u.rows[i];
                 const ascX = calcRow?.ascValue || 0;
                 const ascSrNo = calcRow?.ascNo || (i + 1);

                 return (
                   <tr key={i} className="text-center" style={{ height: '31px' }}>
                     <td className="">{i + 1}</td>
                     <td>{mlVal > 0 ? mlVal.toFixed(1) : ""}</td>
                     <td className="">{x > 0 ? fmt(x, 3) : ""}</td>
                     <td className="align-middle text-center" style={{ backgroundColor: '#f8fafc' }}>
                       {i === 12 ? fmt(meanQ, 3) : ""}
                     </td>
                     <td className="">{ascX > 0 ? ascSrNo : ""}</td>
                     <td style={{ backgroundColor: '#f8fafc' }}>{ascX > 0 ? fmt(ascX, 3) : ""}</td>
                     <td>{x > 0 ? fmt(diff, 4) : ""}</td>
                     <td>{x > 0 ? fmt(diffSq, 6) : ""}</td>
                     <td className="align-middle text-center" style={{ backgroundColor: '#f8fafc' }}>
                       {i === 12 ? fmt(sq, 4) : ""}
                     </td>
                     <td className="align-middle text-center" style={{ backgroundColor: '#f8fafc' }}>
                       {i === 12 ? fmt(cv, 3) : ""}
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
        </div>
      </Page>

      {/* --- PAGE 3 --- */}
      <Page pageNo={3}>
        <ReportHeader b={b} />
        <div className="mt-1">
          <SectionHeader title="[2.3] EMISSION RATE AS FUNCTION OF INLET PRESSURE (CLAUSE 8.2) :" separated />
          <table className="report-table text-[10px]">
            <thead>
              <tr className="h-12 uppercase text-[9px]" style={{ backgroundColor: '#f1f5f9' }}>
                <th className="w-10">NO</th>
                <th className="w-20">Pressure<br/>(kg/cm²)</th>
                <th className="w-16">R1 (3)<br/>(ml)</th>
                <th className="w-16">R2 (12)<br/>(ml)</th>
                <th className="w-16">R3 (13)<br/>(ml)</th>
                <th className="w-16">R4 (23)<br/>(ml)</th>
                <th className="w-18">Average<br/>(ml)</th>
                <th className="w-18">Average<br/>(LPH)</th>
                <th className="w-18">Declared<br/>(LPH)</th>
                <th className="w-18">Variation<br/>(%)</th>
              </tr>
            </thead>
            <tbody>
              {finalPressureRows.map((row, i) => {
                const sortedReadings = [...row.readings].sort((a, b) => a - b);
                const rowAvgMl = avg(sortedReadings);
                const actualLph = rowAvgMl / 50;
                const varPct = row.declared ? ((actualLph - row.declared) / row.declared) * 100 : 0;
                return (
                  <tr key={i} className="text-center" style={{ height: '28px' }}>
                    <td>{i + 1}</td>
                    <td>{fmt(row.pressure, 1)}</td>
                    <td>{fmt(sortedReadings[0] || 0, 1)}</td>
                    <td>{fmt(sortedReadings[1] || 0, 1)}</td>
                    <td>{fmt(sortedReadings[2] || 0, 1)}</td>
                    <td>{fmt(sortedReadings[3] || 0, 1)}</td>
                    <td>{fmt(rowAvgMl, 1)}</td>
                    <td>{fmt(actualLph, 3)}</td>
                    <td>{fmt(row.declared, 2)}</td>
                    <td>{fmt(varPct, 2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* CHART SECTION - Height reduced to fit page */}
        <div style={{ width: "100%", height: 250, border: "2px solid black", marginTop: 4, padding: 4, background: "white" }}>
          <div style={{ textAlign: "center", fontWeight: 700, fontSize: 10, color: "#0f172a", textTransform: 'uppercase', marginBottom: 4 }}>
            EMISSION RATE AS A FUNCTION OF INLET PRESSURE
          </div>
          <ResponsiveContainer width="100%" height="92%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="pressure" 
                type="number" 
                domain={[0, 'auto']} 
                label={{ value: "PRESSURE IN KG/SQ.CM", position: "insideBottom", offset: -5, fontSize: 9, fontWeight: 700 }} 
                tick={{ fontSize: 9 }} 
              />
              <YAxis 
                label={{ value: "DISCHARGE IN LPH", angle: -90, position: "insideLeft", fontSize: 9, fontWeight: 700 }} 
                tick={{ fontSize: 9 }} 
              />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} verticalAlign="top" align="right" />
              <Line 
                type="monotone" 
                dataKey="discharge" 
                stroke="#7f3f9e" 
                name="Actual Discharge" 
                strokeWidth={2}
                dot={{ r: 4 }}
              >
                <LabelList dataKey="discharge" position="top" fontSize={9} fontWeight={700} formatter={(v: number) => fmt(v)} />
              </Line>
              <Line 
                type="monotone" 
                dataKey="declared" 
                stroke="#f0932b" 
                name="Declared" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-1">
          <SectionHeader title="[2.4] DETERMINATION OF EMITTER EXPONENT (CLAUSE 8.3) :" separated />
          
          <div className="border-2 border-black p-3 font-serif text-[12px] leading-snug">
            <div className="flex items-center gap-6">
              {/* Left: Formulas */}
              <div className="w-[45%]">
                <div className="flex items-center mb-2 italic text-lg">
                  <span className="font-black">q = K &middot; p<sup>m</sup></span>
                </div>
                <div className="flex items-center italic">
                  <span className="font-bold mr-1 translate-y-[-1px]">m = </span>
                  <div className="inline-block text-center align-middle">
                    <div className="px-1 pb-1">Σ (log p<sub>i</sub>)(log q<sub>i</sub>) &minus; (1/n) (Σ log p<sub>i</sub>)(Σ log q<sub>i</sub>)</div>
                    <div className="h-[1px] w-full my-1" style={{ backgroundColor: '#0f172a' }}></div>
                    <div className="pt-1">Σ (log p<sub>i</sub>)<sup>2</sup> &minus; (1/n) (Σ log p<sub>i</sub>)<sup>2</sup></div>
                  </div>
                </div>
              </div>

              {/* Middle: Q/K/P Definitions */}
              <div className="w-[25%] space-y-1 font-sans font-medium text-[11px]">
                <div>q = emission rate, in l/h;</div>
                <div>k = constant;</div>
                <div>p = inlet pressure, in KPa;</div>
              </div>

              {/* Right: M/I/N Definitions */}
              <div className="w-[25%] space-y-1 font-sans font-medium text-[11px]">
                <div>m = emitting unit exponent;</div>
                <div>i = 1, 2, 3, ..., n;</div>
                <div>n = number of pressure values used.</div>
              </div>
            </div>
          </div>

          <table className="report-table mt-2 text-[10px]">
            <thead>
              <tr className="h-10 uppercase text-[10px]" style={{ backgroundColor: '#f1f5f9' }}>
                <th className="w-10">NO</th>
                <th className="w-20">P<sub>i</sub> (kg/cm²)</th>
                <th className="w-20">P<sub>i</sub> (KPa)</th>
                <th className="w-20">Q<sub>i</sub> (LPH)</th>
                <th className="w-24">Log P<sub>i</sub></th>
                <th className="w-24">Log Q<sub>i</sub></th>
                <th className="w-32">(Log P<sub>i</sub>)(Log Q<sub>i</sub>)</th>
                <th className="w-32">(Log P<sub>i</sub>)<sup>2</sup></th>
              </tr>
            </thead>
            <tbody>
              {exp.rows.map((p, i) => (
                <tr key={i} className="text-center" style={{ height: '28px' }}>
                  <td>{i + 1}</td>
                  <td>{fmt(p.pi_kg, 1)}</td>
                  <td>{fmt(p.pi_kpa, 4)}</td>
                  <td>{fmt(p.qi)}</td>
                  <td>{fmt(p.logPi, 4)}</td>
                  <td>{fmt(p.logQi, 4)}</td>
                  <td>{fmt(p.logPi_logQi, 4)}</td>
                  <td>{fmt(p.logPi_sq, 4)}</td>
                </tr>
              ))}
              <tr className="h-8" style={{ backgroundColor: '#e2e8f0' }}>
                <td colSpan={4} className="text-center uppercase tracking-widest text-[9px]">Sum (Σ)</td>
                <td className="text-center">{fmt(exp.sumLogPi, 4)}</td>
                <td className="text-center">{fmt(exp.sumLogQi, 4)}</td>
                <td className="text-center">{fmt(exp.sumLogPiLogQi, 4)}</td>
                <td className="text-center">{fmt(exp.sumLogPiSq, 4)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-1 border-2 border-black p-3 font-serif text-[11px] bg-white relative">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="font-bold mr-2 text-[12px] translate-y-[-1px]">m = </span>
                  <div className="inline-block text-center align-middle">
                    <div className="px-4 pb-2">{fmt(exp.sumLogPiLogQi, 4)} &minus; (1/{n}) ({fmt(exp.sumLogPi, 4)}) ({fmt(exp.sumLogQi, 4)})</div>
                    <div className="h-[1px] w-full my-1" style={{ backgroundColor: '#0f172a' }}></div>
                    <div className="pt-2">{fmt(exp.sumLogPiSq, 4)} &minus; (1/{n}) ({fmt(exp.sumLogPi, 4)})<sup>2</sup></div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="font-bold mr-2 text-[12px] translate-y-[-1px]">m = </span>
                  <div className="inline-block text-center align-middle">
                    <div className="px-6 pb-2">{fmt(exp.sumLogPiLogQi - (1/n) * exp.sumLogPi * exp.sumLogQi, 4)}</div>
                    <div className="h-[1px] w-full my-1" style={{ backgroundColor: '#0f172a' }}></div>
                    <div className="pt-2">{fmt(exp.sumLogPiSq - (1/n) * Math.pow(exp.sumLogPi, 2), 4)}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center mr-10 mt-2">
                <div className="flex items-center font-black text-2xl border-l-4 border-black pl-6 py-4 px-8" style={{ backgroundColor: '#f8fafc' }}>
                  <span className="mr-3">m = </span>
                  <span>{fmt(m_calc, 4)}</span>
                </div>
                <div className="mt-2 text-center text-[11px] font-bold border-2 border-black rounded-xl p-3 bg-white shadow-sm italic" style={{ color: '#0f172a' }}>
                  For turbulent flow m should be<br/>
                  0.21 to 0.50
                </div>
              </div>
            </div>
          </div>
        </div>
      </Page>
    </div>
  );
}

function Page({ children, pageNo }: { children: React.ReactNode, pageNo: number }) {
  return (
    <div className="report-page w-[210mm] min-h-[297mm] p-[10mm] bg-white mx-auto mb-8 relative print:m-0 print:shadow-none print:mb-0 page-break overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
      {children}
      <div className="absolute bottom-6 right-10 text-[11px] font-black uppercase tracking-widest" style={{ color: '#334155' }}>
        Report Page {pageNo} of 3
      </div>
    </div>
  );
}

function ReportHeader({ b }: { b: any }) {
  return (
    <div className="grid grid-cols-[1fr_2.3fr_1.2fr] border-2 border-black mb-0 overflow-hidden" style={{ height: '76px' }}>
      <div className="flex items-center justify-center border-r-2 border-black px-2 bg-white">
        <img src={logoUrl} alt="Paragon" style={{ maxWidth: '100%', maxHeight: 64, objectFit: 'contain' }} />
      </div>
      <div className="py-1 px-2 text-center border-r-2 border-black flex flex-col justify-center bg-white">
        <div className="font-black text-2xl uppercase text-black leading-tight mb-0.5">TEST REPORT</div>
        <div className="font-black text-[16px] uppercase tracking-wide" style={{ color: '#334155' }}>EMITTERS (IS :13487-2024)</div>
      </div>
      <div className="flex flex-col text-[11px]" style={{ backgroundColor: '#f8fafc' }}>
        <div className="h-[36px] flex items-center justify-between px-3 border-b-2 border-black">
          <span className="font-bold uppercase text-[10px] whitespace-nowrap mr-2" style={{ color: '#64748b' }}>Size :</span>
          <span className="font-black text-black text-[13px] whitespace-nowrap">{b.size ? (b.size.toUpperCase().includes("LPH") ? b.size : `${b.size} LPH`) : ""}</span>
        </div>
        <div className="h-[36px] flex items-center justify-between px-3">
          <span className="font-bold uppercase text-[10px] whitespace-nowrap mr-2" style={{ color: '#64748b' }}>Test Date :</span>
          <span className="font-black text-black text-[13px] whitespace-nowrap">{b.dateOfTest}</span>
        </div>
      </div>
    </div>
  );
}

function IdentityTable({ b }: { b: any }) {
  return (
    <div className="grid grid-cols-2 border-x-2 border-b-2 border-black text-[13px]">
      <div className="border-r-2 border-black">
        <div className="flex border-b-2 border-black h-7 items-center">
          <div className="w-40 p-1 font-bold text-right pr-3 uppercase text-[10px]" style={{ color: '#475569' }}>Date of Mfg. :</div>
          <div className="p-1 font-black text-black">{b.dateOfMfg}</div>
        </div>
        <div className="flex border-b-2 border-black h-7 items-center">
          <div className="w-40 p-1 font-bold text-right pr-3 uppercase text-[10px]" style={{ color: '#475569' }}>Batch No. :</div>
          <div className="p-1 font-black text-black">{b.batchNo}</div>
        </div>
        <div className="flex h-7 items-center">
          <div className="w-40 p-1 font-bold text-right pr-3 uppercase text-[10px]" style={{ color: '#475569' }}>Mfg Qty.(No) :</div>
          <div className="p-1 font-black text-black">{b.qtyOfProduction}</div>
        </div>
      </div>
      <div>
        <div className="flex border-b-2 border-black h-7 items-center">
          <div className="w-48 p-1 font-bold text-right pr-3 uppercase text-[10px]" style={{ color: '#475569' }}>Brand Name :</div>
          <div className="p-1 font-black text-black">{b.className}</div>
        </div>
        <div className="flex border-b-2 border-black h-7 items-center">
          <div className="w-48 p-1 font-bold text-right pr-3 uppercase text-[10px]" style={{ color: '#475569' }}>Type & Category :</div>
          <div className="p-1 font-black text-black">{b.category}</div>
        </div>
        <div className="flex h-7 items-center">
          <div className="w-48 p-1 font-bold text-right pr-3 uppercase text-[10px]" style={{ color: '#475569' }}>Nominal Test Pressure :</div>
          <div className="p-1 font-black text-black">{String(b.discharge).replace(/KG\/CM2/gi, '').trim()} kg/cm²</div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, separated }: { title: string, separated?: boolean }) {
  return (
    <div className="section-bar" style={{ 
      border: "2px solid black",
      borderBottom: separated ? "2px solid black" : "none",
      backgroundColor: "#dcfce7",
      padding: "5px 12px 11px 12px",
      fontSize: "12px",
      fontWeight: "900",
      width: "100%",
      boxSizing: "border-box",
      marginBottom: separated ? "6px" : "0px",
      zIndex: 10,
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-start',
      lineHeight: '1',
      minHeight: '32px'
    }}>
      {title}
    </div>
  );
}
