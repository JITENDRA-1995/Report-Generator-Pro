import { ParagonLogo } from "./Logo";
import { getProfile } from "@/lib/storage";

export function ReportHeader({ data }: { data: any }) {
  const profile = getProfile();
  return (
    <table className="report-header-table">
      <tbody>
        <tr style={{ height: "30px" }}>
          <td rowSpan={2} style={{ width: "20%", textAlign: "center", padding: "2px" }}>
            <ParagonLogo />
          </td>
          <td rowSpan={2} className="report-header-title" style={{ width: "50%", padding: "2px", lineHeight: "1.1" }}>
            <div className="font-bold text-lg text-emerald-800">{profile.companyName}</div>
            <div className="text-[10px] text-slate-600 font-medium">{profile.companyAddress}</div>
            <div className="mt-1 font-bold text-slate-800">EMITTING PIPE (IS 13488:2008) TEST REPORT</div>
          </td>
          <td style={{ width: "15%", padding: "2px 6px" }}>Format No:</td>
          <td style={{ width: "15%", padding: "2px 6px" }}>{data.basicInfo.formatNo}</td>
        </tr>
        <tr style={{ height: "30px" }}>
          <td style={{ padding: "2px 6px" }}>Date of Test:</td>
          <td style={{ padding: "2px 6px" }}>{data.basicInfo.dateOfTest}</td>
        </tr>
      </tbody>
    </table>
  );
}
