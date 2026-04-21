import type { ReportData } from "@/lib/types";
import { ParagonLogo } from "./Logo";

export function ReportHeader({ data }: { data: ReportData }) {
  return (
    <table className="report-header-table">
      <tbody>
        <tr>
          <td rowSpan={2} style={{ width: "20%", textAlign: "center" }}>
            <ParagonLogo />
          </td>
          <td className="report-header-title" style={{ width: "50%" }}>
            EMITTING PIPE (IS 13488:2008)
            <br />
            TEST REPORT
          </td>
          <td style={{ width: "15%" }}>Format No:</td>
          <td style={{ width: "15%" }}>{data.basicInfo.formatNo}</td>
        </tr>
        <tr>
          <td colSpan={1}></td>
          <td>Date of Test:</td>
          <td>{data.basicInfo.dateOfTest}</td>
        </tr>
      </tbody>
    </table>
  );
}
