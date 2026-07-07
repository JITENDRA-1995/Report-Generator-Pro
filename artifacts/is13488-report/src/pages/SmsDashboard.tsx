import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { 
  Droplet, 
  Cpu, 
  Workflow, 
  Layers, 
  Disc, 
  Gauge,
  ArrowRight,
  Upload,
  Download,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  X,
  Plus
} from "lucide-react";
import * as XLSX from "xlsx";

interface SmsStandardItem {
  id: string;
  name: string;
  subName: string;
  desc: string;
  icon: React.ComponentType<any>;
}

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
  
  // 1. IS 13488 (Emitting Pipe)
  if (name.includes("Emitting Pipe")) {
    if (name.includes("Class I 16") || name.includes("CL-I 16")) {
      return { standardId: "is13488", sizeName: "16mm CL-1" };
    }
    if (name.includes("Class II 16") || name.includes("CL-II 16") || name.includes("Class II 16 x") || name.includes("Class II 16 X")) {
      return { standardId: "is13488", sizeName: "16mm Cl-2" };
    }
    if (name.includes("Class I 20") || name.includes("CL-I 20") || name.includes("Class I 20 x") || name.includes("Class I 20 X")) {
      return { standardId: "is13488", sizeName: "20mm Cl-1" };
    }
    if (name.includes("Class II 12") || name.includes("CL-II 12")) {
      return { standardId: "is13488", sizeName: "12mm Cl-2" };
    }
    if (name.includes("12mm")) return { standardId: "is13488", sizeName: "12mm Cl-2" };
    if (name.includes("16mm")) return { standardId: "is13488", sizeName: "16mm Cl-2" };
    if (name.includes("20mm")) return { standardId: "is13488", sizeName: "20mm Cl-1" };
  }

  // 2. IS 12786 (Plain Laterals)
  if (name.includes("Plain Lateral")) {
    if (name.includes("32mm")) {
      return { standardId: "is12786", sizeName: "32mm Cl-2" };
    }
    if (name.includes("16mm")) {
      return { standardId: "is12786", sizeName: "16mm Cl-2" };
    }
    if (name.includes("CL-I /20mm") || name.includes("CL-I/20mm") || name.includes("20mm CL-I") || name.includes("CL-I 20mm")) {
      return { standardId: "is12786", sizeName: "20mm Cl-1" };
    }
    if (name.includes("CL-II /20mm") || name.includes("CL-II/20mm") || name.includes("20mm CL-II") || name.includes("CL-II 20mm")) {
      return { standardId: "is12786", sizeName: "20mm Cl-2" };
    }
    if (name.includes("20mm")) {
      return { standardId: "is12786", sizeName: "20mm Cl-2" };
    }
  }

  // 3. IS 13487 (Emitters)
  if (name.includes("Dripper")) {
    if (name.includes("4 LPH")) return { standardId: "is13487", sizeName: "4 LPH" };
    if (name.includes("8 LPH")) return { standardId: "is13487", sizeName: "8 LPH" };
    if (name.includes("14 LPH")) return { standardId: "is13487", sizeName: "14 LPH" };
  }

  // 4. IS 4985 (Rigid PVC Pipe)
  if (name.includes("R.PVC Pipe") || name.includes("RPVC Pipe")) {
    const isCl3 = name.includes("6kg/cm2") || name.includes("6kg");
    const suffix = isCl3 ? "Cl-3" : "Cl-2";
    
    if (name.includes("63mm")) return { standardId: "is4985", sizeName: `63mm ${suffix}` };
    if (name.includes("75mm")) return { standardId: "is4985", sizeName: `75mm ${suffix}` };
    if (name.includes("90mm")) return { standardId: "is4985", sizeName: `90mm ${suffix}` };
    if (name.includes("110mm")) return { standardId: "is4985", sizeName: `110mm ${suffix}` };
    if (name.includes("140mm")) return { standardId: "is4985", sizeName: `140mm ${suffix}` };
    if (name.includes("160mm")) return { standardId: "is4985", sizeName: `160mm ${suffix}` };
  }

  // 5. IS 17425 (HDPE Sprinkler Pipe)
  if (name.includes("HDPE Sprinkler")) {
    if (name.includes("75mm x 6 Mtr. Long") || name.includes("75mm x 6 Mtr") || name.includes("75mm Cl-1")) {
      return { standardId: "is17425", sizeName: "75mm Cl-1" };
    }
    if (name.includes("75mm Cl-2") || name.includes("75mm")) {
      return { standardId: "is17425", sizeName: "75mm Cl-2" };
    }
    if (name.includes("90mm")) {
      return { standardId: "is17425", sizeName: "90mm Cl-1" };
    }
  }

  // 6. IS 14483 (Venturi Injector)
  if (name.includes("Venturi injector")) {
    if (name.includes("1\"")) return { standardId: "is14483", sizeName: "V-1\" (25mm)" };
    if (name.includes("2\"")) return { standardId: "is14483", sizeName: "V-2\" (50mm)" };
  }

  return null;
};

// Excel Date Parser
const parseExcelDate = (val: any): string => {
  if (typeof val === "number") {
    try {
      const d = XLSX.SSF.parse_date_code(val);
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  }
  if (typeof val === "string") {
    const parts = val.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    const isoParts = val.split("-");
    if (isoParts.length === 3) {
      return val;
    }
  }
  return new Date().toISOString().split("T")[0];
};

export default function SmsDashboard() {
  const [, navigate] = useLocation();
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

  const smsStandards: SmsStandardItem[] = [
    {
      id: "is13488",
      name: "IS 13488",
      subName: "Emitting Pipe",
      desc: "Manage warehouse stock, coil rolls, wall thickness categories, and production yield audit trails.",
      icon: Droplet,
    },
    {
      id: "is13487",
      name: "IS 13487",
      subName: "Emitters",
      desc: "Track emitter batches, flow rates (LPH), unit quantity logs, and component bin allocations.",
      icon: Cpu,
    },
    {
      id: "is12786",
      name: "IS 12786",
      subName: "Plain Laterals",
      desc: "Monitor plain lateral tube stock, extrusion line batch runs, length specifications, and scrap rates.",
      icon: Workflow,
    },
    {
      id: "is4985",
      name: "IS 4985",
      subName: "uPVC Pipe",
      desc: "Audit uPVC rigid pipe inventory, nominal diameters, pressure ratings, and pipe socket stocks.",
      icon: Disc,
    },
    {
      id: "is17425",
      name: "IS 17425",
      subName: "HDPE Pipe",
      desc: "Control high-density polyethylene coil lengths, raw resin batches, and dimension ratios (SDR).",
      icon: Layers,
    },
    {
      id: "is14483",
      name: "IS 14483",
      subName: "Venturi Injector",
      desc: "Track Venturi device inventory, model categories, suction assemblies, and accessory packaging kits.",
      icon: Gauge,
    },
  ];

  const handleCardClick = (item: SmsStandardItem) => {
    navigate(`/sms/standard/${item.id}`);
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

        // Load databases and perform calculations
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

          const matchingProd = prodLogs[g.standardId]?.find(p => p.date === g.date && p.size === g.sizeName);

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
            const dP = g.totalQty;
            entry.prodPipe = pP;
            entry.prodMtrPipe = pP * 6;
            entry.dispPipe = dP;
            entry.dispMtrPipe = dP * 6;
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
        const dProds = sizeProd.filter((e: any) => e.date === dt);
        const dDisps = sizeDisp.filter((e: any) => e.date === dt);

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
        } else if (standardId === "is14483") {
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
              const matchingProd = prod.find((p: any) => p.date === e.date && p.size === sz);
              
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

  const clearAllSmsEntries = () => {
    if (window.confirm("Are you sure you want to clear all production and dispatch entries across all standards? This action cannot be undone.")) {
      const keys = [
        "sms_prod_is13488", "sms_disp_is13488",
        "sms_prod_is13487", "sms_disp_is13487",
        "sms_prod_is12786", "sms_disp_is12786",
        "sms_prod_is4985", "sms_disp_is4985",
        "sms_prod_is17425", "sms_disp_is17425",
        "sms_prod_is14483", "sms_disp_is14483"
      ];
      keys.forEach(k => localStorage.removeItem(k));
      alert("All production and dispatch entries have been cleared successfully.");
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100 py-12 px-6 font-sans relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent_40%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        {/* Title Section */}
        <div className="text-center md:text-left border-b border-slate-900 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Stock Management Hub</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Select an IS standard category to audit stock quantities, production batches, and release registers.
            </p>
          </div>
          <div className="hidden md:flex items-center text-[10px] px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 font-bold uppercase tracking-widest">
            6 Categories Available
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {smsStandards.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="group relative rounded-2xl border border-slate-900 bg-slate-900/30 p-6 cursor-pointer hover:border-indigo-500/30 hover:bg-slate-900/60 hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.12)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Icon and Standard Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/15 group-hover:scale-105 transition-all duration-300">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900/50 text-slate-400 font-bold tracking-wider">
                      {item.name}
                    </span>
                  </div>

                  {/* Text Content */}
                  <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors duration-300">
                    {item.subName}
                  </h3>
                  <p className="mt-2.5 text-slate-400 text-xs leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Card Action Link */}
                <div className="mt-6 flex items-center gap-1.5 text-indigo-400 font-semibold text-xs group-hover:translate-x-1.5 transition-transform duration-300">
                  <span>Manage Stock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Universal Bulk Data Center */}
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
            
            {/* Tabs & Reset control */}
            <div className="flex items-center gap-3.5 shrink-0 flex-wrap">
              <button
                onClick={clearAllSmsEntries}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              >
                Clear All SMS Data
              </button>

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
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-200">
                      Upload Master Sales Spreadsheet
                    </h3>
                    <p className="text-slate-400 text-xs">
                      The parser expects a sheet with columns: <span className="text-slate-300 font-medium">Party Name, Item Name, Date, Qty, Bill No, MIS Type, Remarks</span>.
                    </p>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-500/[0.01] rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 group/dropzone"
                  >
                    <Upload className="w-10 h-10 text-slate-500 group-hover/dropzone:text-indigo-400 transition-all duration-300 group-hover/dropzone:scale-105" />
                    <span className="text-xs font-bold text-slate-300 group-hover/dropzone:text-slate-100 transition-colors">
                      Drag and drop master Excel file here, or click to browse
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Supports .xlsx, .xls formats (Maximum size 10MB)
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportExcel}
                      accept=".xlsx, .xls"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Mapping Logic Cheat-Sheet */}
                <div className="bg-slate-950/50 border border-slate-900 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest pb-2 border-b border-slate-900">
                    Product Classification Rules
                  </h3>
                  <div className="space-y-3.5 text-[11px] text-slate-400 overflow-y-auto max-h-[220px] pr-1">
                    <div className="space-y-1">
                      <span className="text-indigo-400 font-bold">IS 13488 Drip Emitting Pipe</span>
                      <p>Class I/II Emitting Pipes (12mm, 16mm, 20mm)</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-indigo-400 font-bold">IS 12786 Plain Laterals</span>
                      <p>Plain Laterals Cl-1/2 (12mm, 16mm, 20mm, 32mm)</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-indigo-400 font-bold">IS 13487 Drippers</span>
                      <p>Drippers and Emitters (4 LPH, 8 LPH, 14 LPH)</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-indigo-400 font-bold">IS 4985 Rigid PVC Pipe</span>
                      <p>Rigid PVC Pipes 63mm to 160mm (4kg/6kg cm²)</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-indigo-400 font-bold">IS 17425 HDPE Sprinkler Pipe</span>
                      <p>Sprinkler Pipes (75mm Cl-1/2, 90mm Cl-1)</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-indigo-400 font-bold">IS 14483 Venturi Injector</span>
                      <p>Venturi injector Assemblies (1" or 2" model)</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Select Standards */}
                  <div className="space-y-3.5 bg-slate-950/40 border border-slate-900 rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest pb-2 border-b border-slate-900">
                      1. Select IS Standards
                    </h3>
                    <div className="flex items-center justify-between border-b border-slate-900 pb-1 mb-1">
                      <button
                        type="button"
                        onClick={() => setExportStandards(smsStandards.map(s => s.id))}
                        className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider cursor-pointer"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportStandards([])}
                        className="text-[9px] text-slate-500 hover:text-slate-400 font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {smsStandards.map((std) => {
                        const isChecked = exportStandards.includes(std.id);
                        return (
                          <div key={std.id} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`export-std-${std.id}`}
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setExportStandards(exportStandards.filter(s => s !== std.id));
                                } else {
                                  setExportStandards([...exportStandards, std.id]);
                                }
                              }}
                              className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950 cursor-pointer"
                            />
                            <label htmlFor={`export-std-${std.id}`} className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                              {std.name} - {std.subName}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Select Sizes per Standard */}
                  <div className="space-y-3.5 bg-slate-950/40 border border-slate-900 rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest pb-2 border-b border-slate-900">
                      2. Configure Sizes
                    </h3>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {exportStandards.map((stdId) => {
                        const sizesList = standardSizes[stdId] || [];
                        const selectedForStd = exportSizes[stdId] || [];
                        const isOpen = showExportSizesDropdown === stdId;
                        
                        return (
                          <div key={stdId} className="border-b border-slate-900/60 pb-2">
                            <button
                              type="button"
                              onClick={() => setShowExportSizesDropdown(isOpen ? null : stdId)}
                              className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-indigo-400 transition-colors"
                            >
                              <span>{stdId.toUpperCase()} Sizes ({selectedForStd.length}/{sizesList.length})</span>
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {isOpen && (
                              <div className="mt-2 bg-slate-950/80 border border-slate-900 rounded-xl p-3 space-y-2 mt-1">
                                <div className="flex items-center justify-between border-b border-slate-900 pb-1 mb-1">
                                  <button
                                    type="button"
                                    onClick={() => setExportSizes({ ...exportSizes, [stdId]: [...sizesList] })}
                                    className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider"
                                  >
                                    All
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setExportSizes({ ...exportSizes, [stdId]: [] })}
                                    className="text-[9px] text-slate-500 hover:text-slate-400 font-bold uppercase tracking-wider"
                                  >
                                    Clear
                                  </button>
                                </div>
                                {sizesList.map((sz) => {
                                  const isSzChecked = selectedForStd.includes(sz);
                                  return (
                                    <div key={sz} className="flex items-center gap-2.5">
                                      <input
                                        type="checkbox"
                                        id={`export-sz-${stdId}-${sz}`}
                                        checked={isSzChecked}
                                        onChange={() => {
                                          if (isSzChecked) {
                                            setExportSizes({
                                              ...exportSizes,
                                              [stdId]: selectedForStd.filter(s => s !== sz)
                                            });
                                          } else {
                                            setExportSizes({
                                              ...exportSizes,
                                              [stdId]: [...selectedForStd, sz]
                                            });
                                          }
                                        }}
                                        className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 bg-slate-950 cursor-pointer"
                                      />
                                      <label htmlFor={`export-sz-${stdId}-${sz}`} className="text-[11px] text-slate-400 cursor-pointer select-none">
                                        {sz}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {exportStandards.length === 0 && (
                        <p className="text-[11px] text-slate-500 italic py-2">Select standards first</p>
                      )}
                    </div>
                  </div>

                  {/* Select sheets */}
                  <div className="space-y-3.5 bg-slate-950/40 border border-slate-900 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest pb-2 border-b border-slate-900">
                        3. Include Sheets
                      </h3>
                      <div className="flex items-center justify-between border-b border-slate-900 pb-1 mb-3">
                        <button
                          type="button"
                          onClick={() => {
                            setExportProd(true);
                            setExportDisp(true);
                            setExportStock(true);
                          }}
                          className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider cursor-pointer"
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExportProd(false);
                            setExportDisp(false);
                            setExportStock(false);
                          }}
                          className="text-[9px] text-slate-500 hover:text-slate-400 font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="chk-export-prod"
                            checked={exportProd}
                            onChange={(e) => setExportProd(e.target.checked)}
                            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950 cursor-pointer"
                          />
                          <label htmlFor="chk-export-prod" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                            Production Logs
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="chk-export-disp"
                            checked={exportDisp}
                            onChange={(e) => setExportDisp(e.target.checked)}
                            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950 cursor-pointer"
                          />
                          <label htmlFor="chk-export-disp" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                            Dispatch Logs
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="chk-export-stock"
                            checked={exportStock}
                            onChange={(e) => setExportStock(e.target.checked)}
                            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950 cursor-pointer"
                          />
                          <label htmlFor="chk-export-stock" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                            Daily Stock Ledgers
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleExportExcel}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5 mt-6"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Consolidated Data</span>
                    </button>
                  </div>
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
