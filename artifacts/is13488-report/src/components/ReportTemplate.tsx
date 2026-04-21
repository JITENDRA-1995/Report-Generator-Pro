import type { ReportData } from "@/lib/types";
import { avg, fmt, calcUniformity, calcExponent } from "@/lib/calc";
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

export function ReportTemplate({ data }: { data: ReportData }) {
  return (
    <div className="print-area">
      <Page1 data={data} />
      <Page2 data={data} />
      <Page3 data={data} />
      <Page4 data={data} />
    </div>
  );
}

function PageFooter({ pageNo }: { pageNo: number }) {
  return (
    <div className="report-footer">
      <span>IS 13488 TEST REPORT - [FINAL]1</span>
      <span>{pageNo}</span>
      <span>CHECKED BY</span>
    </div>
  );
}

function Page1({ data }: { data: ReportData }) {
  const b = data.basicInfo;
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
      <div className="section-bar mt-1">1. Dimension (CL 6.1 IS - 13488 : 2008)</div>
      <table className="report-table">
        <thead>
          <tr>
            <th rowSpan={2}>Sample No</th>
            <th colSpan={5}>(CL 8.3.2 IS - 13488)</th>
            <th colSpan={5}>(CL 8.3.1 IS - 13488)</th>
          </tr>
          <tr>
            <th colSpan={5}>Inside Diameter in mm</th>
            <th colSpan={5}>Wall Thickness in mm</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td></td>
            {["I", "II", "III", "IV", "Avg."].map((h) => (
              <th key={`a${h}`}>{h}</th>
            ))}
            {["I", "II", "III", "IV", "Avg."].map((h) => (
              <th key={`b${h}`}>{h}</th>
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
      <div className="section-bar mt-1">
        2. Visual Appearance (CL 6.3 IS - 13488 : 2008) :&nbsp;
        <span style={{ fontWeight: 400 }}>____{data.visualAppearance}____</span>
      </div>

      {/* 3. Carbon Content */}
      <div className="section-bar mt-1">
        3. Carbon Content (CL 5.1.2 IS:13488 : 2008) ( 2.5 ± 0.5%) (Once a week)
      </div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Sample No</th>
            <th>Wt.Of Crucible</th>
            <th>Wt.Of Crucible + Sample</th>
            <th>Wt.Of Sample</th>
            <th>Wt.Of Crucible + Carbon After Heating</th>
            <th>Wt. Of Carbon</th>
            <th>Carbon%</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
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
          })()}
        </tbody>
      </table>

      {/* 4. Carbon Dispersion */}
      <div className="section-bar mt-1">
        4. Carbon Dispersion (CL 5.1.2 IS:13488 : 2008) :{" "}
        <span style={{ fontWeight: 400 }}>{data.carbonDispersion}</span>
      </div>

      {/* 5. Flow path */}
      <div className="section-bar mt-1">
        5. Flow path in mm (CL 8.3.3 IS:13488 : 2008) Declared Min. Value -{" "}
        <span style={{ fontWeight: 400 }}>{fmt(data.flowPath.declaredMin)} mm</span>
      </div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Sample No</th>
            {["I", "II", "III", "IV", "V"].map((x) => (
              <th key={x}>{x}</th>
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
            <td colSpan={6}>Declared Flow Path (mm) : {fmt(data.flowPath.declared)} mm</td>
          </tr>
          <tr>
            <td colSpan={6}>Average Flow Path (mm) : {fmt(avg(data.flowPath.values))} mm</td>
          </tr>
        </tbody>
      </table>

      {/* 6. Spacing */}
      <div className="section-bar mt-1">
        6. Spacing of Emitting Unit : (CL 8.3.4 IS:13488 : 2008 ) ( ±5 % from Declared Value)
      </div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Sample No</th>
            {["I", "II", "III", "IV", "V"].map((x) => (
              <th key={x}>{x}</th>
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
            <td colSpan={6}>Declared Spacing (cm) : {fmt(data.spacing.declared)}</td>
          </tr>
          <tr>
            <td colSpan={6}>Observed Average (cm) : {fmt(avg(data.spacing.values))}</td>
          </tr>
          <tr>
            <td colSpan={6}>
              Average Deviation (%) :{" "}
              {fmt(((avg(data.spacing.values) - data.spacing.declared) / data.spacing.declared) * 100)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 7. Env Stress Cracking */}
      <div className="section-bar mt-1">
        7. Environmental Stress Cracking Resistance (Acceptance test) (CL 8.7.1 IS - 13488 : 2008) :
      </div>
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
            <td colSpan={2}>Specimen Length : 150 mm</td>
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
      <div className="section-bar mt-1">
        8. Resistance to Pull Out of Joint Between Fitting & Emitting Pipe (CL 8.6 IS - 13488 : 2008) :
      </div>
      <table className="report-table">
        <tbody>
          <tr>
            <td>Test duration : {data.pullOut.testDuration}</td>
          </tr>
          <tr>
            <td>Applied load : {data.pullOut.appliedLoad}</td>
          </tr>
          <tr>
            <td>
              Sample : <strong>{data.pullOut.result === "PASS" ? "PASS" : ""}</strong>
              &nbsp;&nbsp;&nbsp;
              <span style={{ opacity: data.pullOut.result === "FAIL" ? 1 : 0.5 }}>
                <strong>{data.pullOut.result === "FAIL" ? "FAIL" : "FAIL"}</strong>
              </span>
            </td>
          </tr>
          <tr>
            <td>Remark :- The fitting shall not pull out from the emitting pipe.</td>
          </tr>
        </tbody>
      </table>
      <PageFooter pageNo={1} />
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

      <div className="section-bar">
        9. Uniformity of Emission Rate (Cl 8.1 IS - 13488:2008) (C.V. - Max 10% & Mean Deviation - Max 10%)
      </div>

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
                <div style={{ display: "flex" }}>
                  <div style={{ flex: 1, borderRight: "1px solid #000", padding: "2px 4px" }}>Sr. No.</div>
                  <div style={{ flex: 2, padding: "2px 4px" }}>Emission rate(LPH)</div>
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
                    <div style={{ display: "flex" }}>
                      <div style={{ flex: 1, borderRight: "1px solid #000", padding: "2px 4px", textAlign: "center" }}>{sr}</div>
                      <div style={{ flex: 2, padding: "2px 4px", textAlign: "center" }}>{fmt(data.uniformity[i]?.emissionRate ?? 0)}</div>
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
      <div className="section-bar mt-1" style={{ display: "flex" }}>
        <span style={{ flex: 1 }}>Functional Tests:</span>
        <span style={{ flex: 2, textAlign: "center" }}>Uniformity of Emission Rate</span>
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
      <PageFooter pageNo={2} />
    </div>
  );
}

function Page3({ data }: { data: ReportData }) {
  return (
    <div className="report-page">
      <ReportHeader data={data} />

      <div className="section-bar">
        10. Environmental Stress Cracking Resistance (Type test) (CL 8.7.1 IS - 13488 : 2008) :
      </div>
      <table className="report-table">
        <tbody>
          <tr>
            <td>Test Temperature : 77± 3°C</td>
            <td colSpan={4}>Test Duration : 48 hrs</td>
          </tr>
          <tr>
            <td>Reagent : 10 % Igepoal CO-630</td>
            <td colSpan={4}>Specimen Length : 150 mm</td>
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
            {data.envCrackingType.results.map((r, i) => (
              <td key={i} className="center">{r}</td>
            ))}
          </tr>
        </tbody>
      </table>

      <HydraulicSection
        n={11}
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
          "(2) Variation in nominal flow rate : 0 %",
        ]}
        spec="± 10%"
      />

      <HydraulicSection
        n={12}
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
          "(2) Variation in nominal flow rate : 0 %",
        ]}
        spec="± 10%"
      />

      {/* 13. Tension */}
      <div className="section-bar mt-1">
        13. Resistance to Tension at Elevated Temp. (CL 8.5 IS - 13488 : 2008) :
      </div>
      <table className="report-table">
        <tbody>
          <tr>
            <td>Sample : 5 Emitting Unit</td>
            <td colSpan={4}>Test Duration : 15 Minutes</td>
          </tr>
          <tr>
            <td>Test Temperature : 50± 2°C</td>
            <td colSpan={4}>Applied Load : {data.tension.appliedLoad}</td>
          </tr>
          <tr>
            <td>Specimen Length : 150 mm</td>
            <td colSpan={4}></td>
          </tr>
          <tr>
            <th>Sample No</th>
            {["I", "II", "III", "IV", "V"].map((x) => (
              <th key={x}>{x}</th>
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
            <td colSpan={6}>Remark :</td>
          </tr>
          <tr>
            <td colSpan={6}>(1) Emitting Pipe did withstand the test pull without breaking & tearing.</td>
          </tr>
          <tr>
            <td colSpan={4}>(2) Variation in nominal flow rate : 0 %</td>
            <td colSpan={2}>Specified Requirement : ± 5%</td>
          </tr>
          <tr>
            <td colSpan={4}>
              (3) The distance between two marked lines varies :{" "}
              {fmt(
                avg(
                  data.tension.lengthAfter.map((v, i) => {
                    const b = data.tension.lengthBefore[i] ?? 0;
                    return b ? ((v - b) / b) * 100 : 0;
                  }),
                ),
              )}{" "}
              %
            </td>
            <td colSpan={2}>Specified Requirement : ± 5%</td>
          </tr>
        </tbody>
      </table>
      <PageFooter pageNo={3} />
    </div>
  );
}

function HydraulicSection({
  n,
  title,
  intro,
  before,
  after,
  remarks,
  spec,
}: {
  n: number;
  title: string;
  intro: string[];
  before: number[];
  after: number[];
  remarks: string[];
  spec: string;
}) {
  return (
    <>
      <div className="section-bar mt-1">{n}. {title} :</div>
      <table className="report-table">
        <tbody>
          {intro.map((line, i) => (
            <tr key={i}>
              <td colSpan={6}>{line}</td>
            </tr>
          ))}
          <tr>
            <th>Sample No</th>
            {["I", "II", "III", "IV", "V"].map((x) => (
              <th key={x}>{x}</th>
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
          {remarks.map((line, i) => (
            <tr key={i}>
              <td colSpan={4}>{line}</td>
              {i === 1 ? <td colSpan={2}>Specified Requirement : {spec}</td> : <td colSpan={2}></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Page4({ data }: { data: ReportData }) {
  const exp = calcExponent(data.pressureTest);
  const declaredDischarge = parseFloat(data.basicInfo.discharge) || 0;
  const chartData = data.pressureTest.map((pr, i) => ({
    pressure: pr.pressure,
    discharge: avg(pr.readings) / 100, // in LPH
    declared: declaredDischarge,
    label: i,
  }));

  return (
    <div className="report-page">
      <ReportHeader data={data} />

      <div className="section-bar">
        14. Emission Rate of Emitting Unit as a Function of Inlet Pressure (CL 8.2 IS - 13488 : 2008) :
      </div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th>Pressure Kg/sq.cm</th>
            <th>3</th>
            <th>12</th>
            <th>13</th>
            <th>23</th>
            <th>Average (ml)</th>
            <th>Discharge in LPH</th>
            <th>Declared Discharge in LPH</th>
            <th>Variation %</th>
          </tr>
        </thead>
        <tbody>
          {data.pressureTest.map((pr, i) => {
            const a = avg(pr.readings);
            const lph = a / 100;
            const variation = declaredDischarge ? ((lph - declaredDischarge) / declaredDischarge) * 100 : 0;
            return (
              <tr key={i}>
                <td className="center">{i + 1}</td>
                <td className="center">{fmt(pr.pressure, 1)}</td>
                {pr.readings.map((v, j) => (
                  <td key={j} className="center">{fmt(v, 0)}</td>
                ))}
                <td className="center">{fmt(a)}</td>
                <td className="center">{fmt(lph)}</td>
                <td className="center">{fmt(declaredDischarge)}</td>
                <td className="center">{fmt(variation, 1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ width: "100%", height: 220, border: "1px solid #000", marginTop: 4, padding: 4, background: "white" }}>
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
      <div className="section-bar mt-1">
        15. Determination of Emitting Unit Exponent (CL 8.8 IS - 13488 : 2008) {"{"}'m' shall be less than 0.5{"}"}
      </div>
      <div style={{ padding: "4px 8px", fontSize: 9 }}>
        <div style={{ fontStyle: "italic", marginBottom: 2 }}>
          q&#x0304; = K · p<sup>m</sup>
        </div>
        <div>
          m = [Σ (logpi)(logqi) − 1/n (Σ logpi)(Σ logqi)] / [Σ (logpi)² − 1/n (Σ logpi)²]
        </div>
        <div style={{ marginTop: 2 }}>
          Where: q = emission rate, in l/h; k = constant; p = inlet pressure, in KPa;
          m = emitting unit exponent; i = 1,2,3,4,…,n; n = number of pressure value used in 8.2.2
        </div>
      </div>
      <table className="report-table">
        <thead>
          <tr>
            <th>No</th>
            <th>pi (kg/sq. cm)</th>
            <th>pi (KPa)</th>
            <th>qi (LPH)</th>
            <th>log pi</th>
            <th>log qi</th>
            <th>(log pi)(log qi)</th>
            <th>(log pi)²</th>
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
              <td className="center">{fmt(r.logQi, 0)}</td>
              <td className="center">{fmt(r.logPi_logQi, 4)}</td>
              <td className="center">{fmt(r.logPi_sq, 4)}</td>
            </tr>
          ))}
          <tr className="row-shaded">
            <td colSpan={4} className="center">Sum (Σ)</td>
            <td className="center">{fmt(exp.sumLogPi, 4)}</td>
            <td className="center">{fmt(exp.sumLogQi, 4)}</td>
            <td className="center">{fmt(exp.sumLogPiLogQi, 4)}</td>
            <td className="center">{fmt(exp.sumLogPiSq, 4)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ padding: "6px 4px", fontSize: 9, lineHeight: 1.6 }}>
        <div>m = [Σ (logpi)(logqi) − 1/n (Σ logpi)(Σ logqi)] / [Σ (logpi)² − 1/n (Σ logpi)²]</div>
        <div>m = [{fmt(exp.sumLogPiLogQi, 4)} − 0.25 ({fmt(exp.sumLogPi, 4)}) ({fmt(exp.sumLogQi, 4)})] / [{fmt(exp.sumLogPiSq, 4)} − 0.25 ({fmt(exp.sumLogPi, 4)})²]</div>
        <div>m = [{fmt(exp.sumLogPiLogQi - 0.25 * exp.sumLogPi * exp.sumLogQi, 4)}] / [{fmt(exp.sumLogPiSq - 0.25 * exp.sumLogPi * exp.sumLogPi, 4)}]</div>
        <div>m = {fmt(exp.m, 2)}</div>
      </div>
      <PageFooter pageNo={4} />
    </div>
  );
}
