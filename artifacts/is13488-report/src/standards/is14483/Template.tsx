import React from "react";
import type { ReportData } from "@/lib/types";
import { ParagonLogo } from "../is13488/Logo";

export default function Template({ data, isExporting = false, customHeaders }: { data: ReportData, isExporting?: boolean, customHeaders?: Record<string, string> }) {
  const { basicInfo } = data;
  
  const hydrostatic = data.is14483_hydrostatic || Array(8).fill("Confirmed");
  const perfA = data.is14483_performanceA || [];
  const perfB = data.is14483_performanceB || [];
  const dropA = data.is14483_pressureDropA || [];
  const dropB = data.is14483_pressureDropB || [];

  const renderPerformanceTable = (titleLabel: string, perfData: typeof perfA, dropData: typeof dropA) => (
    <>
      <tr className="border-b border-black break-inside-avoid">
        <td className="border-r border-black font-bold text-center p-1 align-top">{titleLabel}</td>
        <td colSpan={4} className="p-0">
          <div className="font-bold border-b border-black pt-0 pb-[9.5px] px-2 text-left text-[14px]" style={{ backgroundColor: '#f3f4f6' }}>6.2 & 6.2.1: Performance Test</div>
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="text-[12px]">
                <th className="border-r border-b border-black p-[2px] font-normal w-8" rowSpan={2}>Sr.no</th>
                <th className="border-r border-b border-black p-[2px] font-normal w-24" colSpan={2}>Pressure (kg/cm²)</th>
                <th className="border-r border-b border-black p-[2px] font-normal" rowSpan={2}>declared motive<br/>flow<br/>(litre/hour)</th>
                <th className="border-r border-b border-black p-[2px] font-normal" rowSpan={2}>observed motive<br/>flow<br/>(litre/hour)</th>
                <th className="border-r border-b border-black p-[2px] font-normal" rowSpan={2}>% change<br/>motive flow</th>
                <th className="border-r border-b border-black p-[2px] font-normal" rowSpan={2}>declared water<br/>suction<br/>(litre/hour)</th>
                <th className="border-r border-b border-black p-[2px] font-normal" rowSpan={2}>observed water<br/>suction<br/>(litre/hour)</th>
                <th className="border-b border-black p-[2px] font-normal" rowSpan={2}>% change water<br/>suction</th>
              </tr>
              <tr className="text-[12px]">
                <th className="border-r border-b border-black p-[2px] font-normal w-12">inlet</th>
                <th className="border-r border-b border-black p-[2px] font-normal w-12">outlet</th>
              </tr>
            </thead>
            <tbody>
              {perfData.map((row, i) => {
                const getPercentChange = (observed: number, declared: number): string => {
                  if (declared <= 0) return "0.00";
                  const pct = ((observed - declared) / declared) * 100;
                  if (pct > 0) return `+${pct.toFixed(2)}`;
                  if (pct < 0) return `${pct.toFixed(2)}`;
                  return "0.00";
                };
                
                const motiveDiffStr = getPercentChange(row.observedMotive, row.declaredMotive);
                const suctionDiffStr = getPercentChange(row.observedSuction, row.declaredSuction);
                
                return (
                  <tr key={i} className="border-b border-black">
                    <td className="border-r border-black p-[2px]">{i + 1}</td>
                    <td className="border-r border-black p-[2px]">{row.inlet.toFixed(2)}</td>
                    <td className="border-r border-black p-[2px]">{row.outlet.toFixed(2)}</td>
                    <td className="border-r border-black p-[2px]">{row.declaredMotive}</td>
                    <td className="border-r border-black p-[2px]">{row.observedMotive}</td>
                    <td className="border-r border-black p-[2px]">{motiveDiffStr}</td>
                    <td className="border-r border-black p-[2px]">{row.declaredSuction}</td>
                    <td className="border-r border-black p-[2px]">{row.observedSuction}</td>
                    <td className="p-[2px]">{suctionDiffStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="font-normal text-left pt-0 pb-[9.5px] px-2 border-b border-black text-[14px]">
            6.2.1(ii) Minimum Pressure drop at which liquid fluid is drawn through suction port in relation to inlet pressure specified by manufacturer.
          </div>
          <table className="w-full text-center border-collapse">
            <tbody>
              <tr className="border-b border-black">
                <td className="border-r border-black p-[2px] text-left w-[40%]">Inlet Pressure (kg/cm²)</td>
                {dropData.map((d, i) => <td key={i} className={`p-[2px] ${i < dropData.length - 1 ? 'border-r border-black' : ''}`}>{d.inlet.toFixed(2)}</td>)}
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-[2px] text-left">Declared min. Pressure drop (kg/cm²)</td>
                {dropData.map((d, i) => <td key={i} className={`p-[2px] ${i < dropData.length - 1 ? 'border-r border-black' : ''}`}>{d.declaredDrop.toFixed(2)}</td>)}
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-[2px] text-left">Actual Pressure drop (kg/cm²)</td>
                {dropData.map((d, i) => <td key={i} className={`p-[2px] ${i < dropData.length - 1 ? 'border-r border-black' : ''}`}>{d.actualDrop.toFixed(2)}</td>)}
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-[2px] text-left">Difference Observed</td>
                {dropData.map((_, i) => <td key={i} className={`p-[2px] ${i < dropData.length - 1 ? 'border-r border-black' : ''}`}>0</td>)}
              </tr>
              <tr>
                <td className="border-r border-black p-[2px] text-left">Difference Observed (%)</td>
                {dropData.map((_, i) => <td key={i} className={`p-[2px] ${i < dropData.length - 1 ? 'border-r border-black' : ''}`}>0</td>)}
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </>
  );

  const ReportHeader = (
    <thead className="table-header-group">
      <tr>
        <td colSpan={5} className="p-0 border-b-2 border-black">
          {/* Header Grid using Table for better print stability */}
          <table className="w-full border-b border-black text-center">
            <tbody>
              <tr>
                <td className="w-[200px] border-r border-black p-1 align-middle">
                  <ParagonLogo className="h-12 mx-auto" />
                </td>
                <td className="border-r border-black p-1 align-middle">
                  <h1 className="text-[19px] font-bold tracking-wide whitespace-nowrap">TEST REPORT - VENTURI INJECTOR</h1>
                  <div className="font-bold text-[14px] whitespace-nowrap mt-1">(As per IS 14483 (Part-1):1997 with Amnd. No.2)</div>
                </td>
                <td className="w-[280px] p-0 align-middle">
                  <table className="w-full h-full text-left text-[13px]">
                    <tbody>
                      <tr className="border-b border-black h-[24px]">
                        <td className="w-[120px] p-1 border-r border-black pl-2">Manufacturing Date :</td>
                        <td className="p-1 text-center">{basicInfo.dateOfMfg}</td>
                      </tr>
                      <tr className="h-[24px]">
                        <td className="w-[120px] p-1 border-r border-black pl-2">Test Date :</td>
                        <td className="p-1 text-center">{basicInfo.dateOfTest}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Sub-header text */}
          <div className="text-center pt-0 pb-[9.5px] border-b border-black">
            <div className="font-bold uppercase underline text-[13px]">FACTORY TEST REPORT</div>
          </div>

          {/* Sample Details */}
          <div className="grid grid-cols-2 gap-y-1 pt-0 pb-[9.5px] px-1 font-bold text-[13px] border-b border-black">
            <div className="pl-16">Name of the sample : Venturi Injector</div>
            <div>Grade/Variety/Type/Size/Class : {basicInfo.size}</div>
            <div className="pl-16">Qty. of Production : {basicInfo.qtyOfProduction}</div>
            <div className="flex justify-between pr-4">
              <span>Model : {basicInfo.category || "V1"}</span>
              <span>Batch No. : {basicInfo.batchNo}</span>
            </div>
          </div>
        </td>
      </tr>
      {/* Table Column Headers */}
      <tr className="border-b border-black text-center font-bold items-center">
        <td className="border-r border-black p-1 w-[60px]">Sr. No.</td>
        <td className="border-r border-black p-1 w-[60px]">Cl.No.</td>
        <td className="border-r border-black p-1">Tests</td>
        <td className="border-r border-black p-1 w-[200px]">No of sample</td>
        <td className="p-1 w-[200px]">Result</td>
      </tr>
    </thead>
  );

  return (
    <div className={`print-area ${isExporting ? "" : "flex flex-col gap-8 items-center py-8"}`} style={isExporting ? {} : { backgroundColor: '#f1f5f9' }}>
      {/* Page 1 */}
      <div className={`report-page w-[1123px] h-[794px] overflow-hidden bg-white text-black py-4 px-6 font-sans text-[14px] leading-tight print-landscape flex flex-col relative shrink-0 ${!isExporting ? 'shadow-lg' : ''}`}>
        <table className="w-full border-2 border-black border-collapse">
          {ReportHeader}
          <tbody>
            {/* Row 1: Constructional requirement */}
            <tr className="border-b border-black">
              <td className="border-r border-black font-bold text-center p-1 w-[60px]">1</td>
              <td className="border-r border-black font-bold text-center p-1 w-[60px]">5.0</td>
              <td className="border-r border-black font-bold text-center p-1">Constructional requirement</td>
              <td className="border-r border-black text-center p-1 w-[200px]">Each venturi injector</td>
              <td className="text-center p-1 w-[200px]">{data.visualAppearance}</td>
            </tr>

            {/* Row 2: Resistance to Internal Hydrostatic Pressure */}
            <tr className="border-b border-black">
              <td className="border-r border-black font-bold text-center p-1 align-top">2</td>
              <td className="border-r border-black font-bold text-center p-1 align-top">6.1</td>
              <td colSpan={3} className="p-0">
                <div className="font-bold text-center pt-0 pb-[9.5px] border-b border-black text-[14px]">
                  Resistance of Venturi to Internal Hydrostatic Pressure
                </div>
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="border-b border-black text-[13px] font-normal">
                      <th className="border-r border-black p-[2px] font-normal">sample number</th>
                      <th className="border-r border-black p-[2px] font-normal">Result</th>
                      <th className="border-r border-black p-[2px] font-normal">sample number</th>
                      <th className="p-[2px] font-normal">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3].map(i => (
                      <tr key={i} className={i < 3 ? "border-b border-black" : ""}>
                        <td className="border-r border-black p-[2px]">{i + 1}</td>
                        <td className="border-r border-black p-[2px] font-bold">{hydrostatic[i]}</td>
                        <td className="border-r border-black p-[2px]">{i + 5}</td>
                        <td className="p-[2px] font-bold">{hydrostatic[i + 4]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Row 3(A): Performance Test A */}
            {renderPerformanceTable("3(A)", perfA, dropA)}
          </tbody>
        </table>
        
        <div className="absolute bottom-4 left-6 right-6 flex justify-between text-[13px]" style={{ color: '#6b7280' }}>
          <span>{basicInfo.mcNo}</span>
          <span>Page 1 of 2</span>
        </div>
      </div>

      {/* Page 2 */}
      <div className={`report-page w-[1123px] h-[794px] overflow-hidden bg-white text-black py-4 px-6 font-sans text-[14px] leading-tight print-landscape flex flex-col relative shrink-0 ${!isExporting ? 'shadow-lg' : ''}`}>
        <table className="w-full border-2 border-black border-collapse">
          {ReportHeader}
          <tbody>
            {/* Row 3(B): Performance Test B */}
            {renderPerformanceTable("3(B)", perfB, dropB)}
          </tbody>
        </table>
        
        {/* Footer Signatures */}
        <div className="absolute bottom-12 left-10 right-10 flex justify-between font-bold text-[14px]">
          <div>Checked By.</div>
        </div>
        
        <div className="absolute bottom-4 left-6 right-6 flex justify-between text-[13px]" style={{ color: '#6b7280' }}>
          <span>{basicInfo.mcNo}</span>
          <span>Page 2 of 2</span>
        </div>
      </div>
    </div>
  );
}
