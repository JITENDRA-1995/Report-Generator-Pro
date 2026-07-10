import { useState, useRef } from "react";
import { 
  Upload, 
  Download, 
  Check, 
  AlertTriangle, 
  X, 
  ChevronDown, 
  ChevronUp
} from "lucide-react";
import * as XLSX from "xlsx";

const standardSizes: Record<string, string[]> = {
  is13488: ["12mm Cl-2", "16mm CL-1", "16mm Cl-2", "20mm Cl-1"],
  is13487: ["4 LPH", "8 LPH", "14 LPH"],
  is12786: ["12mm Cl-2", "16mm Cl-1", "16mm Cl-2", "20mm Cl-1", "20mm Cl-2", "32mm Cl-2"],
  is4985: [
    "63mm Cl-2", "75mm Cl-2", "75mm Cl-3", "90mm Cl-2", "90mm Cl-3",
    "110mm Cl-2", "110mm Cl-3", "140mm Cl-2", "140mm Cl-3", "160mm Cl-2", "160mm Cl-3"
  ],
  is17425: ["75mm Cl-1", "75mm Cl-2", "90mm Cl-1"],
  is14483: ["V-1\" (25mm)", "V-2\" (50mm)"]
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper to format ISO YYYY-MM-DD to DD/MM/YYYY
const formatDateToDMY = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// Item Mapping logic
const mapItemToStandardAndSize = (itemName: string): { standardId: string; sizeName: string } | null => {
  const name = itemName.trim();
  const nameLower = name.toLowerCase();
  
  // 1. IS 13488 (Emitting Pipe)
  if (nameLower.includes("emitting pipe")) {
    if (nameLower.includes("class i 16") || nameLower.includes("cl-i 16")) {
      return { standardId: "is13488", sizeName: "16mm CL-1" };
    }
    if (nameLower.includes("class ii 16") || nameLower.includes("cl-ii 16") || nameLower.includes("class ii 16 x") || nameLower.includes("class ii 16 x")) {
      return { standardId: "is13488", sizeName: "16mm Cl-2" };
    }
    if (nameLower.includes("class i 20") || nameLower.includes("cl-i 20") || nameLower.includes("class i 20 x") || nameLower.includes("class i 20 x")) {
      return { standardId: "is13488", sizeName: "20mm Cl-1" };
    }
    if (nameLower.includes("class ii 12") || nameLower.includes("cl-ii 12")) {
      return { standardId: "is13488", sizeName: "12mm Cl-2" };
    }
    if (nameLower.includes("12mm")) return { standardId: "is13488", sizeName: "12mm Cl-2" };
    if (nameLower.includes("16mm")) return { standardId: "is13488", sizeName: "16mm Cl-2" };
    if (nameLower.includes("20mm")) return { standardId: "is13488", sizeName: "20mm Cl-1" };
  }

  // 2. IS 12786 (Plain Laterals)
  if (nameLower.includes("plain lateral")) {
    let isCl1 = false;
    let isCl2 = false;

    if (nameLower.includes("2.5kg")) {
      isCl2 = true;
    } else if (nameLower.includes("2.0kg")) {
      isCl1 = true;
    } else {
      isCl1 = /\bcl-i\b/i.test(nameLower) || /\bclass-i\b/i.test(nameLower) || /\bclass i\b/i.test(nameLower) || /\bcl-1\b/i.test(nameLower);
      isCl2 = /\bcl-ii\b/i.test(nameLower) || /\bclass-ii\b/i.test(nameLower) || /\bclass ii\b/i.test(nameLower) || /\bcl-2\b/i.test(nameLower);
    }

    if (nameLower.includes("32mm")) {
      return { standardId: "is12786", sizeName: "32mm Cl-2" };
    }
    if (nameLower.includes("16mm")) {
      return { standardId: "is12786", sizeName: isCl1 ? "16mm Cl-1" : "16mm Cl-2" };
    }
    if (nameLower.includes("20mm")) {
      // Combined 20mm Cl-1 and Cl-2 mapping under 20mm Cl-2 initially as per instructions
      return { standardId: "is12786", sizeName: "20mm Cl-2" };
    }
    if (nameLower.includes("12mm")) {
      return { standardId: "is12786", sizeName: "12mm Cl-2" };
    }
  }

  // 3. IS 13487 (Emitters)
  if (nameLower.includes("dripper") || nameLower.includes("emitter")) {
    const cleanItem = nameLower.replace(/\s+/g, "");
    // IMPORTANT: Check 14lph BEFORE 4lph because "14lph" contains "4lph" as a substring
    if (cleanItem.includes("14lph")) return { standardId: "is13487", sizeName: "14 LPH" };
    if (cleanItem.includes("8lph")) return { standardId: "is13487", sizeName: "8 LPH" };
    if (cleanItem.includes("4lph")) return { standardId: "is13487", sizeName: "4 LPH" };
  }

  // 4. IS 4985 (Rigid PVC Pipe)
  if (nameLower.includes("r.pvc pipe") || nameLower.includes("rpvc pipe")) {
    const isCl3 = nameLower.includes("6kg/cm2") || nameLower.includes("6kg");
    const suffix = isCl3 ? "Cl-3" : "Cl-2";
    
    if (nameLower.includes("63mm")) return { standardId: "is4985", sizeName: `63mm ${suffix}` };
    if (nameLower.includes("75mm")) return { standardId: "is4985", sizeName: `75mm ${suffix}` };
    if (nameLower.includes("90mm")) return { standardId: "is4985", sizeName: `90mm ${suffix}` };
    if (nameLower.includes("110mm")) return { standardId: "is4985", sizeName: `110mm ${suffix}` };
    if (nameLower.includes("140mm")) return { standardId: "is4985", sizeName: `140mm ${suffix}` };
    if (nameLower.includes("160mm")) return { standardId: "is4985", sizeName: `160mm ${suffix}` };
  }

  // 5. IS 17425 (HDPE Sprinkler Pipe)
  if (nameLower.includes("hdpe sprinkler")) {
    if (nameLower.includes("75mm x 6 mtr. long") || nameLower.includes("75mm x 6 mtr") || nameLower.includes("75mm cl-1")) {
      return { standardId: "is17425", sizeName: "75mm Cl-1" };
    }
    if (nameLower.includes("75mm cl-2") || nameLower.includes("75mm")) {
      return { standardId: "is17425", sizeName: "75mm Cl-2" };
    }
    if (nameLower.includes("90mm")) {
      return { standardId: "is17425", sizeName: "90mm Cl-1" };
    }
  }

  // 6. IS 14483 (Venturi Injector)
  if (nameLower.includes("venturi injector")) {
    if (nameLower.includes("1\"")) return { standardId: "is14483", sizeName: "V-1\" (25mm)" };
    if (nameLower.includes("2\"")) return { standardId: "is14483", sizeName: "V-2\" (50mm)" };
  }

  return null;
};

// Excel Date Parser
function parseExcelDate(val: any): string {
  if (!val) return new Date().toISOString().split("T")[0];
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof val === "number") {
    try {
      const d = XLSX.SSF.parse_date_code(val);
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  }
  let s = String(val).trim();
  if (s.includes("T")) {
    s = s.split("T")[0];
  } else {
    s = s.split(/\s+/)[0];
  }
  const matchDmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (matchDmy) {
    let yr = matchDmy[3];
    if (yr.length === 2) yr = "20" + yr;
    return `${yr}-${matchDmy[2].padStart(2, "0")}-${matchDmy[1].padStart(2, "0")}`;
  }
  const matchYmd = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (matchYmd) {
    return `${matchYmd[1]}-${matchYmd[2].padStart(2, "0")}-${matchYmd[3].padStart(2, "0")}`;
  }
  const monthsShort = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const monthsFull = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const matchWritten = s.match(/^(\d{1,2})[\/\-.]([a-zA-Z]+)[\/\-.](\d{2,4})$/);
  if (matchWritten) {
    const day = matchWritten[1].padStart(2, "0");
    const monthStr = matchWritten[2].toLowerCase();
    let yr = matchWritten[3];
    if (yr.length === 2) yr = "20" + yr;
    let mIdx = monthsShort.indexOf(monthStr.substring(0, 3));
    if (mIdx === -1) mIdx = monthsFull.indexOf(monthStr);
    if (mIdx !== -1) {
      const month = String(mIdx + 1).padStart(2, "0");
      return `${yr}-${month}-${day}`;
    }
  }
  const parsed = Date.parse(s);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return s;
}

function datesMatch(d1: string, d2: string): boolean {
  if (!d1 || !d2) return false;
  return d1.split(/[ T]/)[0] === d2.split(/[ T]/)[0];
}

export default function SmsUniversal() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [skippedRows, setSkippedRows] = useState<{ index: number; itemName: string; reason: string }[]>([]);
  const [showSkippedModal, setShowSkippedModal] = useState<boolean>(false);

  // Export states
  const [exportStandards, setExportStandards] = useState<string[]>([
    "is13488", "is13487", "is12786", "is4985", "is17425", "is14483"
  ]);
  const [exportSizes, setExportSizes] = useState<Record<string, string[]>>({
    is13488: [...standardSizes.is13488],
    is13487: [...standardSizes.is13487],
    is12786: [...standardSizes.is12786],
    is4985: [...standardSizes.is4985],
    is17425: [...standardSizes.is17425],
    is14483: [...standardSizes.is14483]
  });
  const [showExportSizesDropdown, setShowExportSizesDropdown] = useState<string | null>(null);
  const [exportProd, setExportProd] = useState<boolean>(true);
  const [exportDisp, setExportDisp] = useState<boolean>(true);
  const [exportStock, setExportStock] = useState<boolean>(true);

  // Helper to generate full stock ledger for a standard and size
  const getFullStockLedgerForSize = (standardId: string, sizeName: string) => {
    const prod = JSON.parse(localStorage.getItem(`sms_prod_${standardId}`) || "[]");
    const disp = JSON.parse(localStorage.getItem(`sms_disp_${standardId}`) || "[]");

    const sizeProd = prod.filter((e: any) => e.size === sizeName);
    const sizeDisp = disp.filter((e: any) => e.size === sizeName);
    
    const dates = Array.from(new Set([
      ...sizeProd.map((e: any) => e.date),
      ...sizeDisp.map((e: any) => e.date)
    ])).sort((a, b) => a.localeCompare(b));

    if (dates.length === 0) return [];

    const periodKeys = new Set(dates.map((d) => d.substring(0, 7)));
    const sortedPeriods = Array.from(periodKeys).sort((a, b) => a.localeCompare(b));

    let prevPeriodEndStock = 0;
    const ledgerRows: any[] = [];
    let hasFoundFirstManual = false;

    sortedPeriods.forEach((periodKey) => {
      const [yr, mo] = periodKey.split("-");
      const moIdx = Number(mo) - 1;
      const monthName = MONTHS[moIdx];

      const manualKey = `sms_last_stock_${standardId}_${sizeName}_${yr}_${monthName}`;
      const manualValStr = localStorage.getItem(manualKey);

      let periodStartStock = prevPeriodEndStock;

      if (manualValStr !== null) {
        periodStartStock = Number(manualValStr) || 0;
        hasFoundFirstManual = true;
      } else if (!hasFoundFirstManual) {
        const oldFallback = localStorage.getItem(`sms_last_stock_${standardId}_${sizeName}`);
        if (oldFallback !== null) {
          periodStartStock = Number(oldFallback) || 0;
        } else {
          periodStartStock = 0;
        }
        hasFoundFirstManual = true;
      }

      let runningStock = periodStartStock;
      const periodDates = dates.filter(d => d.startsWith(periodKey));

      periodDates.forEach((dt) => {
        const dProds = sizeProd.filter((e: any) => datesMatch(e.date, dt));
        const dDisps = sizeDisp.filter((e: any) => datesMatch(e.date, dt));

        const prodCoils = dProds.reduce((sum: number, e: any) => sum + (e.coils || 0), 0);
        const prodMtr = dProds.reduce((sum: number, e: any) => sum + (e.mtr || 0), 0);
        const dispCoils = dDisps.reduce((sum: number, e: any) => sum + (e.coils || 0), 0);
        const dispMtr = dDisps.reduce((sum: number, e: any) => sum + (e.dispMtr || e.mtr || 0), 0);

        const openStock = runningStock;
        let addQty = 0;
        let subQty = 0;

        if (standardId === "is4985") {
          addQty = dProds.reduce((sum: number, e: any) => sum + (e.pipe || 0), 0);
          subQty = dDisps.reduce((sum: number, e: any) => sum + (e.dispPipe || e.pipe || 0), 0);
        } else if (standardId === "is14483" || standardId === "is13487" || standardId === "is17425") {
          addQty = dProds.reduce((sum: number, e: any) => sum + (e.nos || 0), 0);
          subQty = dDisps.reduce((sum: number, e: any) => sum + (e.dispNos || e.nos || 0), 0);
        } else {
          addQty = prodMtr;
          subQty = dispMtr;
        }

        runningStock = openStock + addQty - subQty;

        ledgerRows.push({
          "Size": sizeName,
          "Date": dt,
          "Opening Stock": openStock,
          "Production (Coils)": prodCoils,
          "Production (Mtr)": prodMtr,
          "Dispatch (Coils)": dispCoils,
          "Dispatch (Mtr)": dispMtr,
          "Closing Stock": runningStock
        });
      });

      prevPeriodEndStock = runningStock;
    });

    return ledgerRows;
  };

  // Helper to safely name sheets (Excel limits sheet names to 31 chars and bans some characters)
  const getSafeSheetName = (prefix: string, stdId: string, sizeName: string): string => {
    const stdNum = stdId.replace("is", "");
    let name = `${prefix}-${stdNum}-${sizeName}`;
    name = name.replace(/[\\\/\?\*\[\]]/g, "");
    return name.substring(0, 31);
  };

  // Process Excel Import
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(null);
    setSkippedRows([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        if (!ws) {
          setImportStatus({ type: "error", message: "First sheet in the Excel file is empty." });
          return;
        }

        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        if (rows.length === 0) {
          setImportStatus({ type: "error", message: "Excel sheet does not contain any data rows." });
          return;
        }

        const parsedEntries: any[] = [];
        const skipped: typeof skippedRows = [];

        rows.forEach((row, idx) => {
          const rawItemName = row["Item Name"];
          if (!rawItemName) {
            skipped.push({
              index: idx + 2,
              itemName: "N/A",
              reason: "Missing 'Item Name' column values."
            });
            return;
          }

          const mapped = mapItemToStandardAndSize(rawItemName);
          if (!mapped) {
            skipped.push({
              index: idx + 2,
              itemName: rawItemName,
              reason: "Product item name could not be mapped to any SMS standard."
            });
            return;
          }

          const { standardId, sizeName } = mapped;
          const validSizes = standardSizes[standardId] || [];
          
          // Option B Validation: Skip if size is not configured in system settings
          if (!validSizes.includes(sizeName)) {
            skipped.push({
              index: idx + 2,
              itemName: rawItemName,
              reason: `Size "${sizeName}" is not configured for Standard ${standardId.toUpperCase()} (Option B Skip)`
            });
            return;
          }

          const date = parseExcelDate(row["Date"]);
          const qty = Number(row["Qty"] || 0);
          if (qty <= 0) {
            skipped.push({
              index: idx + 2,
              itemName: rawItemName,
              reason: "Quantity must be greater than 0."
            });
            return;
          }

          const billNo = String(row["Bill No"] !== undefined ? row["Bill No"] : "").trim();
          if (!billNo) {
            skipped.push({
              index: idx + 2,
              itemName: rawItemName,
              reason: "Missing Bill / Invoice Number."
            });
            return;
          }

          const misType = String(row["MIS Type"] || "").trim().toUpperCase();
          const remarks = String(row["Remarks"] || "").trim();

          parsedEntries.push({
            standardId,
            sizeName,
            date,
            qty,
            billNo,
            misType,
            remarks
          });
        });

        // Group rows: Date + Size + MIS Type
        const groups: Record<string, {
          standardId: string;
          sizeName: string;
          date: string;
          misType: string;
          totalQty: number;
          billNumbers: Set<string>;
        }> = {};

        parsedEntries.forEach((entry) => {
          const key = `${entry.standardId}|${entry.sizeName}|${entry.date}|${entry.misType}`;
          if (!groups[key]) {
            groups[key] = {
              standardId: entry.standardId,
              sizeName: entry.sizeName,
              date: entry.date,
              misType: entry.misType,
              totalQty: 0,
              billNumbers: new Set()
            };
          }
          groups[key].totalQty += entry.qty;
          groups[key].billNumbers.add(entry.billNo);
        });

        // Group databases and perform calculations
        const counts: Record<string, number> = {
          is13488: 0, is13487: 0, is12786: 0, is4985: 0, is17425: 0, is14483: 0
        };

        const standardUpdates: Record<string, any[]> = {
          is13488: JSON.parse(localStorage.getItem("sms_disp_is13488") || "[]"),
          is13487: JSON.parse(localStorage.getItem("sms_disp_is13487") || "[]"),
          is12786: JSON.parse(localStorage.getItem("sms_disp_is12786") || "[]"),
          is4985: JSON.parse(localStorage.getItem("sms_disp_is4985") || "[]"),
          is17425: JSON.parse(localStorage.getItem("sms_disp_is17425") || "[]"),
          is14483: JSON.parse(localStorage.getItem("sms_disp_is14483") || "[]")
        };

        const prodLogs: Record<string, any[]> = {
          is13488: JSON.parse(localStorage.getItem("sms_prod_is13488") || "[]"),
          is13487: JSON.parse(localStorage.getItem("sms_prod_is13487") || "[]"),
          is12786: JSON.parse(localStorage.getItem("sms_prod_is12786") || "[]"),
          is4985: JSON.parse(localStorage.getItem("sms_prod_is4985") || "[]"),
          is17425: JSON.parse(localStorage.getItem("sms_prod_is17425") || "[]"),
          is14483: JSON.parse(localStorage.getItem("sms_prod_is14483") || "[]")
        };

        Object.values(groups).forEach((g) => {
          const sortedBills = Array.from(g.billNumbers).sort((a, b) => {
            const numA = Number(a);
            const numB = Number(b);
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            return a.localeCompare(b);
          });

          const firstBill = sortedBills[0];
          const lastBill = sortedBills[sortedBills.length - 1];
          const suffix = g.misType ? `-${g.misType}` : "";
          const billNoFormatted = firstBill === lastBill 
            ? `${firstBill}${suffix}` 
            : `${firstBill}-${lastBill}${suffix}`;

          const matchingProd = prodLogs[g.standardId]?.find(p => datesMatch(p.date, g.date) && p.size === g.sizeName);

          const entry: any = {
            id: `${Date.now()}_disp_${Math.random().toString(36).substr(2, 9)}`,
            date: g.date,
            size: g.sizeName,
            partyName: "FARMER", // Always FARMER as per user request
            billNo: billNoFormatted,
            batchNo: matchingProd ? g.date.replace(/-/g, "") : "-",
            value: 0
          };

          if (g.standardId === "is13488" || g.standardId === "is12786") {
            const pRoll = matchingProd ? (matchingProd.coils || 0) : 0;
            const pM = matchingProd ? (matchingProd.mtr || 0) : 0;
            const dM = g.totalQty;
            entry.prodRoll = pRoll;
            entry.prodMtr = pM;
            entry.dispMtr = dM;
            entry.closeMtr = pM - dM;
          } else if (g.standardId === "is13487" || g.standardId === "is14483" || g.standardId === "is17425") {
            const pN = matchingProd ? (matchingProd.nos || matchingProd.pipe || 0) : 0;
            const dN = g.totalQty;
            entry.prodNos = pN;
            entry.dispNos = dN;
            entry.closeNos = pN - dN;
          } else if (g.standardId === "is4985") {
            const pP = matchingProd ? (matchingProd.pipe || 0) : 0;
            const dMtr = g.totalQty;
            const dP = Math.round(dMtr / 6);
            entry.prodPipe = pP;
            entry.prodMtrPipe = pP * 6;
            entry.dispPipe = dP;
            entry.dispMtrPipe = dMtr;
            entry.closePipe = pP - dP;
          }

          standardUpdates[g.standardId].push(entry);
          counts[g.standardId]++;
        });

        // Save back updated databases
        Object.keys(standardUpdates).forEach((stdId) => {
          if (counts[stdId] > 0) {
            localStorage.setItem(`sms_disp_${stdId}`, JSON.stringify(standardUpdates[stdId]));
          }
        });

        setSkippedRows(skipped);
        
        const summaryMsg = Object.entries(counts)
          .filter(([_, count]) => count > 0)
          .map(([stdId, count]) => `${stdId.toUpperCase()}: ${count} dispatches`)
          .join(", ");

        setImportStatus({
          type: "success",
          message: `Successfully imported transactions! Summary:\n${summaryMsg || "No records added."}${
            skipped.length > 0 ? `\n\n⚠️ ${skipped.length} rows were skipped (unconfigured sizes/Option B).` : ""
          }`
        });

      } catch (err) {
        console.error(err);
        setImportStatus({ type: "error", message: "Failed to read Excel file. Please ensure it is a valid sales data sheet." });
      }
    };
    reader.readAsArrayBuffer(file);

    // Reset input value to allow selecting same file again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Process Universal Export
  const handleExportExcel = () => {
    if (exportStandards.length === 0) {
      alert("Please select at least one standard to export.");
      return;
    }

    const wb = XLSX.utils.book_new();
    let hasSheets = false;

    exportStandards.forEach((stdId) => {
      const selectedSizes = exportSizes[stdId] || [];
      if (selectedSizes.length === 0) return;

      const prod = JSON.parse(localStorage.getItem(`sms_prod_${stdId}`) || "[]");
      const disp = JSON.parse(localStorage.getItem(`sms_disp_${stdId}`) || "[]");

      selectedSizes.forEach((sz) => {
        // 1. Production sheet
        if (exportProd) {
          const sizeProd = prod.filter((e: any) => e.size === sz);
          if (sizeProd.length > 0) {
            const rows = sizeProd.map((e: any) => ({
              "Date": formatDateToDMY(e.date),
              "Size": e.size,
              "Coils": e.coils || "",
              "Mtr Per Coil": e.mtrPerCoil || "",
              "Mtr": e.mtr || "",
              "Kg": e.kg || "",
              "Pipe": e.pipe || "",
              "Tonn": e.tonn || "",
              "Nos": e.nos || "",
              "Thousand Unit": e.thousandUnit || "",
              "Value": e.value || 0
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            const sheetName = getSafeSheetName("Prod", stdId, sz);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            hasSheets = true;
          }
        }

        // 2. Dispatch sheet
        if (exportDisp) {
          const sizeDisp = disp.filter((e: any) => e.size === sz);
          if (sizeDisp.length > 0) {
            const dateToFirstId: Record<string, string> = {};
            sizeDisp.forEach((item: any) => {
              if (!dateToFirstId[item.date]) {
                dateToFirstId[item.date] = item.id;
              }
            });

            const rows = sizeDisp.map((e: any) => {
              const isFirst = dateToFirstId[e.date] === e.id;
              const matchingProd = prod.find((p: any) => datesMatch(p.date, e.date) && p.size === sz);
              
              let prodRoll: any = "";
              let prodMtr: any = "";
              let prodNos: any = "";
              let prodPipe: any = "";
              let prodMtrPipe: any = "";

              if (isFirst && matchingProd) {
                if (stdId === "is13488" || stdId === "is12786") {
                  prodRoll = matchingProd.coils || "";
                  prodMtr = matchingProd.mtr || "";
                } else if (stdId === "is13487" || stdId === "is14483" || stdId === "is17425") {
                  prodNos = matchingProd.nos || matchingProd.pipe || "";
                } else if (stdId === "is4985") {
                  prodPipe = matchingProd.pipe || "";
                  prodMtrPipe = matchingProd.pipe * 6;
                }
              }

              const hasProdQty = isFirst && matchingProd && (
                (stdId === "is13488" || stdId === "is12786") ? ((matchingProd.mtr || 0) > 0) :
                (stdId === "is13487" || stdId === "is14483" || stdId === "is17425") ? (((matchingProd.nos || matchingProd.pipe || 0)) > 0) :
                (stdId === "is4985") ? ((matchingProd.pipe || 0) > 0) : false
              );

              const batchNo = hasProdQty ? e.date.replace(/-/g, "") : "-";

              return {
                "Date": formatDateToDMY(e.date),
                "Size": e.size,
                "Party Name": e.partyName || "",
                "Bill No": e.billNo || "",
                "Batch No": batchNo,
                "Prod Roll": prodRoll,
                "Coils": e.coils || "",
                "Mtr Per Coil": e.mtrPerCoil || "",
                "Mtr": e.dispMtr || e.dispNos || e.dispPipe || "",
                "Kg": e.kg || "",
                "Pipe": e.pipe || "",
                "Tonn": e.tonn || "",
                "Nos": e.nos || "",
                "Thousand Unit": e.thousandUnit || "",
                "Value": e.value || 0
              };
            });
            const ws = XLSX.utils.json_to_sheet(rows);
            const sheetName = getSafeSheetName("Disp", stdId, sz);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            hasSheets = true;
          }
        }

        // 3. Stock sheet
        if (exportStock) {
          const rows = getFullStockLedgerForSize(stdId, sz);
          if (rows.length > 0) {
            const formattedRows = rows.map(r => ({
              ...r,
              "Date": formatDateToDMY(r.Date)
            }));
            const ws = XLSX.utils.json_to_sheet(formattedRows);
            const sheetName = getSafeSheetName("Stock", stdId, sz);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            hasSheets = true;
          }
        }
      });
    });

    if (!hasSheets) {
      alert("No data available to export for selected standards/options.");
      return;
    }

    XLSX.writeFile(wb, `SMS_Universal_Inventory_Report.xlsx`);
  };

  const handleStandardToggle = (stdId: string) => {
    setExportStandards((prev) =>
      prev.includes(stdId) ? prev.filter((id) => id !== stdId) : [...prev, stdId]
    );
  };

  const handleSizeToggle = (stdId: string, sz: string) => {
    setExportSizes((prev) => {
      const current = prev[stdId] || [];
      const updated = current.includes(sz)
        ? current.filter((s) => s !== sz)
        : [...current, sz];
      return { ...prev, [stdId]: updated };
    });
  };

  const handleSelectAllSizesForStd = (stdId: string) => {
    const allSizes = standardSizes[stdId] || [];
    const currentSelected = exportSizes[stdId] || [];
    const isAllSelected = allSizes.length === currentSelected.length;

    setExportSizes((prev) => ({
      ...prev,
      [stdId]: isAllSelected ? [] : [...allSizes]
    }));
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100 py-12 px-6 font-sans relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent_40%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.02),transparent_50%)] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900 pb-6 mb-6">
            <div className="space-y-1">
              <span className="text-[9px] px-2 py-0.5 rounded border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 font-bold uppercase tracking-wider">
                Bulk Data Center
              </span>
              <h2 className="text-2xl font-extrabold text-slate-100 mt-2">
                Universal Import & Export
              </h2>
              <p className="text-slate-400 text-xs max-w-xl">
                Upload your master sales spreadsheet to auto-classify dispatches, or select standards and sizes to export comprehensive Excel reports.
              </p>
            </div>
            
            {/* Tabs control */}
            <div className="flex items-center gap-3.5 shrink-0 flex-wrap">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900">
                <button
                  onClick={() => {
                    setActiveTab("import");
                    setImportStatus(null);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === "import"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Universal Import
                </button>
                <button
                  onClick={() => {
                    setActiveTab("export");
                    setImportStatus(null);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === "export"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Universal Export
                </button>
              </div>
            </div>
          </div>

          {/* Import Status Alert */}
          {importStatus && (
            <div className={`p-4 rounded-xl border text-xs font-medium mb-6 relative z-10 flex items-start justify-between ${
              importStatus.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
                : "bg-rose-500/10 border-rose-500/25 text-rose-400"
            }`}>
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="whitespace-pre-line leading-relaxed">
                  {importStatus.message}
                  {importStatus.type === "success" && skippedRows.length > 0 && (
                    <button 
                      onClick={() => setShowSkippedModal(true)}
                      className="block mt-2 text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 underline"
                    >
                      View Skipped Rows ({skippedRows.length})
                    </button>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setImportStatus(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors uppercase text-[10px] tracking-wider font-extrabold ml-4"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Active Tab View */}
          <div className="relative z-10">
            {activeTab === "import" ? (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Drag-and-drop zone */}
                <div className="lg:col-span-2 space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-900 hover:border-indigo-500/40 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[260px] group"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImportExcel} 
                      accept=".xlsx, .xls" 
                      className="hidden" 
                    />
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 group-hover:bg-indigo-500/10 group-hover:scale-105 transition-all duration-300">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-200">
                      Drag and drop master Excel file here, or click to browse
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium">
                      Supports .xlsx, .xls formats (Maximum size 10MB)
                    </p>
                  </div>
                </div>

                {/* Import guide sidebar */}
                <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                      Upload Master Sales Spreadsheet
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                      The parser expects a sheet with columns: <strong className="text-slate-300 font-semibold">Party Name, Item Name, Date, Qty, Bill No, MIS Type, Remarks</strong>.
                    </p>
                    
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-6 mb-3">
                      PRODUCT CLASSIFICATION RULES
                    </h4>
                    <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                      <div className="border-l-2 border-indigo-500/20 pl-3 py-0.5">
                        <h5 className="text-[11px] font-bold text-indigo-400">IS 13488 Drip Emitting Pipe</h5>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">Class I/II Emitting Pipes (12mm, 16mm, 20mm)</p>
                      </div>
                      <div className="border-l-2 border-indigo-500/20 pl-3 py-0.5">
                        <h5 className="text-[11px] font-bold text-indigo-400">IS 12786 Plain Laterals</h5>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">Plain Laterals Cl-1/2 (12mm, 16mm, 20mm, 32mm)</p>
                      </div>
                      <div className="border-l-2 border-indigo-500/20 pl-3 py-0.5">
                        <h5 className="text-[11px] font-bold text-indigo-400">IS 13487 Drippers</h5>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">Drippers and Emitters (4 LPH, 8 LPH, 14 LPH)</p>
                      </div>
                      <div className="border-l-2 border-indigo-500/20 pl-3 py-0.5">
                        <h5 className="text-[11px] font-bold text-indigo-400">IS 4985 Rigid PVC Pipe</h5>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">Rigid PVC Pipes 63mm to 160mm (4kg/6kg cm²)</p>
                      </div>
                      <div className="border-l-2 border-indigo-500/20 pl-3 py-0.5">
                        <h5 className="text-[11px] font-bold text-indigo-400">IS 17425 HDPE Sprinkler Pipe</h5>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">Sprinkler Pipes (75mm Cl-1/2, 90mm Cl-1)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Export Options */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Select Standards Card */}
                  <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      1. Select IS Standards
                    </h3>
                    <div className="space-y-2">
                      {Object.keys(standardSizes).map((stdId) => (
                        <label 
                          key={stdId}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-900 hover:border-slate-800 bg-slate-950/20 cursor-pointer select-none"
                        >
                          <input 
                            type="checkbox"
                            checked={exportStandards.includes(stdId)}
                            onChange={() => handleStandardToggle(stdId)}
                            className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950"
                          />
                          <span className="text-xs font-bold text-slate-200">{stdId.toUpperCase()}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Select Sizes Card */}
                  <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 space-y-4 md:col-span-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      2. Configure Sizes to Export
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {exportStandards.map((stdId) => (
                        <div key={stdId} className="border border-slate-900 rounded-xl bg-slate-950/20 overflow-hidden">
                          <div className="bg-slate-950 px-4 py-3 border-b border-slate-900 flex justify-between items-center">
                            <span className="text-xs font-extrabold text-indigo-400 uppercase">{stdId} Sizes</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleSelectAllSizesForStd(stdId)}
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider cursor-pointer"
                              >
                                {exportSizes[stdId]?.length === standardSizes[stdId].length ? "Clear All" : "Select All"}
                              </button>
                              <button 
                                onClick={() => setShowExportSizesDropdown(showExportSizesDropdown === stdId ? null : stdId)}
                                className="text-slate-400 hover:text-slate-200 cursor-pointer"
                              >
                                {showExportSizesDropdown === stdId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          
                          {(showExportSizesDropdown === stdId || true) && (
                            <div className="p-4 grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto">
                              {standardSizes[stdId].map((sz) => (
                                <label 
                                  key={sz}
                                  className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-950/40 cursor-pointer select-none text-[11px]"
                                >
                                  <input 
                                    type="checkbox"
                                    checked={(exportSizes[stdId] || []).includes(sz)}
                                    onChange={() => handleSizeToggle(stdId, sz)}
                                    className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950 w-3.5 h-3.5"
                                  />
                                  <span className="text-slate-300 font-medium truncate">{sz}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Scope Selection & Export Trigger */}
                <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex flex-wrap items-center gap-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      3. Select Data Sheets:
                    </span>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={exportProd}
                        onChange={(e) => setExportProd(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-950 text-indigo-600 w-4 h-4"
                      />
                      Production Logs
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={exportDisp}
                        onChange={(e) => setExportDisp(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-950 text-indigo-600 w-4 h-4"
                      />
                      Dispatch Registers
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={exportStock}
                        onChange={(e) => setExportStock(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-950 text-indigo-600 w-4 h-4"
                      />
                      Stock Ledgers
                    </label>
                  </div>

                  <button 
                    onClick={handleExportExcel}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg transition-colors cursor-pointer w-full md:w-auto"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Consolidated Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skipped Rows Modal */}
      {showSkippedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="text-base font-extrabold text-slate-100">
                  Skipped Rows Summary (Option B)
                </h3>
              </div>
              <button 
                onClick={() => setShowSkippedModal(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                As per your configured settings, the uploader skipped the following spreadsheet rows because the size of the product was not pre-configured in the standard's settings (Option B skip).
              </p>
              
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="pb-3 pr-4 font-bold">Row</th>
                    <th className="pb-3 pr-4 font-bold">Item Name in Excel</th>
                    <th className="pb-3 font-bold">Skip Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-slate-300">
                  {skippedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-850/20">
                      <td className="py-3 pr-4 font-semibold text-slate-400">#{r.index}</td>
                      <td className="py-3 pr-4 font-medium text-slate-100 max-w-[200px] truncate" title={r.itemName}>
                        {r.itemName}
                      </td>
                      <td className="py-3 text-slate-400 italic">{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-850 flex justify-end">
              <button
                onClick={() => setShowSkippedModal(false)}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
