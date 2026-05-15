import React from "react";
import type { ReportData } from "@/lib/types";
import { avg, fmt, calcUniformity } from "@/lib/calc";
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

  // --- CALCULATIONS FOR UNIFORMITY (Using shared logic) ---
  const lphValues = data.uniformity.map(u => u.dischargeLph || 0).filter(v => v > 0);
  const u = calcUniformity(lphValues, parseFloat(b.size) || 4.0);
  
  const meanQ = u.meanQ;
  const sq = u.sq;
  const cv = u.cv;
  const declaredQ = u.declaredEmissionRate;
  const deviation = u.deviation;

  // --- CHART DATA ---
  const chartData = data.pressureTest.map(row => {
    const rowAvgMl = avg(row.readings);
    return {
      pressure: row.pressure,
      discharge: rowAvgMl / 50, // LPH = ml / 50 (for 180s)
      declared: row.declared,
    };
  });

  // --- CALCULATIONS FOR EXPONENT (Page 3) ---
  const expPoints = data.pressureTest.map(row => {
    const rowAvgMl = avg(row.readings);
    const qi = rowAvgMl / 50; // LPH
    const pi = row.pressure; // kg/cm2
    const piKpa = pi * 100; 
    return {
      pi,
      piKpa,
      qi,
      logPi: Math.log10(piKpa),
      logQi: Math.log10(qi),
      logPiLogQi: Math.log10(piKpa) * Math.log10(qi),
      logPiSq: Math.pow(Math.log10(piKpa), 2)
    };
  });

  const n = expPoints.length;
  const sumLogPi = expPoints.reduce((s, p) => s + p.logPi, 0);
  const sumLogQi = expPoints.reduce((s, p) => s + p.logQi, 0);
  const sumLogPiLogQi = expPoints.reduce((s, p) => s + p.logPiLogQi, 0);
  const sumLogPiSq = expPoints.reduce((s, p) => s + p.logPiSq, 0);

  const m_calc = (sumLogPiLogQi - (1/n) * sumLogPi * sumLogQi) / (sumLogPiSq - (1/n) * Math.pow(sumLogPi, 2));

  return (
    <div className="bg-slate-500 min-h-screen py-8 print:p-0 print:bg-white print-area" id="report-content">
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white; }
          .page-break { page-break-after: always; }
        }
        .report-table th, .report-table td { border: 2px solid #0f172a; padding: 4px; }
        .report-table { border-collapse: collapse; width: 100%; }
        .formula-box { border: 2px solid #0f172a; border-radius: 8px; padding: 1.5rem; background: white; }
      `}</style>

      {/* --- PAGE 1 --- */}
      <Page pageNo={1}>
        <ReportHeader b={b} />
        <IdentityTable b={b} />

        <div className="mt-2">
          <SectionHeader title="[1] Mechanical Tests :" />
          <table className="report-table text-[10px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="w-12">Sr. No</th>
                <th className="w-48">Type of Test</th>
                <th className="w-20">Clause</th>
                <th>Reference Value</th>
                <th className="w-32">Test Result</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-center font-bold">1.1</td>
                <td className="font-bold px-2">Construction and Workmanship</td>
                <td className="text-center">7.1</td>
                <td className="px-2">No manufacturing defects such as grooves, cracks or cavities</td>
                <td className="text-center font-black">{data.visualAppearance || "Satisfactory"}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">1.2</td>
                <td className="font-bold px-2">Flow Paths</td>
                <td className="text-center">7.2</td>
                <td className="p-0">
                  <div className="px-2 border-b-2 border-slate-900 py-1">Min. Declared Flow Path = {fmt(data.flowPath.declaredLimit || 0.8)} mm</div>
                  <div className="grid grid-cols-3 text-center border-b-2 border-slate-900">
                    <div className="border-r-2 border-slate-900 p-1">1</div>
                    <div className="border-r-2 border-slate-900 p-1">2</div>
                    <div className="p-1">3</div>
                  </div>
                  <div className="grid grid-cols-3 text-center">
                    <div className="border-r-2 border-slate-900 p-1 font-black">{fmt(data.flowPath.values[0] || 0)}</div>
                    <div className="border-r-2 border-slate-900 p-1 font-black">{fmt(data.flowPath.values[1] || 0)}</div>
                    <div className="p-1 font-black">{fmt(data.flowPath.values[2] || 0)}</div>
                  </div>
                </td>
                <td className="text-center font-black">
                  {fmt(avg(data.flowPath.values.slice(0,3).filter(v => v > 0)))}
                </td>
              </tr>
              <tr>
                <td className="text-center font-bold">1.3</td>
                <td className="font-bold px-2">Resistance to Hydrostatic Pressure</td>
                <td className="text-center">7.3</td>
                <td className="px-2">No leakage shall occur through the emitter bodies or their connections to the pipe.</td>
                <td className="text-center font-black">{data.hydraulicAmbient.dischargeBefore[0] === 1 ? "Satisfactory" : "Leakage Observed"}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">1.4</td>
                <td className="font-bold px-2">Emitter Pull-Out</td>
                <td className="text-center">7.4</td>
                <td className="px-2">The emitter shall withstand the pulling force without pulling out the pipe wall.</td>
                <td className="text-center font-black">{data.pullOut.result || "Satisfactory"} (40 N for 1 Hour)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-2">
          <SectionHeader title="[2] FUNCTIONAL TESTS :" />
          <table className="report-table text-[10px]">
            <tbody>
              <tr>
                <td rowSpan={2} className="w-12 text-center font-bold">2.1</td>
                <td rowSpan={2} className="w-48 font-bold px-2">Uniformity of Emission Rate</td>
                <td rowSpan={2} className="w-20 text-center">8.1</td>
                <td className="px-2 py-2">
                  The mean emission rate not deviate by more than 5 percent for Category A, not more than 10 percent for Category B
                </td>
                <td rowSpan={2} className="w-36 text-center font-bold bg-slate-50 align-middle">
                  <div className="text-slate-500 text-[9px] mb-1 uppercase">Mean Emission Rate</div>
                  <div className="text-base font-black">{fmt(meanQ)} LPH</div>
                  <div className="mt-2 text-xs">Sq = {fmt(sq, 4)}</div>
                  <div className="text-xs">Cv = {fmt(cv)} %</div>
                  <div className="mt-1 text-xs border-t border-slate-300 pt-1">Deviation : {fmt(deviation)}%</div>
                </td>
              </tr>
              <tr>
                <td className="px-2 py-2">
                  The coefficient of variation(Cv) of the emission rate of the test sample shall not exceed 5 percent for Category A not more than 10 percent for Category B
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="formula-box mt-8">
          <div className="text-[13px] space-y-10 font-medium flex flex-col items-start">
            <div className="flex gap-20 text-[14px]">
              <div>Mean Emission Rate q = <span className="font-black underline mx-2 decoration-2 underline-offset-4">{fmt(meanQ)}</span> LPH</div>
              <div>Declared Emission Rate = <span className="font-black underline mx-2 decoration-2 underline-offset-4">{fmt(declaredQ)}</span> LPH</div>
            </div>
            
            <div className="space-y-6 w-full">
              <div className="grid grid-cols-[280px_auto_1fr] items-center gap-4">
                <div className="text-right">Deviation from Mean Emission Rate =</div>
                <div className="flex flex-col items-center min-w-[240px]">
                  <span className="border-b-2 border-slate-900 w-full text-center px-4 pb-1">Declared Emission - Mean Emission</span>
                  <span className="pt-1">Declared Emission</span>
                </div>
                <div className="pl-4">X 100</div>
              </div>
              
              <div className="grid grid-cols-[280px_auto_1fr] items-center gap-4">
                <div className="text-right">=</div>
                <div className="flex flex-col items-center min-w-[180px]">
                  <span className="border-b-2 border-slate-900 w-full text-center px-4 pb-1">{(declaredQ - meanQ).toFixed(2)}</span>
                  <span className="pt-1">{fmt(declaredQ)}</span>
                </div>
                <div className="pl-4">X 100</div>
              </div>

              <div className="flex justify-center pt-2 w-full max-w-[600px]">
                 <div className="font-black text-[15px] border-2 border-slate-900 px-10 py-3 rounded-lg bg-slate-50 shadow-sm">
                    VARIATION = {fmt(deviation)} %
                 </div>
              </div>
            </div>

            <div className="pt-4 space-y-8 w-full">
              <div className="text-[14px] flex items-center gap-4">
                <span>Std. deviation of Emission Rate Sq = </span>
                <span className="font-black underline decoration-2 underline-offset-4 px-2">{fmt(sq, 4)}</span>
              </div>
              
              <div className="space-y-6 w-full">
                <div className="grid grid-cols-[280px_auto_1fr] items-center gap-4">
                  <div className="text-right">Co-eff. of Variation Cv =</div>
                  <div className="flex flex-col items-center min-w-[180px]">
                    <span className="border-b-2 border-slate-900 w-full text-center px-4 pb-1">Sq x 100</span>
                    <span className="pt-1">q</span>
                  </div>
                  <div className="pl-4"></div>
                </div>
                
                <div className="grid grid-cols-[280px_auto_1fr] items-center gap-4">
                  <div className="text-right">CV =</div>
                  <div className="flex flex-col items-center min-w-[220px]">
                    <span className="border-b-2 border-slate-900 w-full text-center px-4 pb-1">{fmt(sq, 4)} x 100</span>
                    <span className="pt-1">{fmt(meanQ)}</span>
                  </div>
                  <div className="pl-4"></div>
                </div>

                <div className="flex justify-center pt-2 w-full max-w-[600px]">
                   <div className="font-black text-[16px] border-2 border-slate-900 px-10 py-3 rounded-lg bg-slate-50 shadow-sm">
                      CV = {fmt(cv)} %
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
        <div className="mt-4">
           <SectionHeader title="2.2 Uniformity Table (Clause 8.1 continued)" />
           <table className="report-table text-[10px]">
             <thead>
               <tr className="bg-slate-100 h-10">
                 <th className="w-8">NO</th>
                 <th className="w-20">Discharge LPH (X)</th>
                 <th className="w-24">Discharge 180s (ml)</th>
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
                 const mlVal = row.dischargeInSecs || (x > 0 ? x * 50 : 0);
                 const diff = x > 0 ? (x - meanQ) : 0;
                 const diffSq = Math.pow(diff, 2);
                 
                 const calcRow = u.rows[i];
                 const ascX = calcRow?.ascValue || 0;
                 const ascSrNo = calcRow?.ascNo || (i + 1);

                 return (
                   <tr key={i} className="text-center" style={{ height: '34px' }}>
                     <td className="font-bold text-slate-400">{i + 1}</td>
                     <td className="font-black">{x > 0 ? fmt(x, 3) : ""}</td>
                     <td>{mlVal > 0 ? mlVal.toFixed(1) : ""}</td>
                     {i === 0 && (
                       <td rowSpan={25} className="font-bold align-middle text-center bg-slate-50 border-2 border-slate-900">
                         {fmt(meanQ, 3)}
                       </td>
                     )}
                     <td className="font-bold text-slate-400">{ascX > 0 ? ascSrNo : ""}</td>
                     <td className="bg-slate-50">{ascX > 0 ? fmt(ascX, 3) : ""}</td>
                     <td>{x > 0 ? fmt(diff, 4) : ""}</td>
                     <td>{x > 0 ? fmt(diffSq, 6) : ""}</td>
                     {i === 0 && (
                       <td rowSpan={25} className="font-black align-middle text-center bg-slate-50 border-2 border-slate-900">
                         {fmt(sq, 4)}
                       </td>
                     )}
                     {i === 0 && (
                       <td rowSpan={25} className="font-black align-middle text-center bg-slate-50 border-2 border-slate-900">
                         {fmt(cv, 3)}
                       </td>
                     )}
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
          <SectionHeader title="2.2 Emission Rate as Function of Inlet Pressure (Clause 8.2)" />
          <table className="report-table text-[10px]">
            <thead>
              <tr className="bg-slate-100">
                <th rowSpan={2} className="w-12">NO</th>
                <th rowSpan={2} className="w-24">Pressure (kg/cm²)</th>
                <th colSpan={4}>Discharge from Emitter (ml)</th>
                <th rowSpan={2} className="w-20">Average (ml)</th>
                <th rowSpan={2} className="w-20">Discharge (LPH)</th>
                <th rowSpan={2} className="w-20">Declared (LPH)</th>
                <th rowSpan={2} className="w-20">Variation %</th>
              </tr>
              <tr className="bg-slate-50">
                <th className="w-12">R1</th>
                <th className="w-12">R2</th>
                <th className="w-12">R3</th>
                <th className="w-12">R4</th>
              </tr>
            </thead>
            <tbody>
              {data.pressureTest.map((row, i) => {
                const rowAvgMl = avg(row.readings);
                const actualLph = rowAvgMl / 50;
                const varPct = row.declared ? ((actualLph - row.declared) / row.declared) * 100 : 0;
                return (
                  <tr key={i} className="text-center h-8">
                    <td className="font-bold text-slate-400">{i + 1}</td>
                    <td className="font-black">{fmt(row.pressure, 1)}</td>
                    <td>{fmt(row.readings[0] || 0, 1)}</td>
                    <td>{fmt(row.readings[1] || 0, 1)}</td>
                    <td>{fmt(row.readings[2] || 0, 1)}</td>
                    <td>{fmt(row.readings[3] || 0, 1)}</td>
                    <td className="bg-slate-50 font-bold">{fmt(rowAvgMl, 1)}</td>
                    <td className="font-black text-indigo-700">{fmt(actualLph)}</td>
                    <td className="text-slate-500">{fmt(row.declared)}</td>
                    <td className={`font-black ${Math.abs(varPct) > 7 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {fmt(varPct)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* CHART SECTION - Matched to IS 13488 Style */}
        <div style={{ width: "100%", height: 420, border: "2px solid #0f172a", marginTop: 8, padding: 4, background: "white" }}>
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
          <SectionHeader title="2.3 Determination of Emitter Exponent (8.3)" />
          
          <div className="border-2 border-slate-900 p-4 font-serif text-[12px] leading-relaxed bg-slate-50 rounded-lg">
            <div className="flex items-center mb-2 italic text-lg">
              <span className="font-black text-slate-800">q = K &middot; p<sup>m</sup></span>
            </div>
            <div className="flex items-center mb-4 italic">
              <span className="font-bold mr-2 text-slate-700">m = </span>
              <div className="inline-block text-center align-middle">
                <div className="border-b border-slate-900 px-4 py-1">Σ (log p<sub>i</sub>)(log q<sub>i</sub>) &minus; (1/n) (Σ log p<sub>i</sub>)(Σ log q<sub>i</sub>)</div>
                <div className="pt-1">Σ (log p<sub>i</sub>)<sup>2</sup> &minus; (1/n) (Σ log p<sub>i</sub>)<sup>2</sup></div>
              </div>
            </div>
            <div className="grid grid-cols-2 text-[10px] font-sans text-slate-500 font-medium">
              <div>
                q = emission rate, in l/h;<br/>
                k = constant;<br/>
                p = inlet pressure, in KPa;
              </div>
              <div>
                m = emitting unit exponent;<br/>
                i = 1, 2, 3, ..., n;<br/>
                n = number of pressure values used.
              </div>
            </div>
          </div>

          <table className="report-table text-[10px] mt-1">
            <thead>
              <tr className="bg-slate-100">
                <th className="w-8">No</th>
                <th className="w-20">p<sub>i</sub><br/>(kg/cm²)</th>
                <th className="w-20">p<sub>i</sub><br/>(KPa)</th>
                <th className="w-20">q<sub>i</sub><br/>(LPH)</th>
                <th className="w-16">log p<sub>i</sub></th>
                <th className="w-16">log q<sub>i</sub></th>
                <th className="w-32">(log p<sub>i</sub>)(log q<sub>i</sub>)</th>
                <th className="w-24">(log p<sub>i</sub>)²</th>
              </tr>
            </thead>
            <tbody>
              {expPoints.map((p, i) => (
                <tr key={i} className="text-center h-7">
                  <td className="text-slate-400 font-bold">{i + 1}</td>
                  <td>{fmt(p.pi, 1)}</td>
                  <td>{fmt(p.piKpa, 1)}</td>
                  <td className="font-black text-indigo-700">{fmt(p.qi)}</td>
                  <td>{fmt(p.logPi, 4)}</td>
                  <td>{fmt(p.logQi, 4)}</td>
                  <td>{fmt(p.logPiLogQi, 4)}</td>
                  <td>{fmt(p.logPiSq, 4)}</td>
                </tr>
              ))}
              <tr className="bg-slate-200 font-black h-8">
                <td colSpan={4} className="text-center uppercase tracking-widest text-[9px]">Sum (Σ)</td>
                <td className="text-center">{fmt(sumLogPi, 4)}</td>
                <td className="text-center">{fmt(sumLogQi, 4)}</td>
                <td className="text-center">{fmt(sumLogPiLogQi, 4)}</td>
                <td className="text-center">{fmt(sumLogPiSq, 4)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-1 border-2 border-slate-900 p-5 font-serif text-[12px] space-y-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center">
              <span className="font-bold mr-2 text-slate-700">m = </span>
              <div className="inline-block text-center align-middle">
                <div className="border-b border-slate-900 px-4 pb-1">{fmt(sumLogPiLogQi, 4)} &minus; (1/{n}) ({fmt(sumLogPi, 4)}) ({fmt(sumLogQi, 4)})</div>
                <div className="pt-1">{fmt(sumLogPiSq, 4)} &minus; (1/{n}) ({fmt(sumLogPi, 4)})<sup>2</sup></div>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="font-bold mr-2 text-slate-700">m = </span>
              <div className="inline-block text-center align-middle">
                <div className="border-b border-slate-900 px-6 pb-1">{fmt(sumLogPiLogQi - (1/n) * sumLogPi * sumLogQi, 4)}</div>
                <div className="pt-1">{fmt(sumLogPiSq - (1/n) * Math.pow(sumLogPi, 2), 4)}</div>
              </div>
            </div>

            <div className="flex items-center font-black text-xl text-slate-900 border-l-4 border-slate-900 pl-4 py-1">
              <span className="mr-2">m = </span>
              <span className="underline decoration-4 underline-offset-4">{fmt(m_calc, 4)}</span>
            </div>
          </div>
        </div>
      </Page>
    </div>
  );
}

function Page({ children, pageNo }: { children: React.ReactNode, pageNo: number }) {
  return (
    <div className="report-page w-[210mm] min-h-[297mm] p-[10mm] bg-white shadow-2xl mx-auto mb-8 relative print:m-0 print:shadow-none print:mb-0 page-break overflow-hidden">
      {children}
      <div className="absolute bottom-6 right-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        Report Page {pageNo} of 3
      </div>
    </div>
  );
}

function ReportHeader({ b }: { b: any }) {
  return (
    <div className="grid grid-cols-[1fr_2.5fr_1fr] border-2 border-slate-900 mb-0" style={{ height: '72px' }}>
      <div className="flex items-center justify-center border-r-2 border-slate-900 px-2 bg-white">
        <img src={logoUrl} alt="Paragon" style={{ maxWidth: '100%', maxHeight: 58, objectFit: 'contain' }} />
      </div>
      <div className="p-2 text-center border-r-2 border-slate-900 flex flex-col justify-center bg-white">
        <div className="font-black text-[13px] uppercase tracking-tight text-slate-500 mb-0.5">EMITTERS (IS :13487-2024)</div>
        <div className="font-black text-xl uppercase text-slate-900 leading-tight">TEST REPORT</div>
      </div>
      <div className="flex flex-col text-[11px] bg-slate-50">
        <div className="flex-1 flex items-center justify-between px-3 border-b-2 border-slate-900">
          <span className="font-bold text-slate-500 uppercase text-[9px]">Size :</span>
          <span className="font-black text-slate-900">{b.size}</span>
        </div>
        <div className="flex-1 flex items-center justify-between px-3">
          <span className="font-bold text-slate-500 uppercase text-[9px]">Test Date :</span>
          <span className="font-black text-slate-900">{b.dateOfTest}</span>
        </div>
      </div>
    </div>
  );
}

function IdentityTable({ b }: { b: any }) {
  return (
    <div className="grid grid-cols-2 border-x-2 border-b-2 border-slate-900 text-[11px]">
      <div className="border-r-2 border-slate-900">
        <div className="flex border-b-2 border-slate-900 h-8 items-center">
          <div className="w-40 p-1 font-bold text-right pr-3 text-slate-500 uppercase text-[9px]">Date of Mfg. :</div>
          <div className="p-1 font-black text-slate-900">{b.dateOfMfg}</div>
        </div>
        <div className="flex border-b-2 border-slate-900 h-8 items-center">
          <div className="w-40 p-1 font-bold text-right pr-3 text-slate-500 uppercase text-[9px]">Batch No. :</div>
          <div className="p-1 font-black text-slate-900">{b.batchNo}</div>
        </div>
        <div className="flex h-8 items-center">
          <div className="w-40 p-1 font-bold text-right pr-3 text-slate-500 uppercase text-[9px]">Mfg Qty.(No) :</div>
          <div className="p-1 font-black text-slate-900">{b.qtyOfProduction}</div>
        </div>
      </div>
      <div>
        <div className="flex border-b-2 border-slate-900 h-8 items-center">
          <div className="w-48 p-1 font-bold text-right pr-3 text-slate-500 uppercase text-[9px]">Brand Name :</div>
          <div className="p-1 font-black text-slate-900">{b.className}</div>
        </div>
        <div className="flex border-b-2 border-slate-900 h-8 items-center">
          <div className="w-48 p-1 font-bold text-right pr-3 text-slate-500 uppercase text-[9px]">Type & Category :</div>
          <div className="p-1 font-black text-slate-900">{b.category}</div>
        </div>
        <div className="flex h-8 items-center">
          <div className="w-48 p-1 font-bold text-right pr-3 text-slate-500 uppercase text-[9px]">Nominal Test Pressure :</div>
          <div className="p-1 font-black text-slate-900">{b.discharge} kg/cm²</div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-[#b7c396] text-slate-900 border-2 border-slate-900 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest mb-0 mt-3 shadow-sm">
      {title}
    </div>
  );
}
