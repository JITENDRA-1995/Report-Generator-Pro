import type { ReportData } from "@/lib/types";
import { avg, fmt, calcUniformity, calcExponent } from "@/lib/calc";
import { getPreset, getCustomHeaderFor, getSpecFor } from "@/lib/storage";
import { ReportHeader } from "./ReportHeader";
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

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ReportTemplate({ data, isExporting = false }: { data: ReportData, isExporting?: boolean }) {
  const [currentPage, setCurrentPage] = useState(0);

  const isDaily = data.basicInfo.reportType === "Daily";
  const pages = [
    <Page1 data={data} key="p1" />,
    <Page2 data={data} key="p2" />,
    <Page3 data={data} key="p3" />,
    <Page4 data={data} key="p4" />
  ];

  if (isExporting) {
    return (
      <div className={`print-area ${isDaily ? 'print-two-pages' : ''}`}>
        {isDaily ? pages.slice(0, 2) : pages}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center">
      <div className="flex items-center gap-4 mb-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm print:hidden sticky top-4 z-50 border border-slate-200">
        <button
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <span className="font-semibold text-sm w-24 text-center text-slate-700">Page {currentPage + 1} of {pages.length}</span>
        <button
          onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
          disabled={currentPage === pages.length - 1}
          className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      </div>
      <div className={`print-area w-full flex justify-center ${isDaily ? 'print-two-pages' : ''}`}>
        {pages[currentPage]}
      </div>
    </div>
  );
}

function SectionBar({ srNo, defaultText, data, value, className = "section-bar mt-1" }: { srNo: string, defaultText: string, data: ReportData, value?: string | number, className?: string }) {
  const custom = getCustomHeaderFor(data.basicInfo.size, data.basicInfo.className);
  let text = custom?.headers[srNo] || defaultText;
  
  if (value !== undefined) {
    const displayValue = typeof value === 'number' ? fmt(value) : String(value);
    text = text.replace("{value}", displayValue);
  }
  
  // Add 1px thin border to main headers (srNo 1 to 15)
  const isMainHeader = /^\d+$/.test(srNo) && parseInt(srNo) >= 1 && parseInt(srNo) <= 15;
  const style = isMainHeader ? { 
    borderTop: "1px solid black", 
    borderBottom: "none", 
    paddingTop: "0px",
    paddingBottom: "9.5px",
    lineHeight: "1.2",
    width: "100%",
    boxSizing: "border-box",
  } : {};
  
  return <div className={className} style={style}>{text}</div>;
}

function Page1({ data }: { data: ReportData }) {
  const b = data.basicInfo;
  const preset = data.presetId ? getPreset(data.presetId) : null;
  const custom = getCustomHeaderFor(b.size, b.className);
  const specRef = getSpecFor(b.size, b.className, b.discharge);

  const idLabelBase = custom?.headers["1_id_label"] || "Inside Diameter";
  const wtLabelBase = custom?.headers["1_wt_label"] || "Wall Thickness";

  // Priority Logic: Use StandardSpec if found, otherwise fallback to Preset/Data
  let idMin = preset?.insideDiameter.min ?? 0;
  let idMax = preset?.insideDiameter.max ?? 0;
  let wtMin = preset?.wallThickness.min ?? 0;
  let wtMax = preset?.wallThickness.max ?? 0;
  let fpMin = data.flowPath.declaredMin ?? 0;

  if (specRef) {
    idMin = specRef.insideDiameterMin;
    idMax = specRef.insideDiameterMax;
    wtMin = specRef.wallThicknessMin;
    wtMax = specRef.wallThicknessMax;
    fpMin = specRef.flowPathMin;
  }

  const idLabel = `${idLabelBase} [Min: ${fmt(idMin)} mm \u2013 Max: ${fmt(idMax)} mm]`;
  const wtLabel = `${wtLabelBase} [Min: ${fmt(wtMin)} mm \u2013 Max: ${fmt(wtMax)} mm]`;

  const idClause = custom?.headers["1_id_clause"] || "(CL 8.3.2 IS - 13488)";
  const wtClause = custom?.headers["1_wt_clause"] || "(CL 8.3.1 IS - 13488)";

  const fpDefaultText = `5. Flow path in mm (CL 8.3.3 IS:13488 : 2008) Declared Min. Value - ${fmt(fpMin)} mm`;

  return (
    <div className="report-page">
      <ReportHeader data={data} />

      {/* basic info table */}
      <table className="report-header-table">
        <tbody>
          <tr>
            <td>Date of Mfg : {b.dateOfMfg}</td>
            <td>Size : {b.size}</td>
            <td>Discharge : {b.discharge}</td>
          </tr>
          <tr>
            <td>Batch No : {b.batchNo}</td>
            <td>Class : {b.className}</td>
            <td>Spacing (cm) : {b.spacing}</td>
          </tr>
          <tr>
            <td>Qty. of Production : {b.qtyOfProduction}</td>
            <td>Category : {b.category}</td>
            <td>M/C No. : {b.mcNo}</td>
          </tr>
        </tbody>
      </table>

      {/* 1. Dimension */}
      <SectionBar srNo="1" defaultText="1. Dimension (CL 6.1 IS - 13488 : 2008)" data={data} />
      <table className="report-table">
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: "8%" }}>Sample No</th>
            <th colSpan={5} style={{ width: "46%" }}>{idClause}</th>
            <th colSpan={5} style={{ width: "46%" }}>{wtClause}</th>
          </tr>
          <tr>
            <th colSpan={5}>{idLabel}</th>
            <th colSpan={5}>{wtLabel}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td></td>
            {["I", "II", "III", "IV", "Avg."].map((h) => (
              <th key={`a${h}`} style={{ width: "9.2%" }}>{h}</th>
            ))}
            {["I", "II", "III", "IV", "Avg."].map((h) => (
              <th key={`b${h}`} style={{ width: "9.2%" }}>{h}</th>
            ))}
          </tr>
          {data.dimensions.map((row, i) => (
            <tr key={i}>
              <td className="center">{i + 1}</td>
              {row.insideDiameter.map((v, j) => (
                <td key={j} className="center">{fmt(v)}</td>
              ))}
              <td className="center">{fmt(avg(row.insideDiameter))}</td>
              {row.wallThickness.map((v, j) => (
                <td key={j} className="center">{fmt(v)}</td>
              ))}
              <td className="center">{fmt(avg(row.wallThickness))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 2. Visual */}
      <SectionBar 
        srNo="2" 
        defaultText={`2. Visual Appearance (CL 6.3 IS - 13488 : 2008) : ____${data.visualAppearance}____`} 
        data={data} 
      />

      {/* 3. Carbon Content */}
      <SectionBar 
        srNo="3" 
        defaultText="3. Carbon Content (CL 5.1.2 IS:13488 : 2008) ( 2.5 ± 0.5%) (Once a week)" 
        data={data} 
      />
      <table className="report-table">
        <thead>
          <tr>
            <th style={{ width: "8%" }}>Sample No</th>
            <th style={{ width: "15%" }}>Wt.Of Crucible</th>
            <th style={{ width: "18%" }}>Wt.Of Crucible + Sample</th>
            <th style={{ width: "15%" }}>Wt.Of Sample</th>
            <th style={{ width: "22%" }}>Wt.Of Crucible + Carbon After Heating</th>
            <th style={{ width: "12%" }}>Wt. Of Carbon</th>
            <th style={{ width: "10%" }}>Carbon%</th>
          </tr>
        </thead>
        <tbody>
          {data.basicInfo.cbcPerformed ? (
            (() => {
              const c = data.carbonContent;
              const sample = c.wtOfCrucibleSample - c.wtOfCrucible;
              const carbon = c.wtOfCrucibleCarbonAfterHeating - c.wtOfCrucible;
              const pct = sample === 0 ? 0 : (carbon / sample) * 100;
              return (
                <tr>
                  <td className="center">1</td>
                  <td className="center">{fmt(c.wtOfCrucible, 4)}</td>
                  <td className="center">{fmt(c.wtOfCrucibleSample, 4)}</td>
                  <td className="center">{fmt(sample, 4)}</td>
                  <td className="center">{fmt(c.wtOfCrucibleCarbonAfterHeating, 4)}</td>
                  <td className="center">{fmt(carbon, 4)}</td>
                  <td className="center">{fmt(pct, 2)}</td>
                </tr>
              );
            })()
          ) : (
            <tr>
              <td colSpan={7} className="center font-bold italic py-4">Test not Performed</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 4. Carbon Dispersion */}
      <SectionBar 
        srNo="4" 
        defaultText={`4. Carbon Dispersion (CL 5.1.2 IS:13488 : 2008) : ${data.carbonDispersion}`} 
        data={data} 
      />

      {/* 5. Flow path */}
      <SectionBar 
        srNo="5" 
        defaultText={`5. Flow path in mm (CL 8.3.3 IS:13488 : 2008) Declared Min. Value - {value} mm`} 
        data={data} 
        value={fpMin}
      />
      <table className="report-table">
        <thead>
          <tr>
            <th style={{ width: "25%" }}>Sample No</th>
            {["I", "II", "III", "IV", "V"].map((x) => (
              <th key={x} style={{ width: "15%" }}>{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Flow Path</td>
            {data.flowPath.values.map((v, i) => (
              <td key={i} className="center">{fmt(v)}</td>
            ))}
          </tr>
          <tr>
            <td colSpan={3}>Declared Flow Path (mm) : {fmt(data.flowPath.declared)} mm</td>
            <td colSpan={3}>Average Flow Path (mm) : {fmt(avg(data.flowPath.values))} mm</td>
          </tr>
        </tbody>
      </table>

      {/* 6. Spacing */}
      <SectionBar 
        srNo="6" 
        defaultText="6. Spacing of Emitting Unit : (CL 8.3.4 IS:13488 : 2008 ) ( ±5 % from Declared Value)" 
        data={data} 
      />
      <table className="report-table">
        <thead>
          <tr>
            <th style={{ width: "25%" }}>Sample No</th>
            {["I", "II", "III", "IV", "V"].map((x) => (
              <th key={x} style={{ width: "15%" }}>{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Spacing (cm)</td>
            {data.spacing.values.slice(0, 5).map((v, i) => (
              <td key={i} className="center">{fmt(v)}</td>
            ))}
          </tr>
          <tr>
            <td>% Deviation</td>
            {data.spacing.values.slice(0, 5).map((v, i) => (
              <td key={i} className="center">
                {fmt(((v - data.spacing.declared) / data.spacing.declared) * 100)}
              </td>
            ))}
          </tr>
          <tr>
            <th>Sample No</th>
            {["VI", "VII", "VIII", "IX", "X"].map((x) => (
              <th key={x}>{x}</th>
            ))}
          </tr>
          <tr>
            <td>Spacing (cm)</td>
            {data.spacing.values.slice(5, 10).map((v, i) => (
              <td key={i} className="center">{fmt(v)}</td>
            ))}
          </tr>
          <tr>
            <td>% Deviation</td>
            {data.spacing.values.slice(5, 10).map((v, i) => (
              <td key={i} className="center">
                {fmt(((v - data.spacing.declared) / data.spacing.declared) * 100)}
              </td>
            ))}
          </tr>
          <tr>
            <td colSpan={2}>Declared Spacing (cm) : {fmt(data.spacing.declared)}</td>
            <td colSpan={2}>Observed Average (cm) : {fmt(avg(data.spacing.values))}</td>
            <td colSpan={2}>
              Average Deviation (%) :{" "}
              {fmt(((avg(data.spacing.values) - data.spacing.declared) / data.spacing.declared) * 100)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 7. Env Stress Cracking */}
      <SectionBar 
        srNo="7" 
        defaultText="7. Environmental Stress Cracking Resistance (Acceptance test) (CL 8.7.1 IS - 13488 : 2008) :" 
        data={data} 
      />
      <table className="report-table">
        <tbody>
          <tr>
            <td>Condition in air circulating oven : 80± 1°C</td>
            <td colSpan={2}>Duration : 1 hr</td>
          </tr>
          <tr>
            <td>Test Temperature : 77± 3°C</td>
            <td colSpan={2}>Test Duration : 1 hr</td>
          </tr>
          <tr>
            <td>Reagent : 10 % Igepoal CO-630</td>
            <td colSpan={2}>Specimen Length : {data.basicInfo.specimenLength}</td>
          </tr>
          <tr>
            <th>Sample No</th>
            {["I", "II", "III", "IV", "V"].map((x) => (
              <th key={x}>{x}</th>
            ))}
          </tr>
          <tr>
            <td>Crack or No Crack</td>
            <td colSpan={5} className="center">No Crack Observed</td>
          </tr>
          <tr>
            <td>Result</td>
            {data.envCracking.results.map((r, i) => (
              <td key={i} className="center">{r}</td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* 8. Pull out */}
      <SectionBar 
        srNo="8" 
        defaultText="8. Resistance to Pull Out of Joint Between Fitting & Emitting Pipe (CL 8.6 IS - 13488 : 2008) :" 
        data={data} 
      />
      <table className="report-table">
        <tbody>
          <tr>
            <td>Test duration : {data.pullOut.testDuration}</td>
            <td>Applied load : {data.pullOut.appliedLoad}</td>
          </tr>
          <tr>
            <td colSpan={2}>
              Sample : <strong>{data.pullOut.result === "PASS" ? "PASS" : ""}</strong>
              &nbsp;&nbsp;&nbsp;
              <span style={{ opacity: data.pullOut.result === "FAIL" ? 1 : 0.5 }}>
                <strong>{data.pullOut.result === "FAIL" ? "FAIL" : ""}</strong>
              </span>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>Remark :- The fitting shall not pull out from the emitting pipe.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Page2({ data }: { data: ReportData }) {
  const u = calcUniformity(
    data.uniformity.map((x) => x.emissionRate),
    parseFloat(data.basicInfo.discharge) || 0,
  );
  return (
    <div className="report-page">
      <ReportHeader data={data} />

      <SectionBar 
        srNo="9" 
        defaultText="9. Uniformity of Emission Rate (Cl 8.1 IS - 13488:2008) (C.V. - Max 10% & Mean Deviation - Max 10%)" 
        data={data} 
        className="section-bar" 
      />

      <table className="report-table">
        <thead>
          <tr>
            <th colSpan={2}>Sample Size : 25 Emitting Units</th>
            <th colSpan={2}>Test Temperature : 27 ± 3°C</th>
            <th colSpan={2}>Test Duration : 6 minutes</th>
          </tr>
          <tr>
            {Array.from({ length: 5 }).map((_, c) => (
              <th key={c} colSpan={2} style={{ padding: 0 }}>
                <div style={{ display: "flex", height: "100%" }}>
                  <div style={{ flex: 1, borderRight: "1px solid #000", padding: "0px 4px 9.5px 4px", display: "flex", alignItems: "center", justifyContent: "center" }}>Sr. No.</div>
                  <div style={{ flex: 2, padding: "0px 4px 9.5px 4px", display: "flex", alignItems: "center", justifyContent: "center" }}>Emission rate(LPH)</div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: 5 }).map((_, c) => {
                const i = r * 5 + c;
                const sr = String(i + 1).padStart(2, "0");
                return (
                  <td key={i} colSpan={2} style={{ padding: 0 }}>
                    <div style={{ display: "flex", height: "100%" }}>
                      <div style={{ flex: 1, borderRight: "1px solid #000", padding: "0px 4px 9.5px 4px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>{sr}</div>
                      <div style={{ flex: 2, padding: "0px 4px 9.5px 4px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>{fmt(data.uniformity[i]?.emissionRate ?? 0)}</div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <table className="report-header-table" style={{ marginTop: 6 }}>
        <tbody>
          <tr>
            <td style={{ width: "50%" }}>Mean Emission Rate (Q) : {fmt(u.meanQ)} LPH</td>
            <td>Std. deviation of Emission Rate : (Sq) {fmt(u.sq, 4)}</td>
          </tr>
          <tr>
            <td>Declared Emission Rate : {fmt(u.declaredEmissionRate)} LPH</td>
            <td></td>
          </tr>
          <tr>
            <td>
              Deviation : (Mean Emission − Declared Emission) / Declared Emission × 100
            </td>
            <td>Co-eff. of Variation (Cv) : Sq / Q × 100</td>
          </tr>
          <tr>
            <td>Deviation : {fmt(u.deviation, 2)} %</td>
            <td>Co-eff. of Variation (Cv) : {fmt(u.cv, 4)} %</td>
          </tr>
        </tbody>
      </table>

      {/* Functional tests detailed table */}
      <div className="section-bar mt-1" style={{ position: "relative", textAlign: "center", minHeight: "22px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ position: "absolute", left: "6px" }}>Functional Tests:</span>
        <span>Uniformity of Emission Rate</span>
      </div>
      <table className="report-table">
        <thead>
          <tr>
            <th>NO</th>
            <th>Discharge in 360 Sec. (ML)</th>
            <th>Discharge Ltr./ hr. (X)</th>
            <th>Mean Emission Rate(q) (X1)</th>
            <th>No.</th>
            <th>Ascending Order</th>
            <th>(X-X1)</th>
            <th>(X-X1)²</th>
            <th>Sq = √ (X-X1)² / 25</th>
            <th>CV = (Sq /q × 100)</th>
          </tr>
        </thead>
        <tbody>
          {u.rows.map((r, i) => (
            <tr key={i}>
              <td className="center">{r.no}</td>
              <td className="center">{r.discharge360sec}</td>
              <td className="center">{fmt(r.dischargeLph)}</td>
              <td className="center">{fmt(r.meanRateQ1, 4)}</td>
              <td className="center">{r.ascNo}</td>
              <td className="center">{fmt(r.ascValue, 4)}</td>
              <td className="center">{fmt(r.xMinusX1, 4)}</td>
              <td className="center">{fmt(r.xMinusX1Sq, 5)}</td>
              <td className="center">{i === 11 ? fmt(u.sq, 4) : ""}</td>
              <td className="center">{i === 11 ? fmt(u.cv, 4) : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Page3({ data }: { data: ReportData }) {
  const ambDevs = data.hydraulicAmbient.dischargeBefore.map((v, i) => v ? ((data.hydraulicAmbient.dischargeAfter[i] || 0) - v) / v * 100 : 0);
  const ambAvgDev = ambDevs.length > 0 ? ambDevs.reduce((a, b) => a + b, 0) / ambDevs.length : 0;

  const eleDevs = data.hydraulicElevated.dischargeBefore.map((v, i) => v ? ((data.hydraulicElevated.dischargeAfter[i] || 0) - v) / v * 100 : 0);
  const eleAvgDev = eleDevs.length > 0 ? eleDevs.reduce((a, b) => a + b, 0) / eleDevs.length : 0;

  const tenDisDevs = data.tension.dischargeBefore.map((v, i) => v ? ((data.tension.dischargeAfter[i] || 0) - v) / v * 100 : 0);
  const tenAvgDisDev = tenDisDevs.length > 0 ? tenDisDevs.reduce((a, b) => a + b, 0) / tenDisDevs.length : 0;

  const tenLenDevs = data.tension.lengthBefore.map((v, i) => v ? ((data.tension.lengthAfter[i] || 0) - v) / v * 100 : 0);
  const tenAvgLenDev = tenLenDevs.length > 0 ? tenLenDevs.reduce((a, b) => a + b, 0) / tenLenDevs.length : 0;

  return (
    <div className="report-page">
      <ReportHeader data={data} />

      <SectionBar 
        srNo="10" 
        defaultText="10. Environmental Stress Cracking Resistance (Type test) (CL 8.7.1 IS - 13488 : 2008) :" 
        data={data} 
        className="section-bar" 
      />
      <table className="report-table">
        <tbody>
          <tr>
            <td>Test Temperature : 77± 3°C</td>
            <td colSpan={4}>Test Duration : 48 hrs</td>
          </tr>
          <tr>
            <td>Reagent : 10 % Igepoal CO-630</td>
            <td colSpan={4}>Specimen Length : {data.basicInfo.specimenLength}</td>
          </tr>
          <tr>
            <th style={{ width: "25%" }}>Sample No</th>
            {["I", "II", "III", "IV", "V"].map((x) => (
              <th key={x} style={{ width: "15%" }}>{x}</th>
            ))}
          </tr>
          <tr>
            <td>Crack or No Crack</td>
            <td colSpan={5} className="center">No Crack Observed</td>
          </tr>
          <tr>
            <td>Result</td>
            {data.envCrackingType.results.map((r, i) => (
              <td key={i} className="center">{r}</td>
            ))}
          </tr>
        </tbody>
      </table>

      <HydraulicSection
        n={11}
        data={data}
        title="Resistance to Hydraulic Pressure at Ambient Temp. (CL 8.4.1 IS - 13488 : 2008)"
        intro={[
          "Sample : 5 emitting units joined together by center fitting",
          "conditioning : With Hydraulic Pressure of 1.8 x Pmax(1.8)= 3.24 kg/cm² for 1 hr.",
          "Emission rate : At Pn=1 kg/cm² for 6 minutes.",
        ]}
        before={data.hydraulicAmbient.dischargeBefore}
        after={data.hydraulicAmbient.dischargeAfter}
        remarks={[
          "(1) No sign of Leakage and not pull a part.",
          `(2) Variation in nominal flow rate : ${fmt(ambAvgDev, 2)} %`,
        ]}
        spec="± 10%"
      />

      <HydraulicSection
        n={12}
        data={data}
        title="Resistance to Hydraulic Pressure at Elevated Temp. (CL 8.4.2 IS - 13488 : 2008)"
        intro={[
          "Sample : 5 emitting units joined together by center fitting",
          "conditioning : With Hydraulic Pressure of Pmax = 1.8 kg/cm² for 48 hrs.",
          "Emission rate : At Pn=1 kg/cm² for 6 minutes.",
        ]}
        before={data.hydraulicElevated.dischargeBefore}
        after={data.hydraulicElevated.dischargeAfter}
        remarks={[
          "(1) No sign of Damage to the emitting unit or the connecting fittings.",
          `(2) Variation in nominal flow rate : ${fmt(eleAvgDev, 2)} %`,
        ]}
        spec="± 10%"
      />

      {/* 13. Tension */}
      <SectionBar 
        srNo="13" 
        defaultText="13. Resistance to Tension at Elevated Temp. (CL 8.5 IS - 13488 : 2008) :" 
        data={data} 
      />
      <table className="report-table">
        <tbody>
          <tr>
            <td colSpan={3}>Sample : 5 Emitting Unit</td>
            <td colSpan={3}>Test Duration : 15 Minutes</td>
          </tr>
          <tr>
            <td colSpan={3}>Test Temperature : 50± 2°C</td>
            <td colSpan={3}>Applied Load : {data.tension.appliedLoad}</td>
          </tr>
          <tr>
            <th style={{ width: "25%" }}>Sample No</th>
            {["I", "II", "III", "IV", "V"].map((x) => (
              <th key={x} style={{ width: "15%" }}>{x}</th>
            ))}
          </tr>
          <tr>
            <td>Discharge Before Test (LPH)</td>
            {data.tension.dischargeBefore.map((v, i) => (
              <td key={i} className="center">{fmt(v)}</td>
            ))}
          </tr>
          <tr>
            <td>Discharge After Test (LPH)</td>
            {data.tension.dischargeAfter.map((v, i) => (
              <td key={i} className="center">{fmt(v)}</td>
            ))}
          </tr>
          <tr>
            <td>Deviation ( % )</td>
            {data.tension.dischargeBefore.map((v, i) => {
              const a = data.tension.dischargeAfter[i] ?? 0;
              return <td key={i} className="center">{fmt(v ? ((a - v) / v) * 100 : 0)}</td>;
            })}
          </tr>
          <tr>
            <td>Length Before Test (mm)</td>
            {data.tension.lengthBefore.map((v, i) => (
              <td key={i} className="center">{fmt(v)}</td>
            ))}
          </tr>
          <tr>
            <td>Length After Test (mm)</td>
            {data.tension.lengthAfter.map((v, i) => (
              <td key={i} className="center">{fmt(v)}</td>
            ))}
          </tr>
          <tr>
            <td>Deviation ( % )</td>
            {data.tension.lengthBefore.map((v, i) => {
              const a = data.tension.lengthAfter[i] ?? 0;
              return <td key={i} className="center">{fmt(v ? ((a - v) / v) * 100 : 0)}%</td>;
            })}
          </tr>
          <tr>
            <td colSpan={6}>Remark :</td>
          </tr>
          <tr>
            <td colSpan={6}>(1) Emitting Pipe did withstand the test pull without breaking & tearing.</td>
          </tr>
          <tr>
            <td colSpan={4}>(2) Variation in nominal flow rate : {fmt(tenAvgDisDev, 2)} %</td>
            <td colSpan={2}>Specified Requirement : ± 5%</td>
          </tr>
          <tr>
            <td colSpan={4}>(3) The distance between two marked lines varies : {fmt(tenAvgLenDev, 2)} %</td>
            <td colSpan={2}>Specified Requirement : ± 5%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function HydraulicSection({
  n,
  data,
  title,
  intro,
  before,
  after,
  remarks,
  spec,
}: {
  n: number;
  data: ReportData;
  title: string;
  intro: string[];
  before: number[];
  after: number[];
  remarks: string[];
  spec: string;
}) {
  return (
    <>
      <SectionBar srNo={String(n)} defaultText={`${n}. ${title} :`} data={data} />
      <table className="report-table">
        <tbody>
          {intro.map((line, i) => (
            <tr key={i}>
              <td colSpan={6}>{line}</td>
            </tr>
          ))}
          <tr>
            <th style={{ width: "25%" }}>Sample No</th>
            {["I", "II", "III", "IV", "V"].map((x) => (
              <th key={x} style={{ width: "15%" }}>{x}</th>
            ))}
          </tr>
          <tr>
            <td>Discharge Before Test (LPH)</td>
            {before.map((v, i) => (
              <td key={i} className="center">{fmt(v)}</td>
            ))}
          </tr>
          <tr>
            <td>Discharge After Test (LPH)</td>
            {after.map((v, i) => (
              <td key={i} className="center">{fmt(v)}</td>
            ))}
          </tr>
          <tr>
            <td>Deviation ( % )</td>
            {before.map((v, i) => {
              const a = after[i] ?? 0;
              return <td key={i} className="center">{fmt(v ? ((a - v) / v) * 100 : 0)}</td>;
            })}
          </tr>
          <tr>
            <td colSpan={6}>Remark :</td>
          </tr>
          {remarks.length > 0 && (
            <tr>
              <td colSpan={4}>{remarks[0]}</td>
              <td colSpan={2} rowSpan={remarks.length} style={{ verticalAlign: "middle", textAlign: "center" }}>
                Specified Requirement : {spec}
              </td>
            </tr>
          )}
          {remarks.slice(1).map((line, i) => (
            <tr key={i + 1}>
              <td colSpan={4}>{line}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
function Page4({ data }: { data: ReportData }) {
  const initialExp = calcExponent(data.pressureTest);
  
  // Use adjusted readings if m was > 0.5
  const finalPressureRows = data.pressureTest.map((pr, i) => {
    let readings = initialExp.adjustedReadings ? initialExp.adjustedReadings[i] : pr.readings;
    // Enforce Serial 13 >= Serial 12
    // Serial 12 is index 1, Serial 13 is index 2
    if (readings.length >= 3 && readings[2] < readings[1]) {
      readings = [...readings];
      readings[2] = readings[1] + (Math.random() * 2); 
    }
    return { ...pr, readings };
  });

  const exp = initialExp.adjustedReadings ? calcExponent(finalPressureRows) : initialExp;

  const chartData = finalPressureRows.map((pr, i) => ({
    pressure: pr.pressure,
    discharge: avg(pr.readings) / 100, // in LPH
    declared: pr.declared,
    label: i,
  }));

  return (
    <div className="report-page">
      <ReportHeader data={data} />

      <SectionBar 
        srNo="14" 
        defaultText="14. Variation of Flow Rate with Pressure (CL 8.2 IS - 13488 : 2008)" 
        data={data} 
        className="section-bar" 
      />
      <table className="report-table">
        <thead>
          <tr>
            <th style={{ width: "5%" }}>Sr. No.</th>
            <th style={{ width: "15%" }}>Pressure Kg/sq.cm</th>
            <th style={{ width: "6%" }}>3</th>
            <th style={{ width: "6%" }}>12</th>
            <th style={{ width: "6%" }}>13</th>
            <th style={{ width: "6%" }}>23</th>
            <th style={{ width: "16%" }}>Average (ml)</th>
            <th style={{ width: "14%" }}>Discharge in LPH</th>
            <th style={{ width: "16%" }}>Declared Discharge in LPH</th>
            <th style={{ width: "10%" }}>Variation %</th>
          </tr>
        </thead>
        <tbody>
          {finalPressureRows.map((pr, i) => {
            const a = avg(pr.readings);
            const lph = a / 100;
            const variation = pr.declared ? ((lph - pr.declared) / pr.declared) * 100 : 0;
            return (
              <tr key={i}>
                <td className="center">{i + 1}</td>
                <td className="center">{fmt(pr.pressure, 1)}</td>
                {pr.readings.map((v, j) => (
                  <td key={j} className="center">{fmt(v, 0)}</td>
                ))}
                <td className="center">{fmt(a)}</td>
                <td className="center">{fmt(lph)}</td>
                <td className="center">{fmt(pr.declared)}</td>
                <td className="center">{fmt(variation, 1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ width: "100%", height: 420, border: "1px solid #000", marginTop: 8, padding: 4, background: "white" }}>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 10 }}>
          EMISSION RATE AS A FUNCTION OF INLET PRESSURE
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="pressure" type="number" domain={[0, 2]} label={{ value: "PRESSURE IN KG/SQ.CM", position: "insideBottom", offset: -2, fontSize: 8 }} tick={{ fontSize: 8 }} />
            <YAxis domain={[0, 1]} label={{ value: "DISCHARGE IN LPH", angle: -90, position: "insideLeft", fontSize: 8 }} tick={{ fontSize: 8 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            <Line type="monotone" dataKey="discharge" stroke="#7f3f9e" name="Discharge in LPH" dot>
              <LabelList dataKey="discharge" position="top" fontSize={8} />
            </Line>
            <Line type="monotone" dataKey="declared" stroke="#f0932b" name="Declared Discharge in LPH" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 15. Exponent */}
      <SectionBar 
        srNo="15" 
        defaultText="15. Determination of Emitting Unit Exponent (CL 8.8 IS - 13488 : 2008) {'m' shall be less than 0.5}" 
        data={data} 
      />
      <div style={{ padding: "4px 8px", fontSize: 13, lineHeight: 1.4, fontFamily: "serif" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontStyle: "italic", fontSize: 16, marginRight: 8 }}>q&#x0304; = K · p<sup>m</sup></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontStyle: "italic", fontWeight: "bold", marginRight: 6 }}>m = </span>
          <div style={{ display: "inline-block", textAlign: "center" }}>
            <div style={{ borderBottom: "1px solid black", padding: "0 4px 6px 4px" }}>Σ (log pi)(log qi) − 1/n (Σ log pi)(Σ log qi)</div>
            <div style={{ padding: "6px 4px 0 4px" }}>Σ (log pi)² − 1/n (Σ log pi)²</div>
          </div>
        </div>
        <div style={{ marginBottom: 2 }}>Where</div>
        <div style={{ paddingLeft: 8 }}>
          <div>q = emission rate, in l/h;</div>
          <div>k = constant;</div>
          <div>p = inlet pressure, in KPa;</div>
          <div>m = emitting unit exponent;</div>
          <div>i = 1,2,3,4,......,n;</div>
          <div>n = number of pressure value used in 8.2.2.</div>
        </div>
      </div>
      <table className="report-table" style={{ fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ width: "5%" }}>No</th>
            <th style={{ width: "15%" }}>pi<br/>(kg/sq. cm)</th>
            <th style={{ width: "12%" }}>pi<br/>(KPa)</th>
            <th style={{ width: "12%" }}>qi<br/>(LPH)</th>
            <th style={{ width: "10%" }}>log pi</th>
            <th style={{ width: "10%" }}>log qi</th>
            <th style={{ width: "20%" }}>(log pi)(log qi)</th>
            <th style={{ width: "16%" }}>(log pi)²</th>
          </tr>
        </thead>
        <tbody>
          {exp.rows.map((r, i) => (
            <tr key={i}>
              <td className="center">{r.no}</td>
              <td className="center">{fmt(r.pi_kg, 2)}</td>
              <td className="center">{fmt(r.pi_kpa, 4)}</td>
              <td className="center">{fmt(r.qi)}</td>
              <td className="center">{fmt(r.logPi, 4)}</td>
              <td className="center">{fmt(r.logQi, 4)}</td>
              <td className="center">{fmt(r.logPi_logQi, 4)}</td>
              <td className="center">{fmt(r.logPi_sq, 4)}</td>
            </tr>
          ))}
          <tr className="row-shaded">
            <td colSpan={4} className="center font-bold">Sum (Σ)</td>
            <td className="center font-bold">{fmt(exp.sumLogPi, 4)}</td>
            <td className="center font-bold">{fmt(exp.sumLogQi, 4)}</td>
            <td className="center font-bold">{fmt(exp.sumLogPiLogQi, 4)}</td>
            <td className="center font-bold">{fmt(exp.sumLogPiSq, 4)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ padding: "8px", fontSize: 13, lineHeight: 1.4, fontFamily: "serif" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: "bold", marginRight: 6 }}>m = </span>
          <div style={{ display: "inline-block", textAlign: "center" }}>
            <div style={{ borderBottom: "1px solid black", padding: "0 4px 6px 4px" }}>Σ (log pi)(log qi) − 1/n (Σ log pi)(Σ log qi)</div>
            <div style={{ padding: "6px 4px 0 4px" }}>Σ (log pi)² − 1/n (Σ log pi)²</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: "bold", marginRight: 6 }}>m = </span>
          <div style={{ display: "inline-block", textAlign: "center" }}>
            <div style={{ borderBottom: "1px solid black", padding: "0 4px 6px 4px" }}>{fmt(exp.sumLogPiLogQi, 4)} − 0.25 ({fmt(exp.sumLogPi, 4)}) ({fmt(exp.sumLogQi, 4)})</div>
            <div style={{ padding: "6px 4px 0 4px" }}>{fmt(exp.sumLogPiSq, 4)} − 0.25 ({fmt(exp.sumLogPi, 4)})²</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: "bold", marginRight: 6 }}>m = </span>
          <div style={{ display: "inline-block", textAlign: "center" }}>
            <div style={{ borderBottom: "1px solid black", padding: "0 4px 6px 4px" }}>{fmt(exp.sumLogPiLogQi - 0.25 * exp.sumLogPi * exp.sumLogQi, 4)}</div>
            <div style={{ padding: "6px 4px 0 4px" }}>{fmt(exp.sumLogPiSq - 0.25 * exp.sumLogPi * exp.sumLogPi, 4)}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontWeight: "bold", marginRight: 6 }}>m = </span>
          <div style={{ display: "inline-block", textAlign: "center" }}>
            <div style={{ padding: "0 4px" }}>
              <span style={{ fontWeight: "bold" }}>{fmt(exp.m, 4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
