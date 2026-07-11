import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useLocation } from "wouter";
import { defaultConsignees } from "@/lib/defaultConsignees";
import { supabase } from "@/lib/supabase";
import * as smsStorage from "@/lib/smsStorage";
import { 
  ChevronRight, 
  ChevronDown,
  ArrowLeft,
  Boxes,
  Hammer,
  Trash2,
  Plus,
  Pencil,
  Check,
  AlertTriangle,
  Upload,
  Download,
  Users,
  FileSpreadsheet,
  UploadCloud,
  Workflow,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import XLSXStyle from "xlsx-js-style";
import { initializeDefaultConversions } from "./SmsSettings";
interface ProductionEntry {
  id: string;
  date: string;
  size: string;
  coils?: number;
  mtrPerCoil?: number;
  mtr?: number;
  kg?: number;
  pipe?: number;
  tonn?: number;
  nos?: number;
  thousandUnit?: number;
  value: number;
}

interface DispatchEntry {
  id: string;
  date: string;
  size: string;
  partyName: string;
  billNo: string;
  batchNo: string;
  value?: number;
  prodRoll?: number;
  prodMtr?: number;
  dispMtr?: number;
  closeMtr?: number;
  prodNos?: number;
  dispNos?: number;
  closeNos?: number;
  prodPipe?: number;
  dispPipe?: number;
  closePipe?: number;
  prodMtrPipe?: number;
  dispMtrPipe?: number;
  isConsigneeImport?: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const YEARS = ["2024", "2025", "2026", "2027", "2028", "2029", "2030", "2031", "2032", "2033", "2034", "2035"];

const smsStandards: Record<string, { name: string; subName: string }> = {
  is13488: { name: "IS 13488", subName: "Emitting Pipe" },
  is13487: { name: "IS 13487", subName: "Emitters" },
  is12786: { name: "IS 12786", subName: "Plain Laterals" },
  is4985: { name: "IS 4985", subName: "uPVC Pipe" },
  is17425: { name: "IS 17425", subName: "HDPE Pipe" },
  is14483: { name: "IS 14483", subName: "Venturi Injector" },
};

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

export default function SmsEntryPanel() {
  const { id, type } = useParams<{ id: string; type: string }>();
  const [, navigate] = useLocation();

  // Helper to format ISO YYYY-MM-DD to DD/MM/YYYY
  const formatDateToDMY = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Helper to normalize/clean consignee names for matching (e.g. "Siddhi Corporation / prantij" -> "Siddhi Corporation")
  const getCleanConsigneeName = (name: string): string => {
    if (!name) return "";
    let clean = name.split("/")[0].split("-")[0].split("(")[0].trim();
    return clean.replace(/\s+/g, " ");
  };

  const currentStandard = smsStandards[id || ""] || { name: "SMS", subName: "Standard Operations" };
  const sizes = standardSizes[id || ""] || [];
  const entryTypeLabels: Record<string, string> = {
    production: "Production Entry",
    dispatch: "Dispatch Entry",
    stock: "Daily Stock Ledger",
    export: "Export Ledger",
    consignee: "Consignee Data",
    io: "Import / Export"
  };
  const entryTypeLabel = entryTypeLabels[type || ""] || "Stock Operation";

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOnline] = useState<boolean>(smsStorage.isCloudEnabled());

  // Common Form States
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Production Form States
  const [coils, setCoils] = useState<string>("");
  const [mtrPerCoil, setMtrPerCoil] = useState<string>("");
  const [kg, setKg] = useState<string>("");
  const [pipe, setPipe] = useState<string>("");
  const [tonn, setTonn] = useState<string>("");
  const [nos, setNos] = useState<string>("");
  const [value, setValue] = useState<string>("");

  // Dispatch Form States
  const [partyName, setPartyName] = useState<string>("");
  const [billNo, setBillNo] = useState<string>("");
  const [batchNo, setBatchNo] = useState<string>("");
  const [prodRoll, setProdRoll] = useState<string>("");
  const [prodMtr, setProdMtr] = useState<string>("");
  const [dispMtr, setDispMtr] = useState<string>("");
  const [prodNos, setProdNos] = useState<string>("");
  const [dispNos, setDispNos] = useState<string>("");
  const [prodPipe, setProdPipe] = useState<string>("");
  const [dispPipe, setDispPipe] = useState<string>("");
  const [prodMtrPipe, setProdMtrPipe] = useState<string>("");
  const [dispMtrPipe, setDispMtrPipe] = useState<string>("");

  // Persisted entries
  const [entries, setEntries] = useState<any[]>([]);
  const [prodEntries, setProdEntries] = useState<any[]>([]);

  const [dispEntries, setDispEntries] = useState<any[]>([]);
  const [tempImportedDispEntries, setTempImportedDispEntries] = useState<DispatchEntry[]>([]);
  const displayedDispEntries = useMemo(() => [...dispEntries, ...tempImportedDispEntries], [dispEntries, tempImportedDispEntries]);
  const prevMonthYear = (month: string, year: string) => {
    const mIdx = MONTHS.indexOf(month);
    if (mIdx === 0) {
      return { month: MONTHS[11], year: (Number(year) - 1).toString() };
    } else {
      return { month: MONTHS[mIdx - 1], year: year };
    }
  };

  const [lastClosingStock, setLastClosingStock] = useState<string>("0");
  const [stockMonth, setStockMonth] = useState<string>(() => MONTHS[new Date().getMonth()]);
  const [stockYear, setStockYear] = useState<string>(() => new Date().getFullYear().toString());
  const [fromMonth, setFromMonth] = useState<string>("January");
  const [fromYear, setFromYear] = useState<string>(() => new Date().getFullYear().toString());
  const [toMonth, setToMonth] = useState<string>("December");
  const [toYear, setToYear] = useState<string>(() => new Date().getFullYear().toString());
  const [isEditingStock, setIsEditingStock] = useState<boolean>(false);
  const [editingStockValue, setEditingStockValue] = useState<string>("0");
  const [showInitStockModal, setShowInitStockModal] = useState<boolean>(false);
  const [initStockValue, setInitStockValue] = useState<string>("");
  const [dismissedInitModalFor, setDismissedInitModalFor] = useState<{ size: string; month: string; year: string } | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [importTab, setImportTab] = useState<"production" | "dispatch">("production");
  const [exportProd, setExportProd] = useState<boolean>(true);
  const [exportDisp, setExportDisp] = useState<boolean>(true);
  const [exportStock, setExportStock] = useState<boolean>(true);
  const [exportSizes, setExportSizes] = useState<string[]>([]);
  const [showSizesDropdown, setShowSizesDropdown] = useState<boolean>(false);
  const [showExportLedgerModal, setShowExportLedgerModal] = useState<boolean>(false);
  const [exportLedgerSelectedSizes, setExportLedgerSelectedSizes] = useState<string[]>([]);

  // Consignee Report States
  const [selectedConsignees, setSelectedConsignees] = useState<string[]>([]);
  const [consigneeSearch, setConsigneeSearch] = useState<string>("");
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [exportFilename, setExportFilename] = useState<string>(() => {
    const isCode = id ? id.replace("is", "") : "";
    return isCode ? `PARAGON CONSIGNEE - ${isCode}` : "PARAGON CONSIGNEE";
  });
  const [consigneeReportMonth, setConsigneeReportMonth] = useState<string>(() => MONTHS[new Date().getMonth()]);
  const [consigneeReportYear, setConsigneeReportYear] = useState<string>(() => new Date().getFullYear().toString());
  // Each generated row keeps its own month+year so multi-month accumulation works
  type ConsigneeReportRow = { consigneeName: string; qty: number; month: string; year: string };
  const [consigneeReportRows, setConsigneeReportRows] = useState<ConsigneeReportRow[]>([]);
  const [importedConsigneeIds, setImportedConsigneeIds] = useState<Set<string>>(new Set());

  const [consigneeEditModal, setConsigneeEditModal] = useState<{
    show: boolean;
    consigneeName: string;
    address: string;
    city: string;
    district: string;
    state: string;
    country: string;
    pincode: string;
    telephone: string;
    mobile: string;
    email: string;
  } | null>(null);

  const registeredNames = useMemo(() => {
    const names = new Set<string>();
    const stored = localStorage.getItem("sms_consignees");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.forEach((c: any) => {
          const name = typeof c === "string" ? c : c.name || "";
          if (name) {
            names.add(name.toLowerCase());
          }
        });
      } catch (e) {}
    }
    return names;
  }, [consigneeEditModal]);

  useEffect(() => {
    initializeDefaultConversions();
  }, []);

  useEffect(() => {
    if (sizes && sizes.length > 0) {
      setExportSizes(sizes);
      setExportLedgerSelectedSizes(sizes);
    }
  }, [id, sizes]);

  useEffect(() => {
    if (!id) return;
    const isCode = id.replace("is", "");
    setExportFilename(`PARAGON CONSIGNEE - ${isCode}`);
  }, [id]);

  // Load imported consignee IDs from localStorage once id is available
  useEffect(() => {
    if (!id) return;
    try {
      const stored = localStorage.getItem(`sms_consignee_imported_ids_${id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setImportedConsigneeIds(new Set<string>(parsed));
        }
      }
    } catch (e) {}
  }, [id]);

  // Load last closing stock balance and date from localStorage
  useEffect(() => {
    if (id && selectedSize) {
      const fmVal = localStorage.getItem(`sms_stock_from_month_${id}_${selectedSize}`) || "January";
      const fyVal = localStorage.getItem(`sms_stock_from_year_${id}_${selectedSize}`) || new Date().getFullYear().toString();
      const tmVal = localStorage.getItem(`sms_stock_to_month_${id}_${selectedSize}`) || "December";
      const tyVal = localStorage.getItem(`sms_stock_to_year_${id}_${selectedSize}`) || new Date().getFullYear().toString();

      setFromMonth(fmVal);
      setFromYear(fyVal);
      setToMonth(tmVal);
      setToYear(tyVal);
      setIsEditingStock(false);

      const prev = prevMonthYear(fmVal, fyVal);
      setStockMonth(prev.month);
      setStockYear(prev.year);

      const mKey = `sms_last_stock_${id}_${selectedSize}_${prev.year}_${prev.month}`;
      const savedMVal = localStorage.getItem(mKey);
      if (savedMVal !== null) {
        setLastClosingStock(savedMVal);
      } else {
        const globalVal = localStorage.getItem(`sms_last_stock_${id}_${selectedSize}`) || "0";
        setLastClosingStock(globalVal);
      }
    }
  }, [id, selectedSize]);

  // Automatically adapt Closing Stock On to preceding month of Stock From
  useEffect(() => {
    if (fromMonth && fromYear && id && selectedSize) {
      const prev = prevMonthYear(fromMonth, fromYear);
      setStockMonth(prev.month);
      setStockYear(prev.year);

      const mKey = `sms_last_stock_${id}_${selectedSize}_${prev.year}_${prev.month}`;
      const savedMVal = localStorage.getItem(mKey);
      if (savedMVal !== null) {
        setLastClosingStock(savedMVal);
      } else {
        const globalVal = localStorage.getItem(`sms_last_stock_${id}_${selectedSize}`) || "0";
        setLastClosingStock(globalVal);
      }
    }
  }, [fromMonth, fromYear, id, selectedSize]);

  // Persist range selections
  useEffect(() => {
    if (id && selectedSize) {
      localStorage.setItem(`sms_stock_from_month_${id}_${selectedSize}`, fromMonth);
      localStorage.setItem(`sms_stock_from_year_${id}_${selectedSize}`, fromYear);
      localStorage.setItem(`sms_stock_to_month_${id}_${selectedSize}`, toMonth);
      localStorage.setItem(`sms_stock_to_year_${id}_${selectedSize}`, toYear);
    }
  }, [fromMonth, fromYear, toMonth, toYear, id, selectedSize]);

  // Automatically calculate Production (KG), Tonn, and Value (Rs.) based on configured conversion factors
  useEffect(() => {
    if (!id || !selectedSize) return;

    const weightPerMtrKey = `sms_conv_weight_${id}_${selectedSize}`;
    const valuePerUnitKey = `sms_conv_value_${id}_${selectedSize}`;
    const weightPerMtr = Number(localStorage.getItem(weightPerMtrKey)) || 0;
    const valuePerUnit = Number(localStorage.getItem(valuePerUnitKey)) || 0;

    let qtyInMtr = 0;

    if (id === "is13488" || id === "is12786") {
      qtyInMtr = (Number(coils) || 0) * (Number(mtrPerCoil) || 0);
    } else if (id === "is4985") {
      qtyInMtr = (Number(pipe) || 0) * 6; // Each pipe is 6 meters
    }

    // 1. Auto-calculate Weight (KG) for meter/pipe-based standards
    let currentKg = Number(kg) || 0;
    if (weightPerMtr > 0 && qtyInMtr > 0) {
      const calcKg = (qtyInMtr * weightPerMtr).toFixed(2);
      if (calcKg !== kg) {
        setKg(calcKg);
      }
      currentKg = Number(calcKg);
    }

    // 2. Auto-calculate Tonn for IS 4985 (derived from KG)
    let currentTonn = Number(tonn) || 0;
    if (id === "is4985") {
      const calcTonn = (currentKg / 1000).toFixed(2);
      if (calcTonn !== tonn) {
        setTonn(calcTonn);
      }
      currentTonn = Number(calcTonn);
    }

    // 3. Auto-calculate Value (Rs.) based on standard-specific rules
    if (valuePerUnit > 0) {
      let calcVal = 0;
      if (id === "is13488" || id === "is12786") {
        // Value per kg
        calcVal = Math.round(currentKg * valuePerUnit);
      } else if (id === "is13487") {
        // Value per 1000 Nos
        const qtyNos = Number(nos) || 0;
        calcVal = Math.round((qtyNos / 1000) * valuePerUnit);
      } else if (id === "is4985") {
        // Value per Tonn
        calcVal = Math.round(currentTonn * valuePerUnit);
      } else if (id === "is17425" || id === "is14483") {
        // Value per Nos
        const qtyNos = Number(pipe) || Number(nos) || 0;
        calcVal = Math.round(qtyNos * valuePerUnit);
      }

      if (calcVal > 0) {
        const calcValStr = calcVal.toString();
        if (calcValStr !== value) {
          setValue(calcValStr);
        }
      }
    }
  }, [coils, mtrPerCoil, pipe, nos, kg, tonn, selectedSize, id]);

  // Show mandatory initialization modal if starting stock is missing and no logs exist in preceding month
  useEffect(() => {
    if (type === "stock" && id && selectedSize && stockMonth && stockYear) {
      const hasLogs = hasEntriesInPrevMonth();
      const mKey = `sms_last_stock_${id}_${selectedSize}_${stockYear}_${stockMonth}`;
      const savedVal = localStorage.getItem(mKey);

      const isDismissed = dismissedInitModalFor && 
                          dismissedInitModalFor.size === selectedSize && 
                          dismissedInitModalFor.month === stockMonth && 
                          dismissedInitModalFor.year === stockYear;

      if (!hasLogs && savedVal === null && !isDismissed) {
        setShowInitStockModal(true);
        setInitStockValue("");
      } else {
        setShowInitStockModal(false);
      }
    } else {
      setShowInitStockModal(false);
    }
  }, [type, id, selectedSize, stockMonth, stockYear, prodEntries.length, dispEntries.length, dismissedInitModalFor]);

  // Load production and dispatch entries dynamically with Cloud Sync
  useEffect(() => {
    if (!id) return;

    // Load local storage first for fast response
    const pStored = localStorage.getItem(`sms_prod_${id}`);
    const dStored = localStorage.getItem(`sms_disp_${id}`);
    if (pStored) {
      try {
        setProdEntries(JSON.parse(pStored));
      } catch (e) {
        console.error("Error parsing local production:", e);
      }
    }
    if (dStored) {
      try {
        setDispEntries(JSON.parse(dStored));
      } catch (e) {
        console.error("Error parsing local dispatch:", e);
      }
    }

    setIsSyncing(true);
    Promise.all([
      smsStorage.syncProductionFromCloud(id),
      smsStorage.syncDispatchFromCloud(id),
      smsStorage.syncStartingStocksFromCloud(id)
    ]).then(([prod, disp]) => {
      setProdEntries(prod);
      setDispEntries(disp);
      setIsSyncing(false);
    }).catch(err => {
      console.error("Cloud sync failed:", err);
      setIsSyncing(false);
    });

    if (!smsStorage.isCloudEnabled()) return;

    const channel = supabase
      .channel(`sms-realtime-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sms_production", filter: `standard_id=eq.${id}` }, (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const newEntry = {
            ...payload.new.data,
            id: payload.new.id,
            date: payload.new.date,
            size: payload.new.size
          } as ProductionEntry;
          setProdEntries(prev => {
            const all = prev.filter(e => e.id !== newEntry.id);
            all.unshift(newEntry);
            localStorage.setItem(`sms_prod_${id}`, JSON.stringify(all));
            return all;
          });
        } else if (payload.eventType === "DELETE") {
          const deletedId = payload.old.id;
          setProdEntries(prev => {
            const all = prev.filter(e => e.id !== deletedId);
            localStorage.setItem(`sms_prod_${id}`, JSON.stringify(all));
            return all;
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sms_dispatch", filter: `standard_id=eq.${id}` }, (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const newEntry = {
            ...payload.new.data,
            id: payload.new.id,
            date: payload.new.date,
            size: payload.new.size,
            partyName: payload.new.party_name,
            billNo: payload.new.bill_no,
            batchNo: payload.new.batch_no
          } as DispatchEntry;
          setDispEntries(prev => {
            const all = prev.filter(e => e.id !== newEntry.id);
            all.unshift(newEntry);
            localStorage.setItem(`sms_disp_${id}`, JSON.stringify(all));
            return all;
          });
        } else if (payload.eventType === "DELETE") {
          const deletedId = payload.old.id;
          setDispEntries(prev => {
            const all = prev.filter(e => e.id !== deletedId);
            localStorage.setItem(`sms_disp_${id}`, JSON.stringify(all));
            return all;
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sms_starting_stocks", filter: `standard_id=eq.${id}` }, (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          localStorage.setItem(payload.new.id, payload.new.val.toString());
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
  }, [sizes, selectedSize]);

  // Handle case where route standard changes
  useEffect(() => {
    if (sizes.length > 0) {
      setSelectedSize(sizes[0]);
    }
  }, [id]);

  // Keep entries view in sync with prodEntries or dispEntries changes
  useEffect(() => {
    if (type === "production") {
      setEntries(prodEntries);
    } else {
      setEntries(displayedDispEntries);
    }
  }, [type, prodEntries, displayedDispEntries]);

  const saveFullProductionList = async (list: ProductionEntry[]) => {
    setProdEntries(list);
    localStorage.setItem(`sms_prod_${id}`, JSON.stringify(list));
    if (smsStorage.isCloudEnabled()) {
      const payload = list.map(e => ({
        id: e.id,
        standard_id: id || "",
        date: e.date,
        size: e.size,
        data: e
      }));
      await supabase.from("sms_production").upsert(payload);
    }
  };

  const saveFullDispatchList = async (list: DispatchEntry[]) => {
    setDispEntries(list);
    localStorage.setItem(`sms_disp_${id}`, JSON.stringify(list));
    if (smsStorage.isCloudEnabled()) {
      const payload = list.map(e => ({
        id: e.id,
        standard_id: id || "",
        date: e.date,
        size: e.size,
        party_name: e.partyName,
        bill_no: e.billNo,
        batch_no: e.batchNo,
        data: e
      }));
      await supabase.from("sms_dispatch").upsert(payload);
    }
  };

  const saveEntries = async (newEntries: any[]) => {
    setEntries(newEntries);
    if (type === "production") {
      const oldEntries = prodEntries;
      setProdEntries(newEntries);
      localStorage.setItem(`sms_prod_${id}`, JSON.stringify(newEntries));

      const newIds = new Set(newEntries.map(e => e.id));
      const deleted = oldEntries.filter(e => !newIds.has(e.id));
      for (const e of deleted) {
        await smsStorage.deleteProductionEntry(id || "", e.id);
      }

      const oldMap = new Map(oldEntries.map(e => [e.id, e]));
      const changedOrNew = newEntries.filter(e => {
        const old = oldMap.get(e.id);
        return !old || JSON.stringify(old) !== JSON.stringify(e);
      });
      for (const e of changedOrNew) {
        await smsStorage.saveProductionEntry(id || "", e);
      }
    } else {
      const oldEntries = dispEntries;
      setDispEntries(newEntries);
      localStorage.setItem(`sms_disp_${id}`, JSON.stringify(newEntries));

      const newIds = new Set(newEntries.map(e => e.id));
      const deleted = oldEntries.filter(e => !newIds.has(e.id));
      for (const e of deleted) {
        await smsStorage.deleteDispatchEntry(id || "", e.id);
      }

      const oldMap = new Map(oldEntries.map(e => [e.id, e]));
      const changedOrNew = newEntries.filter(e => {
        const old = oldMap.get(e.id);
        return !old || JSON.stringify(old) !== JSON.stringify(e);
      });
      for (const e of changedOrNew) {
        await smsStorage.saveDispatchEntry(id || "", e);
      }
    }
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "production") {
      let entryData: Partial<ProductionEntry> = {
        id: Math.random().toString(36).substring(2, 9),
        date: entryDate,
        size: selectedSize,
        value: Number(value) || 0,
      };

      if (id === "is13488" || id === "is12786") {
        if (!coils || !mtrPerCoil || !kg) return;
        entryData.coils = Number(coils);
        entryData.mtrPerCoil = Number(mtrPerCoil);
        entryData.mtr = Number(coils) * Number(mtrPerCoil);
        entryData.kg = Number(kg);
      } else if (id === "is4985") {
        if (!pipe || !tonn || !kg) return;
        entryData.pipe = Number(pipe);
        entryData.tonn = Number(tonn);
        entryData.kg = Number(kg);
      } else if (id === "is17425") {
        if (!pipe) return;
        entryData.pipe = Number(pipe);
      } else if (id === "is13487") {
        if (!nos) return;
        entryData.nos = Number(nos);
        entryData.thousandUnit = Number(nos) / 1000;
      } else if (id === "is14483") {
        if (!nos) return;
        entryData.nos = Number(nos);
      }

      const updated = [entryData as ProductionEntry, ...entries];
      saveEntries(updated);

      // Reset production inputs
      setCoils("");
      setMtrPerCoil("");
      setKg("");
      setPipe("");
      setTonn("");
      setNos("");
      setValue("");
    } else {
      // Dispatch Entry
      if (!billNo) return;

      // Get matching production entry
      const matchingProd = prodEntries.find(
        (entry) => datesMatch(entry.date, entryDate) && entry.size === selectedSize
      );

      const pQty = (id === "is13488" || id === "is12786") ? (matchingProd ? (matchingProd.mtr || 0) : 0) :
                    (id === "is13487" || id === "is14483" || id === "is17425") ? (matchingProd ? (matchingProd.nos || matchingProd.pipe || 0) : 0) :
                    id === "is4985" ? (matchingProd ? (matchingProd.pipe || 0) : 0) : 0;
      const resolvedBatchNo = pQty > 0 ? entryDate.replace(/-/g, "") : "-";

      let entryData: Partial<DispatchEntry> = {
        id: Math.random().toString(36).substring(2, 9),
        date: entryDate,
        size: selectedSize,
        billNo,
        batchNo: resolvedBatchNo,
        partyName: "-",
      };

      if (id === "is13488" || id === "is12786") {
        const pRollVal = matchingProd ? (matchingProd.coils || 0) : 0;
        const pM = matchingProd ? (matchingProd.mtr || 0) : 0;
        const dM = Number(dispMtr) || 0;
        entryData.prodRoll = pRollVal;
        entryData.prodMtr = pM;
        entryData.dispMtr = dM;
        entryData.closeMtr = pM - dM;
        entryData.partyName = dM > 0 ? "FARMER" : "-";
      } else if (id === "is13487" || id === "is14483" || id === "is17425") {
        const pN = matchingProd ? (matchingProd.nos || matchingProd.pipe || 0) : 0;
        const dN = Number(dispNos) || 0;
        entryData.prodNos = pN;
        entryData.dispNos = dN;
        entryData.closeNos = pN - dN;
        entryData.partyName = dN > 0 ? "FARMER" : "-";
      } else if (id === "is4985") {
        const pP = matchingProd ? (matchingProd.pipe || 0) : 0;
        const dP = Number(dispPipe) || 0;
        entryData.prodPipe = pP;
        entryData.prodMtrPipe = pP * 6;
        entryData.dispPipe = dP;
        entryData.dispMtrPipe = Number(dispMtrPipe) || 0;
        entryData.closePipe = pP - dP;
        entryData.partyName = dP > 0 ? "FARMER" : "-";
      }

      const updated = [entryData as DispatchEntry, ...entries];
      saveEntries(updated);

      // Reset dispatch inputs
      setPartyName("");
      setBillNo("");
      setBatchNo("");
      setProdRoll("");
      setProdMtr("");
      setDispMtr("");
      setProdNos("");
      setDispNos("");
      setProdPipe("");
      setDispPipe("");
      setProdMtrPipe("");
      setDispMtrPipe("");
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    const updated = entries.filter((entry) => entry.id !== entryId);
    saveEntries(updated);
  };

  // Filter entries for the selected size
  const filteredEntries = entries.filter((entry) => entry.size === selectedSize);

  // Compute Rendered Dispatch Entries with dynamic production matching and grouping
  const getDispatchRenderData = (entriesList: DispatchEntry[], targetSize: string = selectedSize): any[] => {
    const dateToFirstId: Record<string, string> = {};
    
    // Group first IDs in rendered order (which maintains stable table view ordering)
    entriesList.forEach((item) => {
      if (!dateToFirstId[item.date]) {
        dateToFirstId[item.date] = item.id;
      }
    });

    const dateRemainingQty: Record<string, number> = {};

    return entriesList.map((entry) => {
      const isFirst = dateToFirstId[entry.date] === entry.id;
      const matchingProd = prodEntries.find(p => datesMatch(p.date, entry.date) && p.size === targetSize);
      
      if (dateRemainingQty[entry.date] === undefined) {
        let pQty = 0;
        if (matchingProd) {
          if (id === "is13488" || id === "is12786") {
            pQty = matchingProd.mtr || 0;
          } else if (id === "is13487" || id === "is14483" || id === "is17425") {
            pQty = matchingProd.nos || matchingProd.pipe || 0;
          } else if (id === "is4985") {
            pQty = matchingProd.pipe || 0;
          }
        }
        dateRemainingQty[entry.date] = pQty;
      }

      let prodRoll = 0;
      let prodMtr = 0;
      let prodNos = 0;
      let prodPipe = 0;
      let prodMtrPipe = 0;

      const dispMtr = entry.dispMtr || 0;
      const dispNos = entry.dispNos || 0;
      const dispPipe = entry.dispPipe || 0;

      if (isFirst && matchingProd) {
        if (id === "is13488" || id === "is12786") {
          prodRoll = matchingProd.coils || 0;
          prodMtr = matchingProd.mtr || 0;
        } else if (id === "is13487" || id === "is14483" || id === "is17425") {
          prodNos = matchingProd.nos || matchingProd.pipe || 0;
        } else if (id === "is4985") {
          prodPipe = matchingProd.pipe || 0;
          prodMtrPipe = matchingProd.pipe * 6;
        }
      }

      let closeMtr = 0;
      let closeNos = 0;
      let closePipe = 0;

      if (id === "is13488" || id === "is12786") {
        dateRemainingQty[entry.date] -= dispMtr;
        closeMtr = dateRemainingQty[entry.date];
      } else if (id === "is13487" || id === "is14483" || id === "is17425") {
        dateRemainingQty[entry.date] -= dispNos;
        closeNos = dateRemainingQty[entry.date];
      } else if (id === "is4985") {
        dateRemainingQty[entry.date] -= dispPipe;
        closePipe = dateRemainingQty[entry.date];
      }

      const hasProdQty = isFirst && matchingProd && (
        (id === "is13488" || id === "is12786") ? ((matchingProd.mtr || 0) > 0) :
        (id === "is13487" || id === "is14483" || id === "is17425") ? (((matchingProd.nos || matchingProd.pipe || 0)) > 0) :
        (id === "is4985") ? ((matchingProd.pipe || 0) > 0) : false
      );

      return {
        ...entry,
        prodRoll,
        prodMtr,
        prodNos,
        prodPipe,
        prodMtrPipe,
        closeMtr,
        closeNos,
        closePipe,
        batchNo: hasProdQty ? entry.date.replace(/-/g, "") : "-"
      };
    });
  };

  const renderedEntries = getDispatchRenderData(filteredEntries);

  // Compute Production Totals
  const totalCoils = filteredEntries.reduce((sum, item) => sum + (item.coils || 0), 0);
  const totalMtr = filteredEntries.reduce((sum, item) => sum + (item.mtr || 0), 0);
  const totalKg = filteredEntries.reduce((sum, item) => sum + (item.kg || 0), 0);
  const totalPipe = filteredEntries.reduce((sum, item) => sum + (item.pipe || 0), 0);
  const totalTonn = filteredEntries.reduce((sum, item) => sum + (item.tonn || 0), 0);
  const totalNos = filteredEntries.reduce((sum, item) => sum + (item.nos || 0), 0);
  const totalThousand = filteredEntries.reduce((sum, item) => sum + (item.thousandUnit || 0), 0);
  const totalValue = filteredEntries.reduce((sum, item) => sum + (item.value || 0), 0);

  // Compute Dispatch Totals using renderedEntries
  const totalProdRoll = renderedEntries.reduce((sum, item) => sum + (item.prodRoll || 0), 0);
  const totalProdMtr = renderedEntries.reduce((sum, item) => sum + (item.prodMtr || 0), 0);
  const totalDispMtr = renderedEntries.reduce((sum, item) => sum + (item.dispMtr || 0), 0);
  const totalCloseMtr = totalProdMtr - totalDispMtr;

  const totalProdNos = renderedEntries.reduce((sum, item) => sum + (item.prodNos || 0), 0);
  const totalDispNos = renderedEntries.reduce((sum, item) => sum + (item.dispNos || 0), 0);
  const totalCloseNos = totalProdNos - totalDispNos;

  const totalProdPipe = renderedEntries.reduce((sum, item) => sum + (item.prodPipe || 0), 0);
  const totalProdMtrPipe = renderedEntries.reduce((sum, item) => sum + (item.prodMtrPipe || 0), 0);
  const totalDispPipe = renderedEntries.reduce((sum, item) => sum + (item.dispPipe || 0), 0);
  const totalDispMtrPipe = renderedEntries.reduce((sum, item) => sum + (item.dispMtrPipe || 0), 0);
  const totalClosePipe = totalProdPipe - totalDispPipe;

  // Auto-calculated computed values for display in form
  const computedFormMtr = (Number(coils) || 0) * (Number(mtrPerCoil) || 0);
  const computedThousandNos = (Number(nos) || 0) / 1000;

  // Get matching production entry for current form selections
  const currentMatchingProd = prodEntries.find(
    (entry) => datesMatch(entry.date, entryDate) && entry.size === selectedSize
  );

  // Dispatch computations
  const computedDispMtrClose = (currentMatchingProd ? (currentMatchingProd.mtr || 0) : 0) - (Number(dispMtr) || 0);
  const computedDispNosClose = (currentMatchingProd ? (currentMatchingProd.nos || currentMatchingProd.pipe || 0) : 0) - (Number(dispNos) || 0);
  const computedDispPipeClose = (currentMatchingProd ? (currentMatchingProd.pipe || 0) : 0) - (Number(dispPipe) || 0);

  // Helper to compute Dispatch Batch No dynamically
  const getComputedBatchNo = () => {
    let hasProd = false;
    if (id === "is13488" || id === "is12786") {
      hasProd = currentMatchingProd ? (currentMatchingProd.mtr || 0) > 0 : false;
    } else if (id === "is13487" || id === "is14483" || id === "is17425") {
      hasProd = currentMatchingProd ? (currentMatchingProd.nos || currentMatchingProd.pipe || 0) > 0 : false;
    } else if (id === "is4985") {
      hasProd = currentMatchingProd ? (currentMatchingProd.pipe || 0) > 0 : false;
    }
    
    if (hasProd && entryDate) {
      return entryDate.replace(/-/g, "");
    }
    return "-";
  };

  // Daily Stock Computations
  const sizeProdEntries = prodEntries.filter((e) => e.size === selectedSize);
  const sizeDispEntries = dispEntries.filter((e) => e.size === selectedSize);

  const combinedStockEntries = (() => {
    const list: any[] = [];
    
    // Find the oldest date in logs or saved starting stocks to start our ledger timeline
    let startYear = Number(fromYear);
    let startMonth = MONTHS.indexOf(fromMonth) + 1;

    const allLogs = [...prodEntries, ...dispEntries];
    if (allLogs.length > 0) {
      allLogs.forEach((log) => {
        const parts = log.date.split("-");
        if (parts.length >= 2) {
          const y = Number(parts[0]);
          const m = Number(parts[1]);
          if (y < startYear || (y === startYear && m < startMonth)) {
            startYear = y;
            startMonth = m;
          }
        }
      });
    }

    // Scan localStorage for oldest month with saved stock balance for this size
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`sms_last_stock_${id}_${selectedSize}_`)) {
        const parts = key.split("_");
        if (parts.length >= 7) {
          const yr = Number(parts[parts.length - 2]);
          const monthName = parts[parts.length - 1];
          const mIdx = MONTHS.indexOf(monthName);
          if (!isNaN(yr) && mIdx !== -1) {
            const m = mIdx + 1;
            if (yr < startYear || (yr === startYear && m < startMonth)) {
              startYear = yr;
              startMonth = m;
            }
          }
        }
      }
    }

    const endYear = Number(toYear);
    const endMonth = MONTHS.indexOf(toMonth) + 1;

    // Generate month-by-month period keys YYYY-MM
    const periodKeys: string[] = [];
    let curY = startYear;
    let curM = startMonth;

    while (curY < endYear || (curY === endYear && curM <= endMonth)) {
      const mStr = curM < 10 ? `0${curM}` : `${curM}`;
      periodKeys.push(`${curY}-${mStr}`);
      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }

    let prevPeriodEndStock = 0;
    let hasFoundFirstManual = false;

    periodKeys.forEach((periodKey) => {
      const [yr, mo] = periodKey.split("-");
      const monthName = MONTHS[Number(mo) - 1];

      const manualKey = `sms_last_stock_${id}_${selectedSize}_${yr}_${monthName}`;
      const manualValStr = localStorage.getItem(manualKey);

      let periodStartStock = prevPeriodEndStock;

      if (manualValStr !== null) {
        periodStartStock = Number(manualValStr) || 0;
        hasFoundFirstManual = true;
      } else if (!hasFoundFirstManual) {
        const oldFallback = localStorage.getItem(`sms_last_stock_${id}_${selectedSize}`);
        if (oldFallback !== null) {
          periodStartStock = Number(oldFallback) || 0;
        } else {
          periodStartStock = 0;
        }
        hasFoundFirstManual = true;
      }

      let runningStock = periodStartStock;

      // Generate all calendar dates in this month, but no further than today
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const numDays = new Date(Number(yr), Number(mo), 0).getDate();
      for (let day = 1; day <= numDays; day++) {
        const dStr = day < 10 ? `0${day}` : `${day}`;
        const dt = `${yr}-${mo}-${dStr}`;
        if (dt > todayStr) break;

        // Get logs for selected size and date
        const dProds = sizeProdEntries.filter(e => datesMatch(e.date, dt));
        const dDisps = sizeDispEntries.filter(e => datesMatch(e.date, dt));

        if (dDisps.length > 0) {
          dDisps.forEach((d, idx) => {
            const isFirstDisp = idx === 0;
            let prodRollVal = 0;
            let prodMtrVal = 0;
            let prodNosVal = 0;
            let prodPipeVal = 0;
            let prodMtrPipeVal = 0;

            let prodQty = 0;
            let dispQty = 0;

            if (isFirstDisp && dProds.length > 0) {
              const p = dProds[0];
              prodRollVal = p.coils || 0;
              prodMtrVal = p.mtr || 0;
              prodNosVal = p.nos || p.pipe || 0;
              prodPipeVal = p.pipe || 0;
              prodMtrPipeVal = (p.pipe || 0) * 6;

              if (id === "is13488" || id === "is12786") {
                prodQty = p.mtr || 0;
              } else if (id === "is13487" || id === "is14483" || id === "is17425") {
                prodQty = p.nos || p.pipe || 0;
              } else if (id === "is4985") {
                prodQty = p.pipe || 0;
              }
            }

            if (id === "is13488" || id === "is12786") {
              dispQty = d.dispMtr || 0;
            } else if (id === "is13487" || id === "is14483" || id === "is17425") {
              dispQty = d.dispNos || 0;
            } else if (id === "is4985") {
              dispQty = d.dispPipe || 0;
            }

            runningStock = runningStock + prodQty - dispQty;

            list.push({
              id: `disp-${d.id}`,
              date: dt,
              partyName: d.partyName || "FARMER",
              billNo: d.billNo || "-",
              batchNo: (isFirstDisp && prodQty > 0) ? dt.replace(/-/g, "") : "-",
              prodRoll: prodRollVal,
              prodMtr: prodMtrVal,
              prodNos: prodNosVal,
              prodPipe: prodPipeVal,
              prodMtrPipe: prodMtrPipeVal,
              dispMtr: d.dispMtr || 0,
              dispNos: d.dispNos || 0,
              dispPipe: d.dispPipe || 0,
              dispMtrPipe: d.dispMtrPipe || 0,
              closingStock: runningStock
            });
          });
        } else if (dProds.length > 0) {
          dProds.forEach((p) => {
            const prodRollVal = p.coils || 0;
            const prodMtrVal = p.mtr || 0;
            const prodNosVal = p.nos || p.pipe || 0;
            const prodPipeVal = p.pipe || 0;
            const prodMtrPipeVal = (p.pipe || 0) * 6;

            let prodQty = 0;
            if (id === "is13488" || id === "is12786") {
              prodQty = p.mtr || 0;
            } else if (id === "is13487" || id === "is14483" || id === "is17425") {
              prodQty = p.nos || p.pipe || 0;
            } else if (id === "is4985") {
              prodQty = p.pipe || 0;
            }

            runningStock = runningStock + prodQty;

            list.push({
              id: `prod-${p.id}`,
              date: dt,
              partyName: "-",
              billNo: "-",
              batchNo: dt.replace(/-/g, ""),
              prodRoll: prodRollVal,
              prodMtr: prodMtrVal,
              prodNos: prodNosVal,
              prodPipe: prodPipeVal,
              prodMtrPipe: prodMtrPipeVal,
              dispMtr: 0,
              dispNos: 0,
              dispPipe: 0,
              dispMtrPipe: 0,
              closingStock: runningStock
            });
          });
        } else {
          list.push({
            id: `empty-${dt}`,
            date: dt,
            partyName: "-",
            billNo: "-",
            batchNo: "-",
            prodRoll: 0,
            prodMtr: 0,
            prodNos: 0,
            prodPipe: 0,
            prodMtrPipe: 0,
            dispMtr: 0,
            dispNos: 0,
            dispPipe: 0,
            dispMtrPipe: 0,
            closingStock: runningStock
          });
        }
      }

      prevPeriodEndStock = runningStock;
    });

    return list;
  })();

  // Helper to determine the auto-calculated closing stock of the preceding month
  const getAutoClosingStockForPrevMonth = () => {
    const mIdx = MONTHS.indexOf(stockMonth) + 1;
    const mStr = mIdx < 10 ? `0${mIdx}` : `${mIdx}`;
    const targetPeriod = `${stockYear}-${mStr}`;

    const matchingEntry = [...combinedStockEntries].reverse().find((entry) => {
      const [entryYr, entryMo] = entry.date.split("-");
      const entryPeriod = `${entryYr}-${entryMo}`;
      return entryPeriod <= targetPeriod;
    });

    if (matchingEntry) {
      return matchingEntry.closingStock.toString();
    }

    const manualKey = `sms_last_stock_${id}_${selectedSize}_${stockYear}_${stockMonth}`;
    const saved = localStorage.getItem(manualKey);
    if (saved !== null) {
      return saved;
    }

    const hasLogs = hasEntriesInPrevMonth();
    if (!hasLogs) {
      return "-";
    }

    return "0";
  };

  // Helper to check if there are entries in the preceding month
  const hasEntriesInPrevMonth = () => {
    const mIdx = MONTHS.indexOf(stockMonth) + 1;
    const mStr = mIdx < 10 ? `0${mIdx}` : `${mIdx}`;
    const targetPeriod = `${stockYear}-${mStr}`;

    return combinedStockEntries.some((entry) => {
      const [entryYr, entryMo] = entry.date.split("-");
      const entryPeriod = `${entryYr}-${entryMo}`;
      return entryPeriod === targetPeriod;
    });
  };

  // Filter combined stock entries based on selected range (fromMonth/fromYear to toMonth/toYear)
  const filteredStockEntries = combinedStockEntries.filter((entry) => {
    const parts = entry.date.split("-");
    if (parts.length < 2) return false;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const mIdx = m - 1;

    const fromMIdx = MONTHS.indexOf(fromMonth);
    const fromYr = Number(fromYear);
    const toMIdx = MONTHS.indexOf(toMonth);
    const toYr = Number(toYear);

    const isAfterFrom = y > fromYr || (y === fromYr && mIdx >= fromMIdx);
    const isBeforeTo = y < toYr || (y === toYr && mIdx <= toMIdx);

    return isAfterFrom && isBeforeTo;
  });

  const stockTotalProdRoll = filteredStockEntries.reduce((sum, item) => sum + item.prodRoll, 0);
  const stockTotalProdMtr = filteredStockEntries.reduce((sum, item) => sum + item.prodMtr, 0);
  const stockTotalProdNos = filteredStockEntries.reduce((sum, item) => sum + item.prodNos, 0);
  const stockTotalProdPipe = filteredStockEntries.reduce((sum, item) => sum + item.prodPipe, 0);
  const stockTotalProdMtrPipe = filteredStockEntries.reduce((sum, item) => sum + item.prodMtrPipe, 0);

  const stockTotalDispMtr = filteredStockEntries.reduce((sum, item) => sum + item.dispMtr, 0);
  const stockTotalDispNos = filteredStockEntries.reduce((sum, item) => sum + item.dispNos, 0);
  const stockTotalDispPipe = filteredStockEntries.reduce((sum, item) => sum + item.dispPipe, 0);
  const stockTotalDispMtrPipe = filteredStockEntries.reduce((sum, item) => sum + item.dispMtrPipe, 0);

  // Download Production Excel Template
  const handleDownloadProdTemplate = () => {
    let headers: string[] = [];
    let sampleRows: any[] = [];
    const todayStr = formatDateToDMY(new Date().toISOString().split("T")[0]);

    if (id === "is13488" || id === "is12786") {
      headers = ["Date (DD/MM/YYYY)", "Size", "Coils", "Mtr Per Coil", "Mtr", "Kg", "Value"];
      sampleRows = sizes.map(sz => ({
        "Date (DD/MM/YYYY)": todayStr,
        "Size": sz,
        "Coils": 10,
        "Mtr Per Coil": 500,
        "Mtr": 5000,
        "Kg": 250,
        "Value": 15000
      }));
    } else if (id === "is4985") {
      headers = ["Date (DD/MM/YYYY)", "Size", "Pipe", "Kg", "Tonn", "Value"];
      sampleRows = sizes.map(sz => ({
        "Date (DD/MM/YYYY)": todayStr,
        "Size": sz,
        "Pipe": 20,
        "Kg": 180,
        "Tonn": 0.18,
        "Value": 25000
      }));
    } else if (id === "is17425") {
      headers = ["Date (DD/MM/YYYY)", "Size", "Pipe", "Value"];
      sampleRows = sizes.map(sz => ({
        "Date (DD/MM/YYYY)": todayStr,
        "Size": sz,
        "Pipe": 20,
        "Value": 12000
      }));
    } else if (id === "is13487") {
      headers = ["Date (DD/MM/YYYY)", "Size", "Nos", "Thousand Unit", "Value"];
      sampleRows = sizes.map(sz => ({
        "Date (DD/MM/YYYY)": todayStr,
        "Size": sz,
        "Nos": 5000,
        "Thousand Unit": 5,
        "Value": 8000
      }));
    } else {
      headers = ["Date (DD/MM/YYYY)", "Size", "Nos", "Value"];
      sampleRows = sizes.map(sz => ({
        "Date (DD/MM/YYYY)": todayStr,
        "Size": sz,
        "Nos": 200,
        "Value": 9000
      }));
    }

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Production");
    XLSX.writeFile(wb, `${id?.toUpperCase()}_Production_Template.xlsx`);
  };

  // Download Dispatch Excel Template
  const handleDownloadDispTemplate = () => {
    let headers: string[] = [];
    let sampleRows: any[] = [];
    const todayStr = formatDateToDMY(new Date().toISOString().split("T")[0]);

    if (id === "is13488" || id === "is12786") {
      headers = ["Date (DD/MM/YYYY)", "Size", "Party Name", "Bill No", "Batch No", "Mtr", "Value"];
      sampleRows = sizes.map((sz, idx) => ({
        "Date (DD/MM/YYYY)": todayStr,
        "Size": sz,
        "Party Name": "Sample Party Ltd",
        "Bill No": `B-${1000 + idx}`,
        "Batch No": `BAT-2026${idx}`,
        "Mtr": 2000,
        "Value": 6000
      }));
    } else if (id === "is4985") {
      headers = ["Date (DD/MM/YYYY)", "Size", "Party Name", "Bill No", "Batch No", "Pipe", "Mtr", "Value"];
      sampleRows = sizes.map((sz, idx) => ({
        "Date (DD/MM/YYYY)": todayStr,
        "Size": sz,
        "Party Name": "Sample Party Ltd",
        "Bill No": `B-${1000 + idx}`,
        "Batch No": `BAT-2026${idx}`,
        "Pipe": 10,
        "Mtr": 60,
        "Value": 8000
      }));
    } else {
      headers = ["Date (DD/MM/YYYY)", "Size", "Party Name", "Bill No", "Batch No", "Nos", "Value"];
      sampleRows = sizes.map((sz, idx) => ({
        "Date (DD/MM/YYYY)": todayStr,
        "Size": sz,
        "Party Name": "Sample Party Ltd",
        "Bill No": `B-${1000 + idx}`,
        "Batch No": `BAT-2026${idx}`,
        "Nos": 50,
        "Value": 4500
      }));
    }

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispatch");
    XLSX.writeFile(wb, `${id?.toUpperCase()}_Dispatch_Template.xlsx`);
  };

  // Parser helper
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
      } catch (e) {
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
      if (yr.length === 3) {
        if (yr.startsWith("20")) yr = yr.replace(/^20/, "202");
        else yr = "20" + yr;
      }
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

  const mapItemToSize = (itemName: string, stdId: string): string | null => {
    const itemLower = itemName.toLowerCase();
    
    if (stdId === "is13487") {
      if (!itemLower.includes("dripper") && !itemLower.includes("emitter")) return null;
      const cleanItem = itemLower.replace(/\s+/g, "");
      // IMPORTANT: Check 14lph BEFORE 4lph because "14lph" contains "4lph" as a substring
      if (cleanItem.includes("14lph")) return "14 LPH";
      if (cleanItem.includes("8lph")) return "8 LPH";
      if (cleanItem.includes("4lph")) return "4 LPH";
      return null;
    }

    if (stdId === "is13488") {
      if (!itemLower.includes("emitting")) return null;
      const isCl1 = itemLower.includes("class i") || itemLower.includes("class-i") || itemLower.includes("cl-i") || itemLower.includes("cl-1");
      const isCl2 = itemLower.includes("class ii") || itemLower.includes("class-ii") || itemLower.includes("cl-ii") || itemLower.includes("cl-2");
      const is12 = itemLower.includes("12mm") || itemLower.includes(" 12");
      const is16 = itemLower.includes("16mm") || itemLower.includes(" 16");
      const is20 = itemLower.includes("20mm") || itemLower.includes(" 20");

      if (is12 && isCl2) return "12mm Cl-2";
      if (is16 && isCl1) return "16mm CL-1";
      if (is16 && isCl2) return "16mm Cl-2";
      if (is20 && isCl1) return "20mm Cl-1";
      return null;
    }

    if (stdId === "is12786") {
      if (!itemLower.includes("lateral")) return null;
      let isCl1 = false;
      let isCl2 = false;

      if (itemLower.includes("2.5kg")) {
        isCl2 = true;
      } else if (itemLower.includes("2.0kg")) {
        isCl1 = true;
      } else {
        isCl1 = /\bcl-i\b/i.test(itemLower) || /\bclass-i\b/i.test(itemLower) || /\bclass i\b/i.test(itemLower) || /\bcl-1\b/i.test(itemLower);
        isCl2 = /\bcl-ii\b/i.test(itemLower) || /\bclass-ii\b/i.test(itemLower) || /\bclass ii\b/i.test(itemLower) || /\bcl-2\b/i.test(itemLower);
      }

      const is12 = itemLower.includes("12mm") || itemLower.includes(" 12");
      const is16 = itemLower.includes("16mm") || itemLower.includes(" 16");
      const is20 = itemLower.includes("20mm") || itemLower.includes(" 20");
      const is32 = itemLower.includes("32mm") || itemLower.includes(" 32");

      if (is12) return "12mm Cl-2";
      if (is16) {
        if (isCl1) return "16mm Cl-1";
        return "16mm Cl-2";
      }
      if (is20) {
        if (isCl1) return "20mm Cl-1";
        return "20mm Cl-2";
      }
      if (is32) return "32mm Cl-2";
      return null;
    }

    if (stdId === "is4985") {
      if (!itemLower.includes("pvc")) return null;
      const isCl2 = itemLower.includes("4kg") || itemLower.includes("class 2") || itemLower.includes("cl-2");
      const isCl3 = itemLower.includes("6kg") || itemLower.includes("class 3") || itemLower.includes("cl-3");
      
      const diameters = ["63mm", "75mm", "90mm", "110mm", "140mm", "160mm"];
      for (const dia of diameters) {
        if (itemLower.includes(dia)) {
          if (isCl3) return `${dia} Cl-3`;
          return `${dia} Cl-2`;
        }
      }
      return null;
    }

    if (stdId === "is17425") {
      if (!itemLower.includes("hdpe") && !itemLower.includes("sprinkler")) return null;
      const is75 = itemLower.includes("75mm");
      const is90 = itemLower.includes("90mm");
      const isCl2 = itemLower.includes("class ii") || itemLower.includes("cl-2") || itemLower.includes("class 2");
      
      if (is75) {
        if (isCl2) return "75mm Cl-2";
        return "75mm Cl-1";
      }
      if (is90) return "90mm Cl-1";
      return null;
    }

    if (stdId === "is14483") {
      if (!itemLower.includes("venturi") && !itemLower.includes("injector")) return null;
      if (itemLower.includes("1\"") || itemLower.includes("25mm")) return "V-1\" (25mm)";
      if (itemLower.includes("2\"") || itemLower.includes("50mm")) return "V-2\" (50mm)";
      return null;
    }

    return null;
  };

  // Parse and Import Production Excel File
  const handleImportProdExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: false });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        if (!ws) {
          setImportStatus({ type: "error", message: "Production sheet not found in the file." });
          return;
        }

        let importedEntries: ProductionEntry[] = [];
        let errorMessages: string[] = [];

        if (id === "is13488" || id === "is12786") {
          // Customized parser for IS 13488 Emitting Pipe and IS 12786 Plain Laterals
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          // Find Header Row
          let headerRowIdx = -1;
          for (let r = 0; r < Math.min(data.length, 15); r++) {
            const row = data[r];
            if (row && row.some(cell => String(cell).trim().toUpperCase() === "DATE") &&
                       row.some(cell => String(cell).trim().toUpperCase().includes("SIZE"))) {
              headerRowIdx = r;
              break;
            }
          }

          if (headerRowIdx === -1) {
            setImportStatus({ type: "error", message: "Failed to find headers containing 'DATE' and 'SIZE & CLASS' in the first 15 rows of the Excel sheet." });
            return;
          }

          const headers = data[headerRowIdx].map(h => String(h || "").trim().toUpperCase());
          const dateColIdx = headers.findIndex(h => h.includes("DATE"));
          const sizeColIdx = headers.findIndex(h => h.includes("SIZE"));
          const coilColIdx = headers.findIndex(h => h.includes("COIL"));
          const mtrPerCoilColIdx = headers.findIndex(h => h.includes("MTR PER COIL") || (h.includes("MTR") && h.includes("COIL")));
          const mtrColIdx = headers.findIndex(h => h.includes("MTR") && !h.includes("COIL") && !h.includes("PER"));
          const kgColIdx = headers.findIndex(h => h.includes("KG") || h.includes("WEIGHT"));
          const valColIdx = headers.findIndex(h => h.includes("VALUE") || h.includes("RS"));

          if (dateColIdx === -1 || sizeColIdx === -1) {
            setImportStatus({ type: "error", message: "Missing required columns 'DATE' or 'SIZE & CLASS' in header row." });
            return;
          }

          const grouped: Record<string, ProductionEntry> = {};
          const mtrPerCoilGroups: Record<string, number[]> = {};

          for (let r = headerRowIdx + 1; r < data.length; r++) {
            const row = data[r];
            if (!row || row.length === 0 || row[dateColIdx] === undefined || row[dateColIdx] === null || String(row[dateColIdx]).trim() === "") continue;

            // Skip total and summary footer rows
            const dateStr = String(row[dateColIdx]).trim();
            if (dateStr.toLowerCase().startsWith("total") || dateStr.toLowerCase().includes("daily")) {
              continue;
            }

            const dateVal = parseExcelDate(row[dateColIdx]);
            const rawSize = String(row[sizeColIdx] || "").trim();
            if (!rawSize) continue;

            // Match size case-insensitively
            const normalizedSize = sizes.find(s => s.toLowerCase() === rawSize.toLowerCase());
            if (!normalizedSize) {
              errorMessages.push(`Row ${r + 1}: Size "${rawSize}" is not configured for standard ${id}.`);
              continue;
            }

            const coilsVal = coilColIdx !== -1 ? (Number(row[coilColIdx]) || 0) : 0;
            const mtrPerCoilVal = mtrPerCoilColIdx !== -1 ? (Number(row[mtrPerCoilColIdx]) || 0) : 0;
            const mtrVal = mtrColIdx !== -1 ? (Number(row[mtrColIdx]) || 0) : (coilsVal * mtrPerCoilVal);
            const kgVal = kgColIdx !== -1 ? (Number(row[kgColIdx]) || 0) : 0;
            const valVal = valColIdx !== -1 ? (Number(row[valColIdx]) || 0) : 0;

            const key = `${dateVal}_${normalizedSize}`;
            if (!grouped[key]) {
              grouped[key] = {
                id: `${Date.now()}_prod_${Math.random().toString(36).substr(2, 9)}_${r}`,
                date: dateVal,
                size: normalizedSize,
                coils: 0,
                mtrPerCoil: 0,
                mtr: 0,
                kg: 0,
                value: 0
              };
              mtrPerCoilGroups[key] = [];
            }

            grouped[key].coils = (grouped[key].coils || 0) + coilsVal;
            grouped[key].mtr = (grouped[key].mtr || 0) + mtrVal;
            grouped[key].kg = Number(((grouped[key].kg || 0) + kgVal).toFixed(2));
            grouped[key].value = (grouped[key].value || 0) + Math.round(valVal);
            if (mtrPerCoilVal > 0) {
              mtrPerCoilGroups[key].push(mtrPerCoilVal);
            }
          }

          // Process the grouped entries to finalize coil lengths and counts
          Object.keys(grouped).forEach(k => {
            const entry = grouped[k];
            if (id === "is12786") {
              const mtrPerCoilVals = mtrPerCoilGroups[k] || [];
              let targetMtrPerCoil = 500; // default fallback
              if (mtrPerCoilVals.length > 0) {
                const uniqueVals = Array.from(new Set(mtrPerCoilVals));
                if (uniqueVals.length === 1) {
                  targetMtrPerCoil = uniqueVals[0];
                } else {
                  // Mixed coil lengths (e.g. 200 and 500). Pick the larger target length.
                  targetMtrPerCoil = Math.max(...uniqueVals);
                }
              }
              entry.mtrPerCoil = targetMtrPerCoil;
              entry.coils = Math.round((entry.mtr || 0) / targetMtrPerCoil);
            } else {
              // Existing average calculation for is13488
              if (entry.coils && entry.coils > 0) {
                entry.mtrPerCoil = Math.round((entry.mtr || 0) / entry.coils);
              }
            }
          });

          importedEntries = Object.values(grouped);
        } else if (id === "is13487") {
          // Customized parser for IS 13487 Emitters
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          // Find Header Row
          let headerRowIdx = -1;
          for (let r = 0; r < Math.min(data.length, 15); r++) {
            const row = data[r];
            if (row && row.some(cell => String(cell).trim().toUpperCase() === "DATE") &&
                       row.some(cell => String(cell).trim().toUpperCase().includes("SIZE"))) {
              headerRowIdx = r;
              break;
            }
          }

          if (headerRowIdx === -1) {
            setImportStatus({ type: "error", message: "Failed to find headers containing 'DATE' and 'SIZE' in the first 15 rows of the Excel sheet." });
            return;
          }

          const headers = data[headerRowIdx].map(h => String(h || "").trim().toUpperCase());
          const dateColIdx = headers.findIndex(h => h.includes("DATE"));
          const sizeColIdx = headers.findIndex(h => h.includes("SIZE"));
          const nosColIdx = headers.findIndex(h => h.includes("PRODUCTION") || h.includes("NOS") || h.includes("QTY"));
          const unitColIdx = headers.findIndex(h => h.includes("UNIT") || h.includes("THOUSAND"));
          const valColIdx = headers.findIndex(h => h.includes("VALUE") || h.includes("RS") || h.includes("PRICE"));

          if (dateColIdx === -1 || sizeColIdx === -1) {
            setImportStatus({ type: "error", message: "Missing required columns 'DATE' or 'SIZE' in header row." });
            return;
          }

          const grouped: Record<string, ProductionEntry> = {};

          for (let r = headerRowIdx + 1; r < data.length; r++) {
            const row = data[r];
            if (!row || row.length === 0 || row[dateColIdx] === undefined || row[dateColIdx] === null || String(row[dateColIdx]).trim() === "") continue;

            const dateVal = parseExcelDate(row[dateColIdx]);
            const rawSize = String(row[sizeColIdx] || "").trim();
            if (!rawSize) continue;

            // Match size case-insensitively
            const normalizedSize = sizes.find(s => s.toLowerCase() === rawSize.toLowerCase());
            if (!normalizedSize) {
              errorMessages.push(`Row ${r + 1}: Size "${rawSize}" is not configured for standard ${id}.`);
              continue;
            }

            const nosVal = nosColIdx !== -1 ? (Number(row[nosColIdx]) || 0) : 0;
            const thousandVal = unitColIdx !== -1 && row[unitColIdx] !== undefined ? (Number(row[unitColIdx]) || 0) : (nosVal / 1000);
            const valVal = valColIdx !== -1 ? (Number(row[valColIdx]) || 0) : 0;

            const key = `${dateVal}_${normalizedSize}`;
            if (!grouped[key]) {
              grouped[key] = {
                id: `${Date.now()}_prod_${Math.random().toString(36).substr(2, 9)}_${r}`,
                date: dateVal,
                size: normalizedSize,
                nos: 0,
                thousandUnit: 0,
                value: 0
              };
            }

            grouped[key].nos = (grouped[key].nos || 0) + nosVal;
            grouped[key].thousandUnit = Number(((grouped[key].thousandUnit || 0) + thousandVal).toFixed(3));
            grouped[key].value = (grouped[key].value || 0) + Math.round(valVal);
          }

          importedEntries = Object.values(grouped);
        } else if (id === "is4985") {
          // Customized parser for IS 4985 uPVC Pipe
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          // Find Header Row
          let headerRowIdx = -1;
          for (let r = 0; r < Math.min(data.length, 15); r++) {
            const row = data[r];
            if (row && row.some(cell => String(cell).trim().toUpperCase() === "DATE") &&
                       row.some(cell => String(cell).trim().toUpperCase().includes("SIZE"))) {
              headerRowIdx = r;
              break;
            }
          }

          if (headerRowIdx === -1) {
            setImportStatus({ type: "error", message: "Failed to find headers containing 'DATE' and 'SIZE & CLASS' in the first 15 rows of the Excel sheet." });
            return;
          }

          const headers = data[headerRowIdx].map(h => String(h || "").trim().toUpperCase());
          const dateColIdx = headers.findIndex(h => h.includes("DATE"));
          const sizeColIdx = headers.findIndex(h => h.includes("SIZE"));
          const pipeColIdx = headers.findIndex(h => h.includes("PIPE") || h.includes("QTY"));
          const tonnColIdx = headers.findIndex(h => h.includes("TON") || h.includes("TONN") || h.includes("WEIGHT"));
          const valColIdx = headers.findIndex(h => h.includes("VALUE") || h.includes("RS"));

          if (dateColIdx === -1 || sizeColIdx === -1) {
            setImportStatus({ type: "error", message: "Missing required columns 'DATE' or 'SIZE & CLASS' in header row." });
            return;
          }

          const grouped: Record<string, ProductionEntry> = {};

          for (let r = headerRowIdx + 1; r < data.length; r++) {
            const row = data[r];
            if (!row || row.length === 0 || row[dateColIdx] === undefined || row[dateColIdx] === null || String(row[dateColIdx]).trim() === "") continue;

            // Skip total and summary footer rows
            const dateStr = String(row[dateColIdx]).trim();
            if (dateStr.toLowerCase().startsWith("total") || dateStr.toLowerCase().includes("daily")) {
              continue;
            }

            const dateVal = parseExcelDate(row[dateColIdx]);
            const rawSize = String(row[sizeColIdx] || "").trim();
            if (!rawSize) continue;

            const normalizedSize = sizes.find(s => s.toLowerCase() === rawSize.toLowerCase());
            if (!normalizedSize) {
              errorMessages.push(`Row ${r + 1}: Size "${rawSize}" is not configured for standard ${id}.`);
              continue;
            }

            const pipeVal = pipeColIdx !== -1 ? (Number(row[pipeColIdx]) || 0) : 0;
            const tonnVal = tonnColIdx !== -1 ? (Number(row[tonnColIdx]) || 0) : 0;
            // kg is calculated as tonnVal * 1000, or from weight conversion rates if tonn is 0
            let kgVal = tonnVal * 1000;
            if (kgVal === 0 && pipeVal > 0) {
              const weightKey = `sms_conv_weight_${id}_${normalizedSize}`;
              const weightPerPipe = Number(localStorage.getItem(weightKey)) || 0;
              kgVal = pipeVal * weightPerPipe;
            }
            const valVal = valColIdx !== -1 ? (Number(row[valColIdx]) || 0) : 0;

            const key = `${dateVal}_${normalizedSize}`;
            if (!grouped[key]) {
              grouped[key] = {
                id: `${Date.now()}_prod_${Math.random().toString(36).substr(2, 9)}_${r}`,
                date: dateVal,
                size: normalizedSize,
                pipe: 0,
                tonn: 0,
                kg: 0,
                value: 0
              };
            }

            grouped[key].pipe = (grouped[key].pipe || 0) + pipeVal;
            grouped[key].tonn = Number(((grouped[key].tonn || 0) + tonnVal).toFixed(3));
            grouped[key].kg = Number(((grouped[key].kg || 0) + kgVal).toFixed(2));
            grouped[key].value = (grouped[key].value || 0) + Math.round(valVal);
          }

          importedEntries = Object.values(grouped);
        } else if (id === "is17425") {
          // Customized parser for IS 17425 HDPE Sprinkler Pipe
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          // Find Header Row
          let headerRowIdx = -1;
          for (let r = 0; r < Math.min(data.length, 15); r++) {
            const row = data[r];
            if (row && row.some(cell => String(cell).trim().toUpperCase() === "DATE") &&
                       row.some(cell => String(cell).trim().toUpperCase().includes("SIZE"))) {
              headerRowIdx = r;
              break;
            }
          }

          if (headerRowIdx === -1) {
            setImportStatus({ type: "error", message: "Failed to find headers containing 'DATE' and 'SIZE' in the first 15 rows of the Excel sheet." });
            return;
          }

          const headers = data[headerRowIdx].map(h => String(h || "").trim().toUpperCase());
          const dateColIdx = headers.findIndex(h => h.includes("DATE"));
          const sizeColIdx = headers.findIndex(h => h.includes("SIZE"));
          const nosColIdx = headers.findIndex(h => h.includes("PRODUCTION") || h.includes("NOS") || h.includes("QTY"));
          const valColIdx = headers.findIndex(h => h.includes("VALUE") || h.includes("RS"));

          if (dateColIdx === -1 || sizeColIdx === -1) {
            setImportStatus({ type: "error", message: "Missing required columns 'DATE' or 'SIZE' in header row." });
            return;
          }

          const grouped: Record<string, ProductionEntry> = {};

          for (let r = headerRowIdx + 1; r < data.length; r++) {
            const row = data[r];
            if (!row || row.length === 0 || row[dateColIdx] === undefined || row[dateColIdx] === null || String(row[dateColIdx]).trim() === "") continue;

            // Skip total and summary footer rows
            const dateStr = String(row[dateColIdx]).trim();
            if (dateStr.toLowerCase().startsWith("total") || dateStr.toLowerCase().includes("daily") || dateStr.toLowerCase().includes("monthly")) {
              continue;
            }

            const dateVal = parseExcelDate(row[dateColIdx]);
            const rawSize = String(row[sizeColIdx] || "").trim();
            if (!rawSize) continue;

            const normalizedSize = sizes.find(s => s.toLowerCase() === rawSize.toLowerCase());
            if (!normalizedSize) {
              errorMessages.push(`Row ${r + 1}: Size "${rawSize}" is not configured for standard ${id}.`);
              continue;
            }

            const nosVal = nosColIdx !== -1 ? (Number(row[nosColIdx]) || 0) : 0;
            const valVal = valColIdx !== -1 ? (Number(row[valColIdx]) || 0) : 0;

            const key = `${dateVal}_${normalizedSize}`;
            if (!grouped[key]) {
              grouped[key] = {
                id: `${Date.now()}_prod_${Math.random().toString(36).substr(2, 9)}_${r}`,
                date: dateVal,
                size: normalizedSize,
                nos: 0,
                pipe: 0,
                value: 0
              };
            }

            grouped[key].nos = (grouped[key].nos || 0) + nosVal;
            grouped[key].pipe = (grouped[key].pipe || 0) + nosVal;
            grouped[key].value = (grouped[key].value || 0) + Math.round(valVal);
          }

          importedEntries = Object.values(grouped);
        } else if (id === "is14483") {
          // Customized parser for IS 14483 Venturi Injector
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          // Find Header Row
          let headerRowIdx = -1;
          for (let r = 0; r < Math.min(data.length, 15); r++) {
            const row = data[r];
            if (row && row.some(cell => String(cell).trim().toUpperCase() === "DATE") &&
                       row.some(cell => String(cell).trim().toUpperCase().includes("SIZE"))) {
              headerRowIdx = r;
              break;
            }
          }

          if (headerRowIdx === -1) {
            setImportStatus({ type: "error", message: "Failed to find headers containing 'DATE' and 'SIZE' in the first 15 rows of the Excel sheet." });
            return;
          }

          const headers = data[headerRowIdx].map(h => String(h || "").trim().toUpperCase());
          const dateColIdx = headers.findIndex(h => h.includes("DATE"));
          const sizeColIdx = headers.findIndex(h => h.includes("SIZE"));
          const nosColIdx = headers.findIndex(h => h.includes("PRODUCTION") || h.includes("NOS") || h.includes("QTY"));
          const valColIdx = headers.findIndex(h => h.includes("VALUE") || h.includes("RS"));

          if (dateColIdx === -1 || sizeColIdx === -1) {
            setImportStatus({ type: "error", message: "Missing required columns 'DATE' or 'SIZE' in header row." });
            return;
          }

          const grouped: Record<string, ProductionEntry> = {};

          for (let r = headerRowIdx + 1; r < data.length; r++) {
            const row = data[r];
            if (!row || row.length === 0 || row[dateColIdx] === undefined || row[dateColIdx] === null || String(row[dateColIdx]).trim() === "") continue;

            // Skip total and summary footer rows
            const dateStr = String(row[dateColIdx]).trim();
            if (dateStr.toLowerCase().startsWith("total") || dateStr.toLowerCase().includes("daily") || dateStr.toLowerCase().includes("monthly")) {
              continue;
            }

            const dateVal = parseExcelDate(row[dateColIdx]);
            const rawSize = String(row[sizeColIdx] || "").trim();
            if (!rawSize) continue;

            let normalizedSize = "";
            const sizeLower = rawSize.toLowerCase();
            if (sizeLower.includes("1\"") || sizeLower.includes("25mm")) {
              normalizedSize = "V-1\" (25mm)";
            } else if (sizeLower.includes("2\"") || sizeLower.includes("50mm")) {
              normalizedSize = "V-2\" (50mm)";
            } else {
              const found = sizes.find(s => s.toLowerCase() === rawSize.toLowerCase());
              if (found) {
                normalizedSize = found;
              }
            }

            if (!normalizedSize || !sizes.includes(normalizedSize)) {
              errorMessages.push(`Row ${r + 1}: Size "${rawSize}" is not configured for standard ${id}.`);
              continue;
            }

            const nosVal = nosColIdx !== -1 ? (Number(row[nosColIdx]) || 0) : 0;
            let valVal = valColIdx !== -1 ? (Number(row[valColIdx]) || 0) : 0;
            if (valVal === 0 && nosVal > 0) {
              const valueKey = `sms_conv_value_${id}_${normalizedSize}`;
              const valuePerUnit = Number(localStorage.getItem(valueKey)) || 0;
              valVal = Math.round(nosVal * valuePerUnit);
            }

            const key = `${dateVal}_${normalizedSize}`;
            if (!grouped[key]) {
              grouped[key] = {
                id: `${Date.now()}_prod_${Math.random().toString(36).substr(2, 9)}_${r}`,
                date: dateVal,
                size: normalizedSize,
                nos: 0,
                pipe: 0,
                value: 0
              };
            }

            grouped[key].nos = (grouped[key].nos || 0) + nosVal;
            grouped[key].pipe = (grouped[key].pipe || 0) + nosVal;
            grouped[key].value = (grouped[key].value || 0) + Math.round(valVal);
          }

          importedEntries = Object.values(grouped);
        } else {
          // Generic parser for other standards
          const rows = XLSX.utils.sheet_to_json(ws) as any[];
          const list: ProductionEntry[] = [];
          rows.forEach((row, index) => {
            const dateVal = parseExcelDate(row["Date (DD/MM/YYYY)"] || row["Date (YYYY-MM-DD)"] || row["Date"]);
            const sizeVal = String(row["Size"] || "").trim();

            if (!sizeVal) {
              errorMessages.push(`Row ${index + 2}: Size is empty.`);
              return;
            }
            const normalizedSize = sizes.find(s => s.toLowerCase() === sizeVal.toLowerCase());
            if (!normalizedSize) {
              errorMessages.push(`Row ${index + 2}: Size "${sizeVal}" is not valid for standard ${id}.`);
              return;
            }

            const coilsVal = row["Coils"] !== undefined ? Number(row["Coils"]) : undefined;
            const mtrPerCoilVal = row["Mtr Per Coil"] !== undefined ? Number(row["Mtr Per Coil"]) : undefined;
            let mtrVal = row["Mtr"] !== undefined ? Number(row["Mtr"]) : undefined;
            if (mtrVal === undefined && coilsVal !== undefined && mtrPerCoilVal !== undefined) {
              mtrVal = coilsVal * mtrPerCoilVal;
            }

            list.push({
              id: `${Date.now()}_prod_${Math.random().toString(36).substr(2, 9)}_${index}`,
              date: dateVal,
              size: normalizedSize,
              coils: coilsVal,
              mtrPerCoil: mtrPerCoilVal,
              mtr: mtrVal,
              kg: row["Kg"] !== undefined ? Number(row["Kg"]) : undefined,
              pipe: row["Pipe"] !== undefined ? Number(row["Pipe"]) : undefined,
              tonn: row["Tonn"] !== undefined ? Number(row["Tonn"]) : undefined,
              nos: row["Nos"] !== undefined ? Number(row["Nos"]) : undefined,
              thousandUnit: row["Thousand Unit"] !== undefined ? Number(row["Thousand Unit"]) : undefined,
              value: row["Value"] !== undefined ? Number(row["Value"]) : 0
            });
          });

          importedEntries = list;
        }

        if (importedEntries.length > 0) {
          // Perform smart merge to avoid duplicate date+size entries
          const mergedMap = new Map<string, ProductionEntry>();
          prodEntries.forEach(e => mergedMap.set(`${e.date}_${e.size}`, e));
          importedEntries.forEach(e => mergedMap.set(`${e.date}_${e.size}`, e));
          
          const newProdEntries = Array.from(mergedMap.values());
          await saveFullProductionList(newProdEntries);
        }

        if (errorMessages.length > 0) {
          setImportStatus({
            type: "error",
            message: `Imported ${importedEntries.length} production logs. Some rows failed:\n` + errorMessages.slice(0, 3).join("\n") + (errorMessages.length > 3 ? `\n...and ${errorMessages.length - 3} more errors.` : "")
          });
        } else {
          setImportStatus({
            type: "success",
            message: `Successfully imported ${importedEntries.length} Production entries!`
          });
        }
      } catch (err) {
        console.error(err);
        setImportStatus({ type: "error", message: "Failed to parse file. Please verify it matches the required template or standard layout." });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // Parse and Import Dispatch Excel File
  const handleImportDispExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: false });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        if (!ws) {
          setImportStatus({ type: "error", message: "Dispatch sheet not found in the file." });
          return;
        }

        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        let processedRows = rows;
        // Skip header-in-value row if present (e.g. { '20MM CL-1': 'Date', __EMPTY: 'Qty' })
        if (rows.length > 0) {
          const firstRowValues = Object.values(rows[0]).map(v => String(v).toLowerCase().trim());
          if (firstRowValues.includes("date") && (firstRowValues.includes("qty") || firstRowValues.includes("quantity") || firstRowValues.includes("mtr"))) {
            processedRows = rows.slice(1);
          }
        }

        let importedCount = 0;
        let errorMessages: string[] = [];
        let newDispEntries = [...dispEntries];

        processedRows.forEach((row, index) => {
          // Resolve date and quantity inputs with fallback mapping for the 20mm Cl-1 sheet
          let dateInput = row["Date (DD/MM/YYYY)"] || row["Date (YYYY-MM-DD)"] || row["Date"];
          let qtyInput = row["Mtr"] !== undefined ? row["Mtr"] : (row["Disp Mtr"] !== undefined ? row["Disp Mtr"] : row["Qty"]);

          const cl1Key = Object.keys(row).find(k => k.toLowerCase().includes("20mm cl-1") || k.toLowerCase().includes("20mm cl1"));
          if (cl1Key) {
            dateInput = row[cl1Key];
            qtyInput = row["__EMPTY"] !== undefined ? row["__EMPTY"] : row["Qty"];
          }

          if (dateInput === undefined || qtyInput === undefined) {
            const values = Object.values(row);
            if (values.length >= 2) {
              dateInput = values[0];
              qtyInput = values[1];
            }
          }

          const dateVal = parseExcelDate(dateInput);
          let sizeVal = String(row["Size"] || "").trim();

          // Fallback: If importing on the 20mm Cl-1 tab, any 20mm item or empty size defaults to 20mm Cl-1
          if (id === "is12786" && selectedSize === "20mm Cl-1") {
            if (!sizeVal || sizeVal.toLowerCase().includes("20mm")) {
              sizeVal = "20mm Cl-1";
            }
          }

          if (!sizeVal) {
            errorMessages.push(`Row ${index + 2}: Size is empty.`);
            return;
          }
          if (!sizes.includes(sizeVal)) {
            errorMessages.push(`Row ${index + 2}: Size "${sizeVal}" is not valid for standard ${id}.`);
            return;
          }

          // Find matching production entry from state
          const matchingProd = prodEntries.find(p => p.date === dateVal && p.size === sizeVal);

          const entry: DispatchEntry = {
            id: `${Date.now()}_disp_${Math.random().toString(36).substr(2, 9)}`,
            date: dateVal,
            size: sizeVal,
            partyName: String(row["Party Name"] || row["Party"] || "FARMER"),
            billNo: String(row["Bill No"] || row["Bill"] || "-"),
            batchNo: String(row["Batch No"] || row["Batch"] || (matchingProd ? dateVal.replace(/-/g, "") : "-")),
            value: row["Value"] !== undefined ? Number(row["Value"]) : 0
          };

          if (id === "is13488" || id === "is12786") {
            const pRoll = matchingProd ? (matchingProd.coils || 0) : 0;
            const pM = matchingProd ? (matchingProd.mtr || 0) : 0;
            const dM = qtyInput !== undefined ? Number(qtyInput) : 0;
            entry.prodRoll = pRoll;
            entry.prodMtr = pM;
            entry.dispMtr = dM;
            entry.closeMtr = pM - dM;
          } else if (id === "is13487" || id === "is14483" || id === "is17425") {
            const pN = matchingProd ? (matchingProd.nos || matchingProd.pipe || 0) : 0;
            const dN = row["Nos"] !== undefined ? Number(row["Nos"]) : (row["Disp Nos"] !== undefined ? Number(row["Disp Nos"]) : 0);
            entry.prodNos = pN;
            entry.dispNos = dN;
            entry.closeNos = pN - dN;
          } else if (id === "is4985") {
            const pP = matchingProd ? (matchingProd.pipe || 0) : 0;
            const dP = row["Pipe"] !== undefined ? Number(row["Pipe"]) : 0;
            entry.prodPipe = pP;
            entry.prodMtrPipe = pP * 6;
            entry.dispPipe = dP;
            entry.dispMtrPipe = row["Mtr"] !== undefined ? Number(row["Mtr"]) : (row["Disp Mtr"] !== undefined ? Number(row["Disp Mtr"]) : 0);
            entry.closePipe = pP - dP;
          }

          newDispEntries.push(entry);
          importedCount++;
        });

        if (importedCount > 0) {
          await saveFullDispatchList(newDispEntries);
        }

        if (errorMessages.length > 0) {
          setImportStatus({
            type: "error",
            message: `Imported ${importedCount} dispatch sheets. Some rows failed:\n` + errorMessages.slice(0, 3).join("\n") + (errorMessages.length > 3 ? `\n...and ${errorMessages.length - 3} more errors.` : "")
          });
        } else {
          setImportStatus({
            type: "success",
            message: `Successfully imported ${importedCount} Dispatch entries!`
          });
        }
      } catch (err) {
        console.error(err);
        setImportStatus({ type: "error", message: "Failed to parse file. Please verify it is a valid template." });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // Reconcile and Combine IS 12786 20mm Cl-1 and Cl-2 Dispatches
  const handleReconcileCl1 = async () => {
    // Get all Class-1 entries
    const c1Entries = dispEntries.filter(e => e.size === "20mm Cl-1");
    // Find unreconciled ones (billNo is "-" or empty)
    const unreconciledC1 = c1Entries.filter(e => e.billNo === "-" || !e.billNo);
    if (unreconciledC1.length === 0) {
      alert("No unreconciled 20mm Cl-1 entries found (all entries have invoice/bill details). Please import new Class-1 dispatches first.");
      return;
    }

    const c1Dates = Array.from(new Set(unreconciledC1.map(e => e.date)));
    let totalMovedBills = 0;
    let totalSplitBills = 0;
    let reconciledDatesCount = 0;

    let reconciledC1: DispatchEntry[] = [];
    let reconciledC2 = dispEntries.filter(e => e.size === "20mm Cl-2");
    const otherSizes = dispEntries.filter(e => e.size !== "20mm Cl-1" && e.size !== "20mm Cl-2");

    c1Dates.forEach(dateStr => {
      const dayC1 = unreconciledC1.filter(e => e.date === dateStr);
      const targetQty = dayC1.reduce((sum, e) => sum + (e.dispMtr || 0), 0);
      if (targetQty <= 0) return;

      const dayC2 = reconciledC2.filter(e => e.date === dateStr);
      if (dayC2.length === 0) {
        // No Class-2 dispatches on this day, keep Class-1 placeholders as is
        reconciledC1.push(...dayC1);
        return;
      }

      // Subset Sum algorithm to find best combination of Class-2 dispatches
      let bestSubset: typeof dayC2 = [];
      let bestSum = 0;
      const n = dayC2.length;
      
      const maxN = Math.min(n, 14); // Limit subset size to prevent page freezes
      const numSubsets = 1 << maxN;
      
      for (let i = 0; i < numSubsets; i++) {
        const currentSubset: typeof dayC2 = [];
        let currentSum = 0;
        for (let j = 0; j < maxN; j++) {
          if ((i & (1 << j)) !== 0) {
            currentSubset.push(dayC2[j]);
            currentSum += (dayC2[j].dispMtr || 0);
          }
        }
        if (currentSum <= targetQty && currentSum > bestSum) {
          bestSum = currentSum;
          bestSubset = currentSubset;
        }
      }

      const deletedC2Ids = new Set(bestSubset.map(d => d.id));

      // Move the best subset completely to Class-1
      bestSubset.forEach(d => {
        reconciledC1.push({
          ...d,
          id: `${d.id}_moved_${Date.now()}`,
          size: "20mm Cl-1",
        });
        totalMovedBills++;
      });

      // Remove moved bills from reconciledC2
      reconciledC2 = reconciledC2.filter(e => !deletedC2Ids.has(e.id));

      // Handle the remaining difference by splitting one of the remaining Class-2 bills on this date
      let diff = targetQty - bestSum;
      const remainingDayC2 = reconciledC2.filter(e => e.date === dateStr);

      if (diff > 0 && remainingDayC2.length > 0) {
        remainingDayC2.sort((a, b) => (b.dispMtr || 0) - (a.dispMtr || 0));
        const billToSplit = remainingDayC2[0];

        if ((billToSplit.dispMtr || 0) > diff) {
          // Split the bill
          reconciledC1.push({
            ...billToSplit,
            id: `${billToSplit.id}_split_c1_${Date.now()}`,
            size: "20mm Cl-1",
            dispMtr: diff,
          });

          // Update the bill in reunitedC2 list
          reconciledC2 = reconciledC2.map(e => {
            if (e.id === billToSplit.id) {
              return {
                ...e,
                dispMtr: (e.dispMtr || 0) - diff,
              };
            }
            return e;
          });
          totalSplitBills++;
        } else {
          // Move the entire bill if it's smaller or equal to the difference
          reconciledC1.push({
            ...billToSplit,
            id: `${billToSplit.id}_moved_extra_${Date.now()}`,
            size: "20mm Cl-1",
          });
          reconciledC2 = reconciledC2.filter(e => e.id !== billToSplit.id);
          totalMovedBills++;
        }
      }

      reconciledDatesCount++;
    });

    // Add back any Class-1 entries that were already reconciled (billNo !== "-") or not processed
    const processedDates = new Set(c1Dates);
    c1Entries.forEach(e => {
      if (e.billNo !== "-" && !!e.billNo) {
        reconciledC1.push(e);
      } else if (!processedDates.has(e.date)) {
        reconciledC1.push(e);
      }
    });

    // Combine all entries and dynamically update their production & closing stocks
    const combinedEntries = [...otherSizes, ...reconciledC1, ...reconciledC2];
    
    const finalEntries = combinedEntries.map(entry => {
      if (entry.size === "20mm Cl-1" || entry.size === "20mm Cl-2") {
        const matchingProd = prodEntries.find(p => p.date === entry.date && p.size === entry.size);
        const pRoll = matchingProd ? (matchingProd.coils || 0) : 0;
        const pM = matchingProd ? (matchingProd.mtr || 0) : 0;
        const dM = entry.dispMtr || 0;
        
        return {
          ...entry,
          prodRoll: pRoll,
          prodMtr: pM,
          dispMtr: dM,
          closeMtr: pM - dM
        };
      }
      return entry;
    });

    // Save to localStorage
    await saveFullDispatchList(finalEntries);

    alert(`Reconciliation complete!\n- Reconciled dates: ${reconciledDatesCount}\n- Completely moved bills: ${totalMovedBills}\n- Split bills: ${totalSplitBills}`);
  };

  // Parse and Import Consignee Sales Excel File
  const handleImportConsigneeSales = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: false });
        // Look for sheet named "YEAR - 2026", fallback to sheet at index 0
        const sheetName = wb.SheetNames.find(n => n.includes("YEAR")) || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        if (!ws) {
          setImportStatus({ type: "error", message: "Sales sheet not found in the file." });
          return;
        }

        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        let importedCount = 0;
        let skippedCount = 0;
        const tempEntries: DispatchEntry[] = [];
        const newImportedIds = new Set<string>();

        rows.forEach((row) => {
          const partyKey = Object.keys(row).find(k => /party/i.test(k)) || "Party Name";
          const itemKey = Object.keys(row).find(k => /item/i.test(k)) || "Item Name";
          const dateKey = Object.keys(row).find(k => /date/i.test(k)) || "Date";
          const qtyKey = Object.keys(row).find(k => /qty|quantity/i.test(k)) || "Qty";

          const partyNameVal = String(row[partyKey] || "").trim();
          const itemNameVal = String(row[itemKey] || "").trim();
          const dateVal = parseExcelDate(row[dateKey]);
          const qtyVal = Number(row[qtyKey] || 0);

          if (!itemNameVal || !qtyVal) {
            skippedCount++;
            return;
          }

          const sizeVal = mapItemToSize(itemNameVal, id || "");
          if (!sizeVal) {
            skippedCount++;
            return;
          }

          const matchingProd = prodEntries.find(p => p.date === dateVal && p.size === sizeVal);

          const entry: DispatchEntry = {
            id: `${Date.now()}_disp_${Math.random().toString(36).substr(2, 9)}`,
            date: dateVal,
            size: sizeVal,
            partyName: partyNameVal || "FARMER",
            billNo: "-",
            batchNo: matchingProd ? dateVal.replace(/-/g, "") : "-",
            value: qtyVal,
            isConsigneeImport: true
          };

          if (id === "is13488" || id === "is12786") {
            entry.prodRoll = matchingProd ? (matchingProd.coils || 0) : 0;
            entry.prodMtr = matchingProd ? (matchingProd.mtr || 0) : 0;
            entry.dispMtr = qtyVal;
            entry.closeMtr = (matchingProd ? matchingProd.mtr : 0) - qtyVal;
          } else if (id === "is13487" || id === "is14483" || id === "is17425") {
            entry.prodNos = matchingProd ? (matchingProd.nos || matchingProd.pipe || 0) : 0;
            entry.dispNos = qtyVal;
            entry.closeNos = (matchingProd ? (matchingProd.nos || matchingProd.pipe || 0) : 0) - qtyVal;
          } else if (id === "is4985") {
            entry.prodPipe = matchingProd ? (matchingProd.pipe || 0) : 0;
            entry.prodMtrPipe = (matchingProd ? matchingProd.pipe : 0) * 6;
            entry.dispPipe = Math.ceil(qtyVal / 6);
            entry.dispMtrPipe = qtyVal;
            entry.closePipe = (matchingProd ? matchingProd.pipe : 0) - Math.ceil(qtyVal / 6);
          }

          tempEntries.push(entry);
          newImportedIds.add(entry.id);
          importedCount++;
        });

        if (importedCount > 0) {
          setTempImportedDispEntries(tempEntries);
          setImportedConsigneeIds(newImportedIds);
        }

        setImportStatus({
          type: "success",
          message: `Successfully imported ${importedCount} Consignee Sales dispatches (skipped ${skippedCount} unrelated items)!`
        });
      } catch (err) {
        console.error(err);
        setImportStatus({ type: "error", message: "Failed to parse Consignee Sales file." });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // Clear all consignee-imported dispatch entries
  const handleClearImportedData = async () => {
    if (tempImportedDispEntries.length === 0 && importedConsigneeIds.size === 0) {
      alert("No imported consignee data to clear.");
      return;
    }
    const count = tempImportedDispEntries.length > 0 ? tempImportedDispEntries.length : importedConsigneeIds.size;
    const confirmed = window.confirm(
      `This will remove ${count} imported dispatch entries from the current session. Continue?`
    );
    if (!confirmed) return;

    const idsToClear = new Set([
      ...tempImportedDispEntries.map(e => e.id),
      ...Array.from(importedConsigneeIds)
    ]);

    const filtered = dispEntries.filter(e => !idsToClear.has(e.id));
    await saveFullDispatchList(filtered);

    // Delete IDs from Supabase in chunks of 100 to prevent 414 Request-URI Too Large errors
    if (smsStorage.isCloudEnabled() && idsToClear.size > 0) {
      try {
        const idList = Array.from(idsToClear);
        const chunkSize = 100;
        for (let i = 0; i < idList.length; i += chunkSize) {
          const chunk = idList.slice(i, i + chunkSize);
          await supabase
            .from("sms_dispatch")
            .delete()
            .in("id", chunk);
        }
      } catch (err) {
        console.error("Failed to delete imported IDs from Supabase:", err);
      }
    }

    localStorage.removeItem(`sms_consignee_imported_ids_${id}`);
    setTempImportedDispEntries([]);
    setImportedConsigneeIds(new Set());
    setConsigneeReportRows([]);
    setImportStatus({ type: "success", message: "Imported consignee data cleared successfully." });
  };

  // Memoized registered consignee names list loaded from smsStorage
  const registeredConsignees = useMemo(() => {
    const list = smsStorage.getLocalConsignees();
    return list.map(c => c.name).filter(Boolean);
  }, [consigneeEditModal]);

  // Fast O(1) lookup Map from clean name to original registered name
  const cleanToRegisteredMap = useMemo(() => {
    const map = new Map<string, string>();
    const list = smsStorage.getLocalConsignees();
    list.forEach(c => {
      if (c.name) {
        map.set(getCleanConsigneeName(c.name).toLowerCase(), c.name);
      }
      if (c.lookFor) {
        c.lookFor.split(",").forEach(alias => {
          const trimmed = alias.trim();
          if (trimmed) {
            map.set(getCleanConsigneeName(trimmed).toLowerCase(), c.name);
            map.set(trimmed.toLowerCase(), c.name);
          }
        });
      }
    });
    return map;
  }, [registeredConsignees]);

  // Master list of all registered and logged consignees (O(N) linear time)
  const allConsignees = useMemo(() => {
    const loggedParties = new Set<string>();
    displayedDispEntries.forEach(entry => {
      const p = String(entry.partyName || "").trim();
      if (p && p !== "-" && p !== "FARMER") {
        const cleanP = getCleanConsigneeName(p).toLowerCase();
        const matched = cleanToRegisteredMap.get(cleanP);
        loggedParties.add(matched || p);
      }
    });

    const merged = Array.from(new Set([...registeredConsignees, ...Array.from(loggedParties)]));
    return merged.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [registeredConsignees, displayedDispEntries, cleanToRegisteredMap]);

  // Consignees that have at least one dispatch in the selected month+year
  const activeConsignees = useMemo(() => {
    const targetMonthIdx = MONTHS.indexOf(consigneeReportMonth) + 1;
    const targetMonthStr = targetMonthIdx < 10 ? `0${targetMonthIdx}` : `${targetMonthIdx}`;
    const targetPrefix = `${consigneeReportYear}-${targetMonthStr}`;

    const partiesInPeriod = new Set<string>();
    displayedDispEntries.forEach(entry => {
      if (entry.date && entry.date.startsWith(targetPrefix)) {
        const p = String(entry.partyName || "").trim();
        if (p && p !== "-" && p !== "FARMER") {
          const cleanP = getCleanConsigneeName(p).toLowerCase();
          const matched = cleanToRegisteredMap.get(cleanP);
          partiesInPeriod.add(matched || p);
        }
      }
    });

    // Filter master list to only those with dispatches this period
    const list = allConsignees.filter(name =>
      partiesInPeriod.has(name) ||
      partiesInPeriod.has(cleanToRegisteredMap.get(getCleanConsigneeName(name).toLowerCase()) || "")
    );

    // Sort: Saved/registered consignees first, then alphabetical
    const sorted = [...list].sort((a, b) => {
      const aClean = getCleanConsigneeName(a).toLowerCase();
      const bClean = getCleanConsigneeName(b).toLowerCase();
      const aSaved = cleanToRegisteredMap.has(aClean);
      const bSaved = cleanToRegisteredMap.has(bClean);
      if (aSaved && !bSaved) return -1;
      if (!aSaved && bSaved) return 1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });

    if (showSavedOnly) {
      return sorted.filter(name => cleanToRegisteredMap.has(getCleanConsigneeName(name).toLowerCase()));
    }
    return sorted;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allConsignees, displayedDispEntries, consigneeReportMonth, consigneeReportYear, showSavedOnly, cleanToRegisteredMap]);

  // Warning checks for selected consignees
  const getConsigneeWarnings = () => {
    const registeredObjects = smsStorage.getLocalConsignees();

    const warnings: { name: string; missing: string[]; obj: any }[] = [];
    selectedConsignees.forEach(name => {
      const obj = registeredObjects.find(r => r && r.name && getCleanConsigneeName(r.name).toLowerCase() === getCleanConsigneeName(name).toLowerCase());
      if (!obj || typeof obj === "string") {
        warnings.push({ 
          name, 
          missing: ["Address", "City", "District", "State", "Pincode", "Country", "Mobile", "Email"], 
          obj: { name } 
        });
      } else {
        const missingFields: string[] = [];
        if (!obj.address?.trim()) missingFields.push("Address");
        if (!obj.city?.trim()) missingFields.push("City");
        if (!obj.district?.trim()) missingFields.push("District");
        if (!obj.state?.trim()) missingFields.push("State");
        if (!obj.pincode?.trim()) missingFields.push("Pincode");
        if (!obj.country?.trim()) missingFields.push("Country");
        if (!obj.mobile?.trim()) missingFields.push("Mobile");
        if (!obj.email?.trim()) missingFields.push("Email");

        if (missingFields.length > 0) {
          warnings.push({ name, missing: missingFields, obj });
        }
      }
    });

    return warnings;
  };

  const handleSaveConsigneeDetails = (updated: any) => {
    const stored = localStorage.getItem("sms_consignees");
    let registered: any[] = [];
    if (stored) {
      try {
        registered = JSON.parse(stored);
      } catch (e) {}
    }

    const idx = registered.findIndex(r => r && r.name && r.name.toLowerCase() === updated.name.toLowerCase());
    if (idx >= 0) {
      registered[idx] = updated;
    } else {
      registered.push(updated);
    }

    localStorage.setItem("sms_consignees", JSON.stringify(registered));
    setConsigneeEditModal(null);
  };

  const generateConsigneeReport = () => {
    if (selectedConsignees.length === 0) {
      alert("Please select at least one consignee.");
      return;
    }

    const warnings = getConsigneeWarnings();
    if (warnings.length > 0) {
      alert("Warning: Some selected consignees have missing details (Address/Contact). Please resolve them or remove them before proceeding.");
    }

    const sums: Record<string, number> = {};
    selectedConsignees.forEach(c => {
      sums[c] = 0;
    });

    const targetMonthIdx = MONTHS.indexOf(consigneeReportMonth) + 1;
    const targetMonthStr = targetMonthIdx < 10 ? `0${targetMonthIdx}` : `${targetMonthIdx}`;
    const targetPrefix = `${consigneeReportYear}-${targetMonthStr}`;

    displayedDispEntries.forEach(entry => {
      if (entry.date && entry.date.startsWith(targetPrefix)) {
        const entryParty = String(entry.partyName || "").trim();
        const matchedConsignee = selectedConsignees.find(
          c => getCleanConsigneeName(c).toLowerCase() === getCleanConsigneeName(entryParty).toLowerCase()
        );
        
        if (matchedConsignee) {
          if (id === "is13488" || id === "is12786") {
            sums[matchedConsignee] += (entry.dispMtr || 0);
          } else if (id === "is13487" || id === "is14483" || id === "is17425") {
            sums[matchedConsignee] += (entry.dispNos || 0);
          } else if (id === "is4985") {
            sums[matchedConsignee] += (entry.dispMtrPipe || 0);
          } else {
            sums[matchedConsignee] += (entry.value || 0);
          }
        }
      }
    });

    // Upsert rows: same consignee+month+year updates qty, new combination appends
    setConsigneeReportRows(prev => {
      const updated = [...prev];
      Object.entries(sums).forEach(([name, qty]) => {
        if (qty === 0) return; // skip zero rows
        const existingIdx = updated.findIndex(
          r => r.consigneeName === name && r.month === consigneeReportMonth && r.year === consigneeReportYear
        );
        if (existingIdx >= 0) {
          updated[existingIdx] = { ...updated[existingIdx], qty };
        } else {
          updated.push({ consigneeName: name, qty, month: consigneeReportMonth, year: consigneeReportYear });
        }
      });
      return updated;
    });

    // Finalize/save the temporary imported entries to the persistent database
    if (tempImportedDispEntries.length > 0) {
      const merged = [...dispEntries, ...tempImportedDispEntries];
      saveFullDispatchList(merged);
      setTempImportedDispEntries([]);
    }
  };

  const performConsigneeExport = () => {
    if (consigneeReportRows.length === 0) return;

    const registeredObjects = smsStorage.getLocalConsignees();

    const headers = [
      "Brand Name",
      "Consignee's Name ",
      "Address",
      "Country",
      "State",
      "District",
      "City",
      "Pincode",
      "Telephone  ",
      "Mobile",
      "Email Id ",
      "Quantity",
      "Year",
      "Month"
    ];

    const aoa: any[][] = [headers];

    consigneeReportRows.forEach(row => {
      const obj: any = registeredObjects.find(r => r && r.name && getCleanConsigneeName(r.name).toLowerCase() === getCleanConsigneeName(row.consigneeName).toLowerCase()) || {};

      aoa.push([
        "PARAGON",
        obj.name || row.consigneeName,
        obj.address || "-",
        obj.country || "India",
        obj.state || "-",
        obj.district || "-",
        obj.city || "-",
        obj.pincode || "-",
        obj.telephone || "-",
        obj.mobile || "-",
        obj.email || "-",
        row.qty,
        Number(row.year),
        row.month.toLowerCase()
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    ws["!cols"] = [
      { wch: 12 }, // Brand Name
      { wch: 30 }, // Consignee's Name
      { wch: 45 }, // Address
      { wch: 10 }, // Country
      { wch: 12 }, // State
      { wch: 15 }, // District
      { wch: 15 }, // City
      { wch: 10 }, // Pincode
      { wch: 12 }, // Telephone
      { wch: 15 }, // Mobile
      { wch: 25 }, // Email Id
      { wch: 12 }, // Quantity
      { wch: 8 },  // Year
      { wch: 10 }  // Month
    ];

    const thinBorder = {
      top: { style: "thin", color: { rgb: "D9D9D9" } },
      bottom: { style: "thin", color: { rgb: "D9D9D9" } },
      left: { style: "thin", color: { rgb: "D9D9D9" } },
      right: { style: "thin", color: { rgb: "D9D9D9" } }
    };

    const headerStyle = {
      font: { name: "Arial", size: 10, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: thinBorder
    };

    const dataStyle = {
      font: { name: "Arial", size: 10 },
      alignment: { horizontal: "left", vertical: "center" },
      border: thinBorder
    };

    const numStyle = {
      font: { name: "Arial", size: 10, bold: true },
      alignment: { horizontal: "right", vertical: "center" },
      border: thinBorder
    };

    const rowCount = aoa.length;
    const colCount = headers.length;

    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) continue;

        if (r === 0) {
          ws[cellRef].s = headerStyle;
        } else {
          if (c === 11 || c === 7 || c === 9 || c === 12) {
            ws[cellRef].s = numStyle;
          } else {
            ws[cellRef].s = dataStyle;
          }
        }
      }
    }

    const wb = XLSX.utils.book_new();
    const sheetTitle = `Consignee Data - ${id.replace("is", "")}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
    
    const cleanFilename = (exportFilename.trim() || "PARAGON CONSIGNEE").replace(/\.xlsx$/i, "");
    XLSX.writeFile(wb, `${cleanFilename}.xlsx`);
  };

  // Helper to calculate the running stock for all dates of a size
  const getFullStockLedgerForSize = (
    sizeName: string,
    customFromMonth?: string,
    customFromYear?: string,
    customToMonth?: string,
    customToYear?: string
  ) => {
    const sizeProd = prodEntries.filter(e => e.size === sizeName);
    const sizeDisp = dispEntries.filter(e => e.size === sizeName);
    
    // Load size-specific date filters if available, else fallback to global page states
    const szFromMonth = customFromMonth || localStorage.getItem(`sms_stock_from_month_${id}_${sizeName}`) || fromMonth || "January";
    const szFromYear = customFromYear || localStorage.getItem(`sms_stock_from_year_${id}_${sizeName}`) || fromYear || "2026";
    const szToMonth = customToMonth || localStorage.getItem(`sms_stock_to_month_${id}_${sizeName}`) || toMonth || "December";
    const szToYear = customToYear || localStorage.getItem(`sms_stock_to_year_${id}_${sizeName}`) || toYear || "2026";

    // Find oldest date in logs or saved starting stocks to start our timeline
    let startYear = Number(szFromYear);
    let startMonth = MONTHS.indexOf(szFromMonth) + 1;

    const allLogs = [...prodEntries, ...dispEntries];
    if (allLogs.length > 0) {
      allLogs.forEach((log) => {
        const parts = log.date.split("-");
        if (parts.length >= 2) {
          const y = Number(parts[0]);
          const m = Number(parts[1]);
          if (y < startYear || (y === startYear && m < startMonth)) {
            startYear = y;
            startMonth = m;
          }
        }
      });
    }

    // Scan localStorage for oldest month with saved stock balance for this sizeName
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`sms_last_stock_${id}_${sizeName}_`)) {
        const parts = key.split("_");
        if (parts.length >= 7) {
          const yr = Number(parts[parts.length - 2]);
          const monthName = parts[parts.length - 1];
          const mIdx = MONTHS.indexOf(monthName);
          if (!isNaN(yr) && mIdx !== -1) {
            const m = mIdx + 1;
            if (yr < startYear || (yr === startYear && m < startMonth)) {
              startYear = yr;
              startMonth = m;
            }
          }
        }
      }
    }

    const endYear = Number(szToYear);
    const endMonth = MONTHS.indexOf(szToMonth) + 1;

    // Generate period keys YYYY-MM
    const periodKeys: string[] = [];
    let curY = startYear;
    let curM = startMonth;

    while (curY < endYear || (curY === endYear && curM <= endMonth)) {
      const mStr = curM < 10 ? `0${curM}` : `${curM}`;
      periodKeys.push(`${curY}-${mStr}`);
      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }

    let prevPeriodEndStock = 0;
    const ledgerRows: any[] = [];
    let hasFoundFirstManual = false;

    periodKeys.forEach((periodKey) => {
      const [yr, mo] = periodKey.split("-");
      const monthName = MONTHS[Number(mo) - 1];

      const manualKey = `sms_last_stock_${id}_${sizeName}_${yr}_${monthName}`;
      const manualValStr = localStorage.getItem(manualKey);

      let periodStartStock = prevPeriodEndStock;

      if (manualValStr !== null) {
        periodStartStock = Number(manualValStr) || 0;
        hasFoundFirstManual = true;
      } else if (!hasFoundFirstManual) {
        const oldFallback = localStorage.getItem(`sms_last_stock_${id}_${sizeName}`);
        if (oldFallback !== null) {
          periodStartStock = Number(oldFallback) || 0;
        } else {
          periodStartStock = 0;
        }
        hasFoundFirstManual = true;
      }

      let runningStock = periodStartStock;

      // Generate all calendar dates in this month, but no further than today
      const todayL = new Date();
      const todayStrL = `${todayL.getFullYear()}-${String(todayL.getMonth() + 1).padStart(2, '0')}-${String(todayL.getDate()).padStart(2, '0')}`;
      const numDays = new Date(Number(yr), Number(mo), 0).getDate();
      for (let day = 1; day <= numDays; day++) {
        const dStr = day < 10 ? `0${day}` : `${day}`;
        const dt = `${yr}-${mo}-${dStr}`;
        if (dt > todayStrL) break;

        const dProds = sizeProd.filter(e => datesMatch(e.date, dt));
        const dDisps = sizeDisp.filter(e => datesMatch(e.date, dt));

        if (dDisps.length > 0) {
          dDisps.forEach((d, idx) => {
            const isFirstDisp = idx === 0;
            let prodRollVal = 0;
            let prodMtrVal = 0;
            let prodNosVal = 0;
            let prodPipeVal = 0;
            let prodMtrPipeVal = 0;

            let prodQty = 0;
            let dispQty = 0;

            if (isFirstDisp && dProds.length > 0) {
              const p = dProds[0];
              prodRollVal = p.coils || 0;
              prodMtrVal = p.mtr || 0;
              prodNosVal = p.nos || p.pipe || 0;
              prodPipeVal = p.pipe || 0;
              prodMtrPipeVal = (p.pipe || 0) * 6;

              if (id === "is13488" || id === "is12786") {
                prodQty = p.mtr || 0;
              } else if (id === "is13487" || id === "is14483" || id === "is17425") {
                prodQty = p.nos || p.pipe || 0;
              } else if (id === "is4985") {
                prodQty = p.pipe || 0;
              }
            }

            if (id === "is13488" || id === "is12786") {
              dispQty = d.dispMtr || 0;
            } else if (id === "is13487" || id === "is14483" || id === "is17425") {
              dispQty = d.dispNos || 0;
            } else if (id === "is4985") {
              dispQty = d.dispPipe || 0;
            }

            const openStock = runningStock;
            runningStock = runningStock + prodQty - dispQty;

            const thousandVal = (id === "is13487" && isFirstDisp && dProds.length > 0) ? (dProds[0].thousandUnit || (prodNosVal / 1000)) : 0;

            ledgerRows.push({
              "Size": sizeName,
              "Date": dt,
              "Opening Stock": openStock,
              "Party Name": d.partyName || "FARMER",
              "Bill No": d.billNo || "-",
              "Batch No": (isFirstDisp && prodQty > 0) ? dt.replace(/-/g, "") : "-",
              "Production (Coils)": prodRollVal,
              "Production (Mtr)": prodMtrVal,
              "Dispatch (Coils)": (id === "is13488" || id === "is12786") ? d.coils || 0 : 0,
              "Dispatch (Mtr)": dispQty,
              "Closing Stock": runningStock,
              
              // Standard-independent properties
              prodRoll: prodRollVal,
              prodMtr: prodMtrVal,
              prodNos: prodNosVal,
              prodPipe: prodPipeVal,
              prodMtrPipe: prodMtrPipeVal,
              dispMtr: (id === "is13488" || id === "is12786") ? dispQty : 0,
              dispNos: (id === "is13487" || id === "is14483" || id === "is17425") ? dispQty : 0,
              dispPipe: id === "is4985" ? dispQty : 0,
              dispMtrPipe: id === "is4985" ? d.dispMtrPipe || 0 : 0,
              closingStock: runningStock,
              thousandUnit: thousandVal
            });
          });
        } else if (dProds.length > 0) {
          dProds.forEach((p) => {
            const prodRollVal = p.coils || 0;
            const prodMtrVal = p.mtr || 0;
            const prodNosVal = p.nos || p.pipe || 0;
            const prodPipeVal = p.pipe || 0;
            const prodMtrPipeVal = (p.pipe || 0) * 6;
            const thousandVal = p.thousandUnit || (prodNosVal / 1000);

            let prodQty = 0;
            if (id === "is13488" || id === "is12786") {
              prodQty = p.mtr || 0;
            } else if (id === "is13487" || id === "is14483" || id === "is17425") {
              prodQty = p.nos || p.pipe || 0;
            } else if (id === "is4985") {
              prodQty = p.pipe || 0;
            }

            const openStock = runningStock;
            runningStock = runningStock + prodQty;

            ledgerRows.push({
              "Size": sizeName,
              "Date": dt,
              "Opening Stock": openStock,
              "Party Name": "-",
              "Bill No": "-",
              "Batch No": dt.replace(/-/g, ""),
              "Production (Coils)": prodRollVal,
              "Production (Mtr)": prodMtrVal,
              "Dispatch (Coils)": 0,
              "Dispatch (Mtr)": 0,
              "Closing Stock": runningStock,
              
              // Standard-independent properties
              prodRoll: prodRollVal,
              prodMtr: prodMtrVal,
              prodNos: prodNosVal,
              prodPipe: prodPipeVal,
              prodMtrPipe: prodMtrPipeVal,
              dispMtr: 0,
              dispNos: 0,
              dispPipe: 0,
              dispMtrPipe: 0,
              closingStock: runningStock,
              thousandUnit: thousandVal
            });
          });
        } else {
          ledgerRows.push({
            "Size": sizeName,
            "Date": dt,
            "Opening Stock": runningStock,
            "Party Name": "-",
            "Bill No": "-",
            "Batch No": "-",
            "Production (Coils)": 0,
            "Production (Mtr)": 0,
            "Dispatch (Coils)": 0,
            "Dispatch (Mtr)": 0,
            "Closing Stock": runningStock,
            
            // Standard-independent properties
            prodRoll: 0,
            prodMtr: 0,
            prodNos: 0,
            prodPipe: 0,
            prodMtrPipe: 0,
            dispMtr: 0,
            dispNos: 0,
            dispPipe: 0,
            dispMtrPipe: 0,
            closingStock: runningStock,
            thousandUnit: 0
          });
        }
      }

      prevPeriodEndStock = runningStock;
    });

    return ledgerRows;
  };

  // Helper to safely name sheets (respecting Excel's 31-character limit and forbidden characters)
  const getSafeSheetName = (prefix: string, sizeName: string): string => {
    let name = `${prefix} - ${sizeName}`;
    name = name.replace(/[\\\/\?\*\[\]]/g, "");
    if (name.length > 31) {
      name = name.substring(0, 31);
    }
    return name;
  };

  // Reusable export helper function
  const performExport = (sizesToExport: string[], forceProd: boolean, forceDisp: boolean, forceStock: boolean) => {
    if (sizesToExport.length === 0) {
      alert("Please select at least one size to export.");
      return;
    }

    const wb = XLSX.utils.book_new();
    let hasSheets = false;

    // Helper to format size name for IS 13488 sheet tabs
    const getIs13488SheetName = (sz: string) => {
      let upper = sz.toUpperCase();
      upper = upper.replace(/CL\s*-\s*3|CL\s*-\s*III|CL\s*3|CL\s*III/g, "CL - III");
      upper = upper.replace(/CL\s*-\s*2|CL\s*-\s*II|CL\s*2|CL\s*II/g, "CL - II");
      upper = upper.replace(/CL\s*-\s*1|CL\s*-\s*I|CL\s*1|CL\s*I/g, "CL - I");
      upper = upper.replace(/(\d+)\s*MM/g, "$1 MM");
      return upper;
    };

    // Helper to convert date YYYY-MM-DD to Excel date serial
    const dateToExcelSerial = (dateStr: string): number => {
      const d = new Date(dateStr);
      const utcDate = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
      const excelBaseDate = Date.UTC(1899, 11, 30);
      const msPerDay = 24 * 60 * 60 * 1000;
      return Math.round((utcDate - excelBaseDate) / msPerDay);
    };

    if (id === "is13488" || id === "is13487" || id === "is12786" || id === "is4985" || id === "is17425" || id === "is14483") {
      // -------------------------------------------------------------
      // Custom Export Layout for IS 13488, IS 13487, IS 12786, and IS 4985
      // -------------------------------------------------------------
      const isMultiColumnLedger = id === "is13488" || id === "is12786";
      const maxCols = isMultiColumnLedger ? 13 : 12;
      const sidebarStartCol = isMultiColumnLedger ? 9 : 8;
      const mainTableEndCol = isMultiColumnLedger ? 7 : 6;
      const monthColLetter = isMultiColumnLedger ? "J" : "I";

      sizesToExport.forEach((sz) => {
        const szFromMonth = fromMonth || "January";
        const szFromYear = fromYear || "2026";
        const szToMonth = toMonth || "December";
        const szToYear = toYear || "2026";

        const sizeLedgerRows = getFullStockLedgerForSize(sz, fromMonth, fromYear, toMonth, toYear);
        
        // Filter rows by size-specific selected range
        const filteredRows = sizeLedgerRows.filter((entry: any) => {
          const parts = entry.Date.split("-");
          if (parts.length < 2) return false;
          const y = Number(parts[0]);
          const m = Number(parts[1]);
          const mIdx = m - 1;

          const fromMIdx = MONTHS.indexOf(szFromMonth);
          const fromYrVal = Number(szFromYear);
          const toMIdx = MONTHS.indexOf(szToMonth);
          const toYrVal = Number(szToYear);

          const isAfterFrom = y > fromYrVal || (y === fromYrVal && mIdx >= fromMIdx);
          const isBeforeTo = y < toYrVal || (y === toYrVal && mIdx <= toMIdx);

          return isAfterFrom && isBeforeTo;
        });

        if (filteredRows.length === 0) return;

        // Preceding month starting stock metadata
        const fromMIdx = MONTHS.indexOf(szFromMonth);
        const fromYrVal = Number(szFromYear);
        const prevMIdx = fromMIdx === 0 ? 11 : fromMIdx - 1;
        const prevYearVal = fromMIdx === 0 ? fromYrVal - 1 : fromYrVal;
        const prevMonthName = MONTHS[prevMIdx];
        const prevMonthShort = prevMonthName.substring(0, 3);
        const precedingStockLabel = `C.S. in ${prevMonthShort} - ${prevYearVal}`;
        const precedingStockVal = filteredRows[0]["Opening Stock"] || 0;

        // Generate period keys (YYYY-MM) in the range for summary sidebar
        const rangePeriods: string[] = [];
        let curY = fromYrVal;
        let curM = fromMIdx + 1;
        const endYrVal = Number(szToYear);
        const endMIdx = MONTHS.indexOf(szToMonth) + 1;

        while (curY < endYrVal || (curY === endYrVal && curM <= endMIdx)) {
          const mStr = curM < 10 ? `0${curM}` : `${curM}`;
          rangePeriods.push(`${curY}-${mStr}`);
          curM++;
          if (curM > 12) {
            curM = 1;
            curY++;
          }
        }

        const monthlySummaries: Array<{
          monthSerial: number;
          sumProd: number;
          sumDisp: number;
          closeStock: number;
        }> = [];

        rangePeriods.forEach((periodKey) => {
          const [yr, mo] = periodKey.split("-");
          const monthStartStr = `${yr}-${mo}-01`;
          const monthSerial = dateToExcelSerial(monthStartStr);
          
          const monthRows = filteredRows.filter((r: any) => {
            const [rYr, rMo] = r.Date.split("-");
            return rYr === yr && rMo === mo;
          });

          const sumProd = monthRows.reduce((sum: number, r: any) => {
            if (id === "is13488" || id === "is12786") return sum + (r["Production (Mtr)"] || r.prodMtr || 0);
            if (id === "is4985") return sum + (r.prodPipe || 0);
            return sum + (r.prodNos || 0);
          }, 0);
          const sumDisp = monthRows.reduce((sum: number, r: any) => {
            if (id === "is13488" || id === "is12786") return sum + (r["Dispatch (Mtr)"] || r.dispMtr || 0);
            if (id === "is4985") return sum + (r.dispPipe || 0);
            return sum + (r.dispNos || 0);
          }, 0);
          
          let closeStock = 0;
          if (monthRows.length > 0) {
            const lastRow = monthRows[monthRows.length - 1];
            closeStock = lastRow["Closing Stock"] || lastRow.closingStock || 0;
          }

          monthlySummaries.push({ monthSerial, sumProd, sumDisp, closeStock });
        });

        // Construct AOA
        const aoa: any[][] = [];
        const maxHeaderRows = Math.max(6, 2 + rangePeriods.length);
        for (let i = 0; i < maxHeaderRows; i++) {
          aoa.push(new Array(maxCols).fill(null));
        }

        // Row 1 (Index 0)
        aoa[0][0] = " PARAGON IRRIGATION PVT. LTD.";
        aoa[0][sidebarStartCol] = "Month";
        aoa[0][sidebarStartCol + 1] = "Sum of Production";
        aoa[0][sidebarStartCol + 2] = "Sum of Dispatch";
        aoa[0][sidebarStartCol + 3] = "Cloasing Stock";

        // Row 2 onwards summary sidebar
        monthlySummaries.forEach((summary, idx) => {
          const targetRow = 1 + idx;
          aoa[targetRow][sidebarStartCol] = summary.monthSerial;
          aoa[targetRow][sidebarStartCol + 1] = summary.sumProd;
          aoa[targetRow][sidebarStartCol + 2] = summary.sumDisp;
          aoa[targetRow][sidebarStartCol + 3] = summary.closeStock;
        });

        // Row 3 (Index 2)
        const formattedSizeName = isMultiColumnLedger ? getIs13488SheetName(sz) : sz.toUpperCase();
        aoa[2][0] = id === "is12786"
          ? ` IS CODE : 12786 PLAIN LATERALS (${formattedSizeName})`
          : id === "is13488"
            ? ` IS CODE : 13488 EMITTING PIPE (${formattedSizeName})`
            : id === "is4985"
              ? ` IS CODE : 4985 UPVC PIPE (${formattedSizeName})`
              : id === "is17425"
                ? ` IS CODE : 17425 HDPE PIPE (${formattedSizeName})`
                : id === "is14483"
                  ? ` IS CODE : 14483 VENTURI INJECTOR (${formattedSizeName})`
                  : ` IS CODE : 13487 EMITTERS (${formattedSizeName})`;

        // Row 4 (Index 3) range info
        const fromMStr = (fromMIdx + 1) < 10 ? `0${fromMIdx + 1}` : `${fromMIdx + 1}`;
        const toMStr = (endMIdx) < 10 ? `0${endMIdx}` : `${endMIdx}`;
        const rangeStartSerial = dateToExcelSerial(`${fromYrVal}-${fromMStr}-01`);
        const lastDayOfToMonth = new Date(endYrVal, endMIdx, 0).getDate();
        const rangeEndSerial = dateToExcelSerial(`${endYrVal}-${toMStr}-${lastDayOfToMonth}`);

        aoa[3][0] = "From";
        aoa[3][1] = rangeStartSerial;
        aoa[3][2] = "To";
        aoa[3][3] = rangeEndSerial;
        aoa[3][4] = precedingStockLabel;
        aoa[3][mainTableEndCol] = precedingStockVal;

        // Row 6 (Index 5) headers
        aoa[5][0] = "Date";
        aoa[5][1] = "Party Name";
        aoa[5][2] = "Bill No";
        aoa[5][3] = "Batch No";
        if (id === "is13488" || id === "is12786") {
          aoa[5][4] = "MFG in Roll";
          aoa[5][5] = " MFG in Meter";
          aoa[5][6] = "Dispatch QTY in Meter";
          aoa[5][7] = "C. S in Meter";
        } else if (id === "is4985") {
          aoa[5][4] = "MFG in Pipe";
          aoa[5][5] = "Dispatch Qty in Pipe";
          aoa[5][6] = "C. S in Pipe";
        } else {
          aoa[5][4] = "MFG in Nos";
          aoa[5][5] = "Dispatch QTY in Nos";
          aoa[5][6] = "C. S in Nos";
        }

        // Row 7 onwards ledger rows
        filteredRows.forEach((r: any, idx) => {
          const targetRow = 6 + idx;
          if (!aoa[targetRow]) {
            aoa[targetRow] = new Array(maxCols).fill(null);
          }
          const rowData = aoa[targetRow];
          rowData[0] = dateToExcelSerial(r.Date);
          rowData[1] = r["Party Name"] || r.partyName || "-";
          rowData[2] = r["Bill No"] || r.billNo || "-";
          rowData[3] = r["Batch No"] || r.batchNo || "-";
          if (id === "is13488" || id === "is12786") {
            rowData[4] = r["Production (Coils)"] || r.prodRoll || 0;
            rowData[5] = r["Production (Mtr)"] || r.prodMtr || 0;
            rowData[6] = r["Dispatch (Mtr)"] || r.dispMtr || 0;
            rowData[7] = r["Closing Stock"] || r.closingStock || 0;
          } else if (id === "is4985") {
            rowData[4] = r.prodPipe || 0;
            rowData[5] = r.dispPipe || 0;
            rowData[6] = r.closingStock || 0;
          } else {
            rowData[4] = r.prodNos || 0;
            rowData[5] = r.dispNos || 0;
            rowData[6] = r.closingStock || 0;
          }
        });

        // Create Worksheet
        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // Define Merges
        ws["!merges"] = [
          { s: { r: 0, c: 0 }, e: { r: 1, c: mainTableEndCol } }, // A1:H2 or A1:G2
          { s: { r: 2, c: 0 }, e: { r: 2, c: mainTableEndCol } }, // A3:H3 or A3:G3
          { s: { r: 3, c: 4 }, e: { r: 3, c: mainTableEndCol - 1 } }, // E4:G4 or E4:F4
          { s: { r: 4, c: 0 }, e: { r: 4, c: mainTableEndCol } }  // A5:H5 or A5:G5
        ];

        // Row Heights
        const rowHeights = new Array(aoa.length);
        rowHeights[0] = { hpt: 22 };
        rowHeights[1] = { hpt: 22 };
        rowHeights[2] = { hpt: 20 };
        rowHeights[3] = { hpt: 18 };
        rowHeights[4] = { hpx: 6 };
        rowHeights[5] = { hpt: 22 };
        for (let r = 6; r < aoa.length; r++) {
          rowHeights[r] = { hpt: 18 };
        }
        ws["!rows"] = rowHeights;

        // Helper to get or create cell
        const getOrCreateCell = (wSheet: any, r: number, c: number) => {
          const cellRef = XLSX.utils.encode_cell({ r, c });
          if (!wSheet[cellRef]) {
            wSheet[cellRef] = { t: "s", v: "" };
          }
          return wSheet[cellRef];
        };

        const styleCell = (
          wSheet: any,
          r: number,
          c: number,
          style: any
        ) => {
          const cell = getOrCreateCell(wSheet, r, c);
          cell.s = {
            ...cell.s,
            ...style
          };
        };

        const applyOutsideBorder = (wSheet: any, startR: number, startC: number, endR: number, endC: number, borderStyle = "thin") => {
          for (let r = startR; r <= endR; r++) {
            for (let c = startC; c <= endC; c++) {
              const border = { ...wSheet[XLSX.utils.encode_cell({ r, c })]?.s?.border };
              if (r === startR) border.top = { style: borderStyle, color: { rgb: "000000" } };
              if (r === endR) border.bottom = { style: borderStyle, color: { rgb: "000000" } };
              if (c === startC) border.left = { style: borderStyle, color: { rgb: "000000" } };
              if (c === endC) border.right = { style: borderStyle, color: { rgb: "000000" } };
              
              styleCell(wSheet, r, c, { border });
            }
          }
        };

        // 1. Company Title - Center + middle Align, Size 20, bold, apply outside border
        for (let r = 0; r <= 1; r++) {
          for (let c = 0; c <= mainTableEndCol; c++) {
            styleCell(ws, r, c, {
              font: { name: "Calibri", sz: 20, bold: true, color: { rgb: "000000" } },
              alignment: { horizontal: "center", vertical: "center" }
            });
          }
        }
        applyOutsideBorder(ws, 0, 0, 1, mainTableEndCol);

        // 2. IS code and size - Center + middle Align, outside border
        for (let c = 0; c <= mainTableEndCol; c++) {
          styleCell(ws, 2, c, {
            font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "000000" } },
            alignment: { horizontal: "center", vertical: "center" }
          });
        }
        applyOutsideBorder(ws, 2, 0, 2, mainTableEndCol);

        // 3. A4, B4, C4, D4 - center + middle Align, outside border for A4:D4
        for (let c = 0; c <= 3; c++) {
          styleCell(ws, 3, c, {
            alignment: { horizontal: "center", vertical: "center" }
          });
        }
        applyOutsideBorder(ws, 3, 0, 3, 3);

        // 4. "C.S. in ..." - Right + middle Align, outside border
        for (let c = 4; c <= mainTableEndCol - 1; c++) {
          styleCell(ws, 3, c, {
            alignment: { horizontal: "right", vertical: "center" }
          });
        }
        styleCell(ws, 3, mainTableEndCol, {
          alignment: { horizontal: "center", vertical: "center" }
        });
        applyOutsideBorder(ws, 3, 4, 3, mainTableEndCol);

        // 5. Black divider row
        for (let c = 0; c <= mainTableEndCol; c++) {
          styleCell(ws, 4, c, {
            fill: { fgColor: { rgb: "000000" } }
          });
        }
        applyOutsideBorder(ws, 4, 0, 4, mainTableEndCol);

        // 6. Heading of Daily Stock Ledger Table (Row 6)
        const lastTableR = 5 + filteredRows.length;
        for (let r = 5; r <= lastTableR; r++) {
          const isHeader = r === 5;
          for (let c = 0; c <= mainTableEndCol; c++) {
            let align: any = undefined;
            if (isHeader) {
              align = { horizontal: "center", vertical: "center" };
            } else {
              // Non-header row alignments
              if (c === 0 || c === 1 || c === 3) {
                align = { horizontal: "center", vertical: "center" };
              } else if (c >= 4) {
                align = { horizontal: "right", vertical: "center" };
              } else {
                align = { horizontal: "left", vertical: "center" };
              }
            }

            styleCell(ws, r, c, {
              border: {
                top: { style: "thin", color: { rgb: "A1A1A1" } },
                bottom: { style: "thin", color: { rgb: "A1A1A1" } },
                left: { style: "thin", color: { rgb: "A1A1A1" } },
                right: { style: "thin", color: { rgb: "A1A1A1" } }
              },
              alignment: align,
              ...(isHeader ? {
                font: { name: "Calibri", sz: 10, bold: true },
                fill: { fgColor: { rgb: "C4D79B" } } // Olive Green Accent 3
              } : {})
            });
          }
        }

        // 7. Monthly Summary Sidebar
        const lastSummaryR = rangePeriods.length;
        for (let r = 0; r <= lastSummaryR; r++) {
          const isHeader = r === 0;
          for (let c = sidebarStartCol; c <= sidebarStartCol + 3; c++) {
            styleCell(ws, r, c, {
              font: { name: "Calibri", sz: 10, bold: isHeader },
              fill: isHeader ? { fgColor: { rgb: "D9E1F2" } } : undefined,
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            });
          }
        }

        // Apply native formatting
        Object.keys(ws).forEach((cellRef) => {
          if (cellRef.startsWith("!")) return;
          const cell = ws[cellRef];
          if (!cell || cell.v === undefined) return;

          const colLetter = cellRef.replace(/[0-9]/g, "");
          const rowNum = Number(cellRef.replace(/[^0-9]/g, ""));

          if (colLetter === "A" && rowNum >= 7) {
            cell.t = "n";
            cell.z = "dd/mm/yyyy";
          }
          if ((colLetter === "B" || colLetter === "D") && rowNum === 4) {
            cell.t = "n";
            cell.z = "dd/mm/yyyy";
          }
          if (colLetter === monthColLetter && rowNum >= 2 && rowNum <= 1 + rangePeriods.length) {
            cell.t = "n";
            cell.z = "mmm-yy";
          }
        });

        // Set column widths using scaled-down character widths (wch)
        if (isMultiColumnLedger) {
          ws["!cols"] = [
            { wch: 11.44 }, // A: Date
            { wch: 9.81  }, // B: Party Name
            { wch: 13.62 }, // C: Bill No
            { wch: 9.81  }, // D: Batch No
            { wch: 11.00 }, // E: MFG in Roll / Pipe
            { wch: 11.77 }, // F: MFG in Meter
            { wch: 18.20 }, // G: Dispatch QTY in Meter
            { wch: 10.57 }, // H: C. S in Meter / Pipe
            { wch: 3.00  }, // I: spacer
            { wch: 12.00 }, // J: Month
            { wch: 18.00 }, // K: Sum of Production
            { wch: 18.00 }, // L: Sum of Dispatch
            { wch: 15.00 }  // M: Closing Stock
          ];
        } else {
          ws["!cols"] = [
            { wch: 11.44 }, // A: Date
            { wch: 9.81  }, // B: Party Name
            { wch: 13.62 }, // C: Bill No
            { wch: 9.81  }, // D: Batch No
            { wch: 11.00 }, // E: MFG in Nos
            { wch: 18.20 }, // F: Dispatch QTY in Nos
            { wch: 11.00 }, // G: C. S in Nos
            { wch: 3.00  }, // H: spacer
            { wch: 12.00 }, // I: Month
            { wch: 18.00 }, // J: Sum of Production
            { wch: 18.00 }, // K: Sum of Dispatch
            { wch: 15.00 }  // L: Closing Stock
          ];
        }

        const sheetName = isMultiColumnLedger ? getIs13488SheetName(sz) : sz.toUpperCase();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        hasSheets = true;
      });
    } else {
      // -------------------------------------------------------------
      // Generic Export Layout for other Standards
      // -------------------------------------------------------------
      sizesToExport.forEach((sz) => {
        // 1. Production Logs for this size
        if (forceProd) {
          const sizeProd = prodEntries.filter((e) => e.size === sz);
          if (sizeProd.length > 0) {
            const rows = sizeProd.map((e) => ({
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
            const sheetName = getSafeSheetName("Prod", sz);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            hasSheets = true;
          }
        }

        // 2. Dispatch Logs for this size
        if (forceDisp) {
          const sizeDisp = dispEntries.filter((e) => e.size === sz);
          if (sizeDisp.length > 0) {
            const renderedDisp = getDispatchRenderData(sizeDisp, sz);
            const rows = renderedDisp.map((e) => ({
              "Date": formatDateToDMY(e.date),
              "Size": e.size,
              "Party Name": e.partyName || "",
              "Bill No": e.billNo || "",
              "Batch No": e.batchNo || "",
              "Prod Roll": e.prodRoll || "",
              "Coils": e.coils || "",
              "Mtr Per Coil": e.mtrPerCoil || "",
              "Mtr": e.dispMtr || e.dispNos || e.dispPipe || "",
              "Kg": e.kg || "",
              "Pipe": e.pipe || "",
              "Tonn": e.tonn || "",
              "Nos": e.nos || "",
              "Thousand Unit": e.thousandUnit || "",
              "Value": e.value || 0
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            const sheetName = getSafeSheetName("Disp", sz);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            hasSheets = true;
          }
        }

        // 3. Stock Ledger for this size
        if (forceStock) {
          const rows = getFullStockLedgerForSize(sz, fromMonth, fromYear, toMonth, toYear);
          const filteredRows = rows.filter((entry: any) => {
            const parts = entry.Date.split("-");
            if (parts.length < 2) return false;
            const y = Number(parts[0]);
            const m = Number(parts[1]);
            const mIdx = m - 1;

            const fromMIdx = MONTHS.indexOf(fromMonth);
            const fromYrVal = Number(fromYear);
            const toMIdx = MONTHS.indexOf(toMonth);
            const toYrVal = Number(toYear);

            const isAfterFrom = y > fromYrVal || (y === fromYrVal && mIdx >= fromMIdx);
            const isBeforeTo = y < toYrVal || (y === toYrVal && mIdx <= toMIdx);

            return isAfterFrom && isBeforeTo;
          });

          if (filteredRows.length > 0) {
            const formattedRows = filteredRows.map(r => ({
              ...r,
              "Date": formatDateToDMY(r.Date)
            }));
            const ws = XLSX.utils.json_to_sheet(formattedRows);
            const sheetName = getSafeSheetName("Stock", sz);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            hasSheets = true;
          }
        }
      });
    }

    if (!hasSheets) {
      alert("No data available to export for the selected sizes/options.");
      return;
    }

    if (id === "is13488" || id === "is13487" || id === "is12786" || id === "is4985" || id === "is17425" || id === "is14483") {
      XLSXStyle.writeFile(wb, `${id?.toUpperCase()}_Inventory_Report.xlsx`);
    } else {
      XLSX.writeFile(wb, `${id?.toUpperCase()}_Inventory_Report.xlsx`);
    }
  };

  // Export logs to Excel workbook using standard panel states
  const handleExportExcel = () => {
    performExport(exportSizes, exportProd, exportDisp, exportStock);
  };

  const isProductionView = type === "production";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100 py-10 px-6 font-sans relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent_40%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
          <Link href="/sms" className="hover:text-indigo-400 transition-colors">Stock Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/sms/standard/${id}`} className="hover:text-indigo-400 transition-colors">{currentStandard.name}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300">{entryTypeLabel}</span>
        </nav>

        {/* Title Section */}
        <div className="mb-8 border-b border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span>{entryTypeLabel}</span>
              {isOnline ? (
                isSyncing ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Syncing...</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Cloud Synced</span>
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Local Mode</span>
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Standard: <span className="text-slate-200 font-semibold">{currentStandard.name} ({currentStandard.subName})</span>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/sms/standard/${id}`)}
            className="text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-slate-900 self-start sm:self-center gap-1.5 h-9"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Standard Panel</span>
          </Button>
        </div>

        {/* Sidebar Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Vertical Size Menu */}
          {type !== "export" && type !== "consignee" && (
            <div className="w-full lg:w-64 bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shrink-0">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-900/60">
                Select Size / Class
              </h2>
              <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto max-h-[400px] pr-1 pb-2 lg:pb-0">
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`whitespace-nowrap text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-between border shrink-0 lg:shrink-0 ${
                      selectedSize === sz
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                        : "bg-slate-900/40 text-slate-400 border-slate-900 hover:text-slate-200 hover:bg-slate-900/80"
                    }`}
                  >
                    <span>{sz}</span>
                    {selectedSize === sz && <div className="hidden lg:block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </button>
                ))}
                {sizes.length === 0 && (
                  <div className="text-slate-500 text-xs italic py-4 text-center">No sizes configured</div>
                )}
              </div>
            </div>
          )}

          {/* Right Content Panel */}
          {type === "export" ? (
            <div className="flex-1 w-full max-w-2xl mx-auto space-y-6">
              <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-6 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Download className="w-5 h-5 text-indigo-400" />
                    <span>Export Daily Stock Ledger Report</span>
                  </h2>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Select sizes/classes and set the default date range to export a highly-formatted Excel daily stock register.
                  </p>
                </div>

                {/* Date range filters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">From Month</label>
                    <select
                      value={fromMonth}
                      onChange={(e) => setFromMonth(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">From Year</label>
                    <select
                      value={fromYear}
                      onChange={(e) => setFromYear(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">To Month</label>
                    <select
                      value={toMonth}
                      onChange={(e) => setToMonth(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">To Year</label>
                    <select
                      value={toYear}
                      onChange={(e) => setToYear(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Size selections checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Select Sizes</label>
                    <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-indigo-400">
                      <button 
                        type="button" 
                        onClick={() => setExportLedgerSelectedSizes(sizes)}
                        className="hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-slate-700">|</span>
                      <button 
                        type="button" 
                        onClick={() => setExportLedgerSelectedSizes([])}
                        className="hover:underline"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2.5 bg-slate-950/40 p-4 border border-slate-900 rounded-xl">
                    {sizes.map((sz) => {
                      const isChecked = exportLedgerSelectedSizes.includes(sz);
                      return (
                        <label key={sz} className="flex items-center gap-3 cursor-pointer text-xs text-slate-300 hover:text-slate-100 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setExportLedgerSelectedSizes(exportLedgerSelectedSizes.filter(s => s !== sz));
                              } else {
                                setExportLedgerSelectedSizes([...exportLedgerSelectedSizes, sz]);
                              }
                            }}
                            className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                          />
                          <span className="font-medium">{sz}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => {
                    if (exportLedgerSelectedSizes.length === 0) {
                      alert("Please select at least one size.");
                      return;
                    }
                    performExport(exportLedgerSelectedSizes, false, false, true);
                  }}
                  disabled={exportLedgerSelectedSizes.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate & Export Excel</span>
                </button>
              </div>
            </div>
          ) : type === "consignee" ? (
            <div className="flex-1 w-full max-w-3xl mx-auto space-y-6">
              <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-6 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span>Consignee Dispatch Summary Report</span>
                  </h2>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Generate month-wise sums of dispatched products to selected consignees. Manage the default consignees list in the <a href="/sms/settings" className="text-indigo-450 hover:underline">Settings Menu</a>.
                  </p>
                </div>

                {/* Dispatch / Consignee Sales Importers */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Step 1: Verify Dispatch Data ({dispEntries.length} entries loaded)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-indigo-500/40 bg-slate-950/50 rounded-xl p-5 cursor-pointer hover:bg-slate-950 transition-all text-center">
                      <FileSpreadsheet className="w-8 h-8 text-indigo-400 mb-2" />
                      <span className="text-xs font-semibold text-slate-350">Import Dispatch Ledger Excel</span>
                      <span className="text-[10px] text-slate-500 mt-1">Upload daily ledger file to populate dispatches</span>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleImportDispExcel} 
                        className="hidden" 
                      />
                    </label>

                    <label className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-indigo-500/40 bg-slate-950/50 rounded-xl p-5 cursor-pointer hover:bg-slate-950 transition-all text-center">
                      <UploadCloud className="w-8 h-8 text-emerald-400 mb-2" />
                      <span className="text-xs font-semibold text-slate-350">Import Consignee Sales Excel</span>
                      <span className="text-[10px] text-slate-500 mt-1">Extract sizes & quantities from Consignee Sales files</span>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleImportConsigneeSales} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  {importStatus && (
                    <div className={`p-3 rounded-lg text-xs font-semibold ${
                      importStatus.type === "success" 
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                        : "bg-red-500/10 border border-red-500/20 text-red-400"
                    }`}>
                      {importStatus.message}
                    </div>
                  )}

                  {/* Clear imported consignee data — always visible */}
                  <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <UploadCloud className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>
                        {importedConsigneeIds.size > 0
                          ? <><span className="text-emerald-400 font-bold">{importedConsigneeIds.size}</span> imported dispatch entries active in session</>
                          : "No imported consignee data in current session"
                        }
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearImportedData}
                      disabled={importedConsigneeIds.size === 0}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 hover:text-white rounded-lg text-[10px] font-bold transition-all shrink-0 ml-3"
                    >
                      Clear Imported Data
                    </button>
                  </div>
                </div>

                {/* Filter and Date selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Month</label>
                    <select
                      value={consigneeReportMonth}
                      onChange={(e) => setConsigneeReportMonth(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none transition-colors"
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Year</label>
                    <select
                      value={consigneeReportYear}
                      onChange={(e) => setConsigneeReportYear(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none transition-colors"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Consignee checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Step 2: Select Consignees</label>
                    <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-indigo-400">
                      <button 
                        type="button" 
                        onClick={() => setSelectedConsignees(activeConsignees)}
                        className="hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-slate-700">|</span>
                      <button 
                        type="button" 
                        onClick={() => setSelectedConsignees([])}
                        className="hover:underline"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={consigneeSearch}
                    onChange={(e) => setConsigneeSearch(e.target.value)}
                    placeholder="Search consignees..."
                    className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                  />

                  <div className="flex items-center gap-2 px-1">
                    <input
                      type="checkbox"
                      id="showSavedOnlyCheckbox"
                      checked={showSavedOnly}
                      onChange={(e) => setShowSavedOnly(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <label htmlFor="showSavedOnlyCheckbox" className="text-[11px] font-semibold text-slate-400 cursor-pointer select-none hover:text-slate-300 transition-colors">
                      Show registered/saved consignees only
                    </label>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2.5 bg-slate-950/40 p-4 border border-slate-900 rounded-xl">
                    {activeConsignees.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                        <AlertTriangle className="w-6 h-6 text-amber-500/60" />
                        <p className="text-xs font-semibold text-slate-400">No dispatch records found for {consigneeReportMonth} {consigneeReportYear}</p>
                        <p className="text-[10px] text-slate-500">Import Consignee Sales data or select a different month/year.</p>
                      </div>
                    ) : activeConsignees
                      .filter(name => name.toLowerCase().includes(consigneeSearch.toLowerCase()))
                      .map((name) => {
                        const isChecked = selectedConsignees.includes(name);
                        const isSaved = registeredNames.has(getCleanConsigneeName(name).toLowerCase());
                        return (
                          <label key={name} className="flex items-center gap-3 cursor-pointer text-xs text-slate-300 hover:text-slate-100 transition-colors">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedConsignees(selectedConsignees.filter(s => s !== name));
                                } else {
                                  setSelectedConsignees([...selectedConsignees, name]);
                                }
                              }}
                              className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                            />
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{name}</span>
                              {isSaved && (
                                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-95 origin-left">
                                  Saved
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                  </div>

                  {selectedConsignees.length < 3 && (
                    <div className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>At least 3 consignees are typically needed for BIS portal reports (Selected: {selectedConsignees.length}).</span>
                    </div>
                  )}

                  {/* Missing Details Warnings Checklist */}
                  {selectedConsignees.length > 0 && (() => {
                    const warnings = getConsigneeWarnings();
                    if (warnings.length === 0) return null;

                    return (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-red-405 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                          <span>Missing Consignee Details Found</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          The following selected consignees do not have complete address or contact details. Please configure them or remove them from selection:
                        </p>
                        
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {warnings.map((w) => (
                            <div key={w.name} className="flex items-center justify-between gap-3 bg-slate-950/45 p-2 rounded-lg border border-slate-900/60">
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-bold text-slate-200 block truncate">{w.name}</span>
                                <span className="text-[9px] text-red-450 font-medium">
                                  Missing: {w.missing.join(", ")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConsigneeEditModal({
                                      show: true,
                                      consigneeName: w.name,
                                      address: w.obj.address || "",
                                      city: w.obj.city || "",
                                      district: w.obj.district || "",
                                      state: w.obj.state || "",
                                      country: w.obj.country || "India",
                                      pincode: w.obj.pincode || "",
                                      telephone: w.obj.telephone || "",
                                      mobile: w.obj.mobile || "",
                                      email: w.obj.email || ""
                                    });
                                  }}
                                  className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-655 text-indigo-400 hover:text-white rounded text-[10px] font-bold transition-all"
                                >
                                  Configure Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedConsignees(selectedConsignees.filter(c => c !== w.name));
                                  }}
                                  className="px-2 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded text-[10px] font-bold transition-all"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={generateConsigneeReport}
                  disabled={selectedConsignees.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
                >
                  <span>Generate Monthwise Consignee Summary</span>
                </button>
              </div>

              {/* On-screen Preview Table */}
              {consigneeReportRows.length > 0 && (
                <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                    <h3 className="text-sm font-bold text-slate-200">
                      Report Preview
                      <span className="ml-2 text-xs font-normal text-slate-400">({consigneeReportRows.length} entries)</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={exportFilename}
                        onChange={(e) => setExportFilename(e.target.value)}
                        placeholder="Export filename..."
                        title="Enter custom filename for Excel export"
                        className="bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none transition-colors h-8 font-medium w-48"
                      />
                      <button
                        type="button"
                        onClick={() => setConsigneeReportRows([])}
                        className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-[10px] font-bold transition-all h-8"
                      >
                        Clear All
                      </button>
                      <Button
                        onClick={performConsigneeExport}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-8 px-4 rounded-xl flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export to Excel</span>
                      </Button>
                    </div>
                  </div>

                  <div className="border border-slate-900 rounded-xl overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-850">
                          <th className="p-3">Brand Name</th>
                          <th className="p-3">Consignee's Name</th>
                          <th className="p-3">Address</th>
                          <th className="p-3">Location Details</th>
                          <th className="p-3">Contact Details</th>
                          <th className="p-3 text-right">Quantity</th>
                          <th className="p-3">Period</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/50">
                        {(() => {
                          const stored = localStorage.getItem("sms_consignees");
                          let registeredObjects: any[] = [];
                          if (stored) {
                            try { registeredObjects = JSON.parse(stored); } catch (e) {}
                          }
                          return consigneeReportRows.map((row, idx) => {
                            const obj = registeredObjects.find(
                              r => r && r.name && getCleanConsigneeName(r.name).toLowerCase() === getCleanConsigneeName(row.consigneeName).toLowerCase()
                            ) || {};
                            return (
                              <tr key={`${row.consigneeName}-${row.month}-${row.year}`} className="hover:bg-slate-900/10 text-slate-300">
                                <td className="p-3 font-semibold text-slate-400">PARAGON</td>
                                <td className="p-3 font-bold text-slate-100">{obj.name || row.consigneeName}</td>
                                <td className="p-3 text-slate-350 max-w-[250px] truncate" title={obj.address || ""}>
                                  {obj.address || "-"}
                                </td>
                                <td className="p-3 text-slate-350">
                                  {[obj.city, obj.district, obj.state, obj.pincode].filter(Boolean).join(", ") || "-"}
                                </td>
                                <td className="p-3 text-slate-350 space-y-0.5">
                                  {obj.mobile && <div><span className="text-[10px] text-slate-500 font-bold">M:</span> {obj.mobile}</div>}
                                  {obj.email && <div><span className="text-[10px] text-slate-500 font-bold">E:</span> {obj.email}</div>}
                                  {!obj.mobile && !obj.email && "-"}
                                </td>
                                <td className="p-3 text-right font-extrabold text-indigo-400">
                                  {row.qty.toLocaleString()}
                                </td>
                                <td className="p-3 text-slate-400 uppercase text-[10px] font-bold whitespace-nowrap">
                                  {row.month} {row.year}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    title="Remove this row"
                                    onClick={() => setConsigneeReportRows(prev => prev.filter((_, i) => i !== idx))}
                                    className="p-1.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : isProductionView ? (
            <div className="flex-1 w-full space-y-6">
              {/* Add Entry Card Form */}
              <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>New Production Entry - {selectedSize}</span>
                </h2>
                <form onSubmit={handleAddEntry} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
                  {/* Date Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Date</label>
                    <input
                      type="date"
                      required
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Size Input (Disabled) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Size</label>
                    <input
                      type="text"
                      disabled
                      value={selectedSize}
                      className="w-full bg-slate-900/50 border border-slate-900 text-slate-400 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* IS 13488 and IS 12786 Fields */}
                  {(id === "is13488" || id === "is12786") && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (Coil)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 10"
                          value={coils}
                          onChange={(e) => setCoils(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">MTR Per Coil</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 100"
                          value={mtrPerCoil}
                          onChange={(e) => setMtrPerCoil(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (MTR)</label>
                        <input
                          type="number"
                          disabled
                          value={computedFormMtr}
                          className="w-full bg-slate-900/50 border border-slate-900 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (KG)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          min="0.1"
                          placeholder="e.g. 45.5"
                          value={kg}
                          onChange={(e) => setKg(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                        />
                      </div>
                    </>
                  )}

                  {/* IS 4985 Fields */}
                  {id === "is4985" && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (Pipe)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 25"
                          value={pipe}
                          onChange={(e) => setPipe(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (KG)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          min="0.1"
                          placeholder="e.g. 45.5"
                          value={kg}
                          onChange={(e) => setKg(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (Tonn)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          min="0.001"
                          placeholder="e.g. 1.25"
                          value={tonn}
                          onChange={(e) => setTonn(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                        />
                      </div>
                    </>
                  )}

                  {/* IS 17425 Fields */}
                  {id === "is17425" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (Pipe)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 20"
                        value={pipe}
                        onChange={(e) => setPipe(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  {/* IS 13487 Fields */}
                  {id === "is13487" && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (Nos)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 5000"
                          value={nos}
                          onChange={(e) => setNos(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Unit of 1000</label>
                        <input
                          type="number"
                          disabled
                          value={computedThousandNos}
                          className="w-full bg-slate-900/50 border border-slate-900 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed"
                        />
                      </div>
                    </>
                  )}

                  {/* IS 14483 Fields */}
                  {id === "is14483" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (Nos)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 15"
                        value={nos}
                        onChange={(e) => setNos(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  {/* Value (Rs.) Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Value (Rs.)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 5000"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="sm:col-span-2 md:col-span-4 lg:col-span-6 flex justify-end mt-2">
                    <Button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all duration-200"
                    >
                      Save Entry
                    </Button>
                  </div>
                </form>
              </div>

              {/* Data Table Card */}
              <div className="bg-slate-900/10 border border-slate-900 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-slate-300">
                    Production Logs - {selectedSize}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    {importStatus && (
                      <span className={`text-[11px] font-semibold px-3 py-1 rounded-xl border ${
                        importStatus.type === "success" 
                          ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" 
                          : "bg-red-950/20 border-red-500/20 text-red-400"
                      }`}>
                        {importStatus.message}
                      </span>
                    )}

                    <label className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-colors h-9">
                      <Upload className="w-4 h-4 text-indigo-400" />
                      <span>Import Production Excel</span>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleImportProdExcel} 
                        className="hidden" 
                      />
                    </label>

                    <span className="text-[10px] px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 font-semibold">
                      {filteredEntries.length} Records
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/30 text-slate-400 uppercase tracking-widest text-[9px] font-bold border-b border-slate-900">
                        <th className="p-4">Date</th>
                        <th className="p-4">Size</th>
                        
                        {/* Dynamic Headers */}
                        {(id === "is13488" || id === "is12786") && (
                          <>
                            <th className="p-4 text-right">Production (Coil)</th>
                            <th className="p-4 text-right">MTR Per Coil</th>
                            <th className="p-4 text-right">Production (MTR)</th>
                            <th className="p-4 text-right">Production (KG)</th>
                          </>
                        )}
                        {id === "is4985" && (
                          <>
                            <th className="p-4 text-right">Production (Pipe)</th>
                            <th className="p-4 text-right">Production (KG)</th>
                            <th className="p-4 text-right">Production (Tonn)</th>
                          </>
                        )}
                        {id === "is17425" && (
                          <th className="p-4 text-right">Production (Pipe)</th>
                        )}
                        {id === "is13487" && (
                          <>
                            <th className="p-4 text-right">Production (Nos)</th>
                            <th className="p-4 text-right">Unit of 1000</th>
                          </>
                        )}
                        {id === "is14483" && (
                          <th className="p-4 text-right">Production (Nos)</th>
                        )}

                        <th className="p-4 text-right">Value (Rs.)</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {filteredEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-900/25 transition-colors">
                          <td className="p-4 text-slate-300 font-medium whitespace-nowrap">{formatDateToDMY(entry.date)}</td>
                          <td className="p-4 text-slate-400 whitespace-nowrap">{entry.size}</td>

                          {/* Dynamic Cells */}
                          {(id === "is13488" || id === "is12786") && (
                            <>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.coils}</td>
                              <td className="p-4 text-right text-slate-400 whitespace-nowrap">{entry.mtrPerCoil} m</td>
                              <td className="p-4 text-right text-slate-200 font-semibold whitespace-nowrap">{entry.mtr} m</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.kg} kg</td>
                            </>
                          )}
                          {id === "is4985" && (
                            <>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.pipe}</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.kg} kg</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.tonn} ton</td>
                            </>
                          )}
                          {id === "is17425" && (
                            <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.pipe}</td>
                          )}
                          {id === "is13487" && (
                            <>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.nos}</td>
                              <td className="p-4 text-right text-slate-200 font-semibold whitespace-nowrap">{entry.thousandUnit}</td>
                            </>
                          )}
                          {id === "is14483" && (
                            <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.nos}</td>
                          )}

                          <td className="p-4 text-right text-indigo-400 font-semibold whitespace-nowrap">₹{entry.value.toLocaleString("en-IN")}</td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredEntries.length === 0 && (
                        <tr>
                          <td 
                            colSpan={
                              id === "is13488" || id === "is12786" ? 8 :
                              id === "is4985" ? 7 :
                              id === "is13487" ? 6 :
                              id === "is17425" || id === "is14483" ? 5 : 5
                            } 
                            className="p-12 text-center text-slate-500 italic"
                          >
                            No production entries logged for {selectedSize} yet. Fill the form above to add one.
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {/* Summary row */}
                    {filteredEntries.length > 0 && (
                      <tfoot>
                        <tr className="bg-indigo-950/20 text-slate-200 font-bold border-t border-slate-900">
                          <td colSpan={2} className="p-4 text-slate-400 uppercase tracking-widest text-[9px]">Totals</td>
                          
                          {(id === "is13488" || id === "is12786") && (
                            <>
                              <td className="p-4 text-right text-slate-100">{totalCoils}</td>
                              <td className="p-4"></td>
                              <td className="p-4 text-right text-slate-100">{totalMtr} m</td>
                              <td className="p-4 text-right text-slate-100">{totalKg.toFixed(2)} kg</td>
                            </>
                          )}
                          {id === "is4985" && (
                            <>
                              <td className="p-4 text-right text-slate-100">{totalPipe}</td>
                              <td className="p-4 text-right text-slate-100">{totalKg.toFixed(2)} kg</td>
                              <td className="p-4 text-right text-slate-100">{totalTonn.toFixed(3)} ton</td>
                            </>
                          )}
                          {id === "is17425" && (
                            <td className="p-4 text-right text-slate-100">{totalPipe}</td>
                          )}
                          {id === "is13487" && (
                            <>
                              <td className="p-4 text-right text-slate-100">{totalNos}</td>
                              <td className="p-4 text-right text-slate-100">{totalThousand.toFixed(2)}</td>
                            </>
                          )}
                          {id === "is14483" && (
                            <td className="p-4 text-right text-slate-100">{totalNos}</td>
                          )}

                          <td className="p-4 text-right text-indigo-400">₹{totalValue.toLocaleString("en-IN")}</td>
                          <td className="p-4"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          ) : type === "dispatch" ? (
            /* Dispatch Content Panel (Size columns/inputs not shown as per request) */
            <div className="flex-1 w-full space-y-6">
              {/* Add Entry Card Form */}
              <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>New Dispatch Entry - {selectedSize}</span>
                </h2>
                <form onSubmit={handleAddEntry} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
                  {/* Date Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Date</label>
                    <input
                      type="date"
                      required
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Party Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Party Name</label>
                    <input
                      type="text"
                      disabled
                      value={
                        (id === "is13488" || id === "is12786") ? ((Number(dispMtr) || 0) > 0 ? "FARMER" : "-") :
                        (id === "is13487" || id === "is14483" || id === "is17425") ? ((Number(dispNos) || 0) > 0 ? "FARMER" : "-") :
                        id === "is4985" ? (((Number(dispPipe) || 0) > 0 || (Number(dispMtrPipe) || 0) > 0) ? "FARMER" : "-") : "-"
                      }
                      className="w-full bg-slate-900/50 border border-slate-900 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Bill No */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Bill No</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B-542"
                      value={billNo}
                      onChange={(e) => setBillNo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Batch No */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Batch No</label>
                    <input
                      type="text"
                      disabled
                      value={getComputedBatchNo()}
                      className="w-full bg-slate-900/50 border border-slate-900 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* IS 13488 & IS 12786 Dispatch Fields */}
                  {(id === "is13488" || id === "is12786") && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (Roll)</label>
                        <input
                          type="number"
                          disabled
                          value={currentMatchingProd ? (currentMatchingProd.coils || 0) : 0}
                          className="w-full bg-slate-900/50 border border-slate-900 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (Mtr)</label>
                        <input
                          type="number"
                          disabled
                          value={currentMatchingProd ? (currentMatchingProd.mtr || 0) : 0}
                          className="w-full bg-slate-900/50 border border-slate-900 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Dispatch qty (Mtr)</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 4000"
                          value={dispMtr}
                          onChange={(e) => setDispMtr(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Closing Stock (Mtr)</label>
                        <input
                          type="number"
                          disabled
                          value={computedDispMtrClose}
                          className="w-full bg-slate-900/50 border border-slate-900 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed"
                        />
                      </div>
                    </>
                  )}

                  {/* IS 13487, IS 14483 & IS 17425 Dispatch Fields */}
                  {(id === "is13487" || id === "is14483" || id === "is17425") && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (Nos)</label>
                        <input
                          type="number"
                          disabled
                          value={
                            currentMatchingProd 
                              ? (id === "is17425" ? (currentMatchingProd.pipe || 0) : (currentMatchingProd.nos || 0))
                              : 0
                          }
                          className="w-full bg-slate-900/50 border border-slate-900 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Dispatch qty (Nos)</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 800"
                          value={dispNos}
                          onChange={(e) => setDispNos(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Closing Stock (Nos)</label>
                        <input
                          type="number"
                          disabled
                          value={computedDispNosClose}
                          className="w-full bg-slate-900/50 border border-slate-900 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed"
                        />
                      </div>
                    </>
                  )}

                  {/* IS 4985 Dispatch Fields */}
                  {id === "is4985" && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (Pipe)</label>
                        <input
                          type="number"
                          disabled
                          value={currentMatchingProd ? (currentMatchingProd.pipe || 0) : 0}
                          className="w-full bg-slate-900/50 border border-slate-900 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Production (Mtr)</label>
                        <input
                          type="number"
                          disabled
                          value={currentMatchingProd ? (currentMatchingProd.pipe || 0) * 6 : 0}
                          className="w-full bg-slate-900/50 border border-slate-900 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Dispatch qty (Pipe)</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 150"
                          value={dispPipe}
                          onChange={(e) => setDispPipe(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Dispatch qty (Mtr)</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 900"
                          value={dispMtrPipe}
                          onChange={(e) => setDispMtrPipe(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Closing Stock (Pipe)</label>
                        <input
                          type="number"
                          disabled
                          value={computedDispPipeClose}
                          className="w-full bg-slate-900/50 border border-slate-900 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed"
                        />
                      </div>
                    </>
                  )}

                  {/* Submit Button */}
                  <div className="sm:col-span-2 md:col-span-4 lg:col-span-6 flex justify-end mt-2">
                    <Button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all duration-200"
                    >
                      Save Entry
                    </Button>
                  </div>
                </form>
              </div>

              {/* Data Table Card */}
              <div className="bg-slate-900/10 border border-slate-900 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-900 flex items-center justify-between flex-wrap gap-3">
                  <h3 className="text-sm font-bold text-slate-300">
                    Dispatch Logs - {selectedSize}
                  </h3>
                  <div className="flex items-center gap-3">
                    {id === "is12786" && selectedSize === "20mm Cl-1" && (
                      <>
                        <label className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-3 py-2 font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all border border-emerald-500/30 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          Import 20mm Cl-1 Excel
                          <input 
                            type="file" 
                            accept=".xlsx, .xls" 
                            onChange={handleImportDispExcel} 
                            className="hidden" 
                          />
                        </label>
                        <Button
                          onClick={handleReconcileCl1}
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-3 py-2 font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all border border-indigo-500/30 cursor-pointer"
                        >
                          <Workflow className="w-3.5 h-3.5" />
                          Reconcile & Combine from 20mm Cl-2
                        </Button>
                      </>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-semibold">
                      {filteredEntries.length} Records
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/30 text-slate-400 uppercase tracking-widest text-[9px] font-bold border-b border-slate-900">
                        <th className="p-4">Date</th>
                        <th className="p-4">Party Name</th>
                        <th className="p-4">Bill No</th>
                        <th className="p-4">Batch No</th>
                        
                        {/* Dynamic Headers */}
                        {(id === "is13488" || id === "is12786") && (
                          <>
                            <th className="p-4 text-right">Production (Roll)</th>
                            <th className="p-4 text-right">Production (Mtr)</th>
                            <th className="p-4 text-right">Dispatch qty (Mtr)</th>
                            <th className="p-4 text-right">Closing Stock (Mtr)</th>
                          </>
                        )}
                        {(id === "is13487" || id === "is14483" || id === "is17425") && (
                          <>
                            <th className="p-4 text-right">Production (Nos)</th>
                            <th className="p-4 text-right">Dispatch qty (Nos)</th>
                            <th className="p-4 text-right">Closing Stock (Nos)</th>
                          </>
                        )}
                        {id === "is4985" && (
                          <>
                            <th className="p-4 text-right">Production (Pipe)</th>
                            <th className="p-4 text-right">Production (Mtr)</th>
                            <th className="p-4 text-right">Dispatch qty (Pipe)</th>
                            <th className="p-4 text-right">Dispatch qty (Mtr)</th>
                            <th className="p-4 text-right">Closing Stock (Pipe)</th>
                          </>
                        )}

                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {renderedEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-900/25 transition-colors">
                          <td className="p-4 text-slate-300 font-medium whitespace-nowrap">{formatDateToDMY(entry.date)}</td>
                          <td className="p-4 text-slate-300 whitespace-nowrap">{entry.partyName}</td>
                          <td className="p-4 text-slate-400 whitespace-nowrap">{entry.billNo}</td>
                          <td className="p-4 text-slate-400 whitespace-nowrap">{entry.batchNo}</td>

                          {/* Dynamic Cells */}
                          {(id === "is13488" || id === "is12786") && (
                            <>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.prodRoll}</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.prodMtr} m</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.dispMtr} m</td>
                              <td className="p-4 text-right text-emerald-400 font-semibold whitespace-nowrap">{entry.closeMtr} m</td>
                            </>
                          )}
                          {(id === "is13487" || id === "is14483" || id === "is17425") && (
                            <>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.prodNos}</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.dispNos}</td>
                              <td className="p-4 text-right text-emerald-400 font-semibold whitespace-nowrap">{entry.closeNos}</td>
                            </>
                          )}
                          {id === "is4985" && (
                            <>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.prodPipe}</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.prodMtrPipe} m</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.dispPipe}</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.dispMtrPipe} m</td>
                              <td className="p-4 text-right text-emerald-400 font-semibold whitespace-nowrap">{entry.closePipe}</td>
                            </>
                          )}

                          <td className="p-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredEntries.length === 0 && (
                        <tr>
                          <td 
                            colSpan={
                              id === "is13488" || id === "is12786" ? 9 :
                              id === "is4985" ? 10 :
                              id === "is13487" || id === "is14483" || id === "is17425" ? 8 : 8
                            } 
                            className="p-12 text-center text-slate-500 italic"
                          >
                            No dispatch entries logged for {selectedSize} yet. Fill the form above to add one.
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {/* Summary row */}
                    {filteredEntries.length > 0 && (
                      <tfoot>
                        <tr className="bg-indigo-950/20 text-slate-200 font-bold border-t border-slate-900">
                          <td colSpan={4} className="p-4 text-slate-400 uppercase tracking-widest text-[9px]">Totals</td>
                          
                          {(id === "is13488" || id === "is12786") && (
                            <>
                              <td className="p-4 text-right text-slate-100">{totalProdRoll}</td>
                              <td className="p-4 text-right text-slate-100">{totalProdMtr} m</td>
                              <td className="p-4 text-right text-slate-100">{totalDispMtr} m</td>
                              <td className="p-4 text-right text-emerald-400">{totalCloseMtr} m</td>
                            </>
                          )}
                          {(id === "is13487" || id === "is14483" || id === "is17425") && (
                            <>
                              <td className="p-4 text-right text-slate-100">{totalProdNos}</td>
                              <td className="p-4 text-right text-slate-100">{totalDispNos}</td>
                              <td className="p-4 text-right text-emerald-400">{totalCloseNos}</td>
                            </>
                          )}
                          {id === "is4985" && (
                            <>
                              <td className="p-4 text-right text-slate-100">{totalProdPipe}</td>
                              <td className="p-4 text-right text-slate-100">{totalProdMtrPipe} m</td>
                              <td className="p-4 text-right text-slate-100">{totalDispPipe}</td>
                              <td className="p-4 text-right text-slate-100">{totalDispMtrPipe} m</td>
                              <td className="p-4 text-right text-emerald-400">{totalClosePipe}</td>
                            </>
                          )}

                          <td className="p-4"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          ) : type === "stock" ? (
            <div className="flex-1 w-full space-y-6">
              {/* Top Config Card */}
              <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-6 space-y-6">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-slate-200">Daily Stock Ledger</h2>
                  <p className="text-slate-400 text-xs">
                    Review production runs, dispatch records, and calculated inventory balances for size {selectedSize}.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-900">
                  {/* Column 1: Closing Stock On */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Closing Stock On
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={stockMonth}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStockMonth(val);
                          const mKey = `sms_last_stock_${id}_${selectedSize}_${stockYear}_${val}`;
                          const savedMVal = localStorage.getItem(mKey) || localStorage.getItem(`sms_last_stock_${id}_${selectedSize}`) || "0";
                          setLastClosingStock(savedMVal);
                        }}
                        className="bg-slate-950 border border-slate-900 text-slate-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors h-9 cursor-pointer w-full"
                      >
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={stockYear}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStockYear(val);
                          const mKey = `sms_last_stock_${id}_${selectedSize}_${val}_${stockMonth}`;
                          const savedMVal = localStorage.getItem(mKey) || localStorage.getItem(`sms_last_stock_${id}_${selectedSize}`) || "0";
                          setLastClosingStock(savedMVal);
                        }}
                        className="bg-slate-950 border border-slate-900 text-slate-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors h-9 cursor-pointer w-full"
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Column 2: Last Closing Stock */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Last Closing Stock
                    </span>
                    {hasEntriesInPrevMonth() ? (
                      <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-900/60 rounded-xl px-3 py-1.5 h-9 w-full justify-between">
                        <span className="text-xs font-bold text-slate-300">
                          {getAutoClosingStockForPrevMonth()}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium italic select-none">
                          Auto-calculated
                        </span>
                      </div>
                    ) : isEditingStock ? (
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-900 focus-within:border-indigo-500 rounded-xl px-3 py-1.5 h-9 w-full">
                        <input
                          type="number"
                          value={editingStockValue}
                          onChange={(e) => setEditingStockValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const mKey = `sms_last_stock_${id}_${selectedSize}_${stockYear}_${stockMonth}`;
                              localStorage.setItem(mKey, editingStockValue);
                              setLastClosingStock(editingStockValue);
                              setIsEditingStock(false);
                            }
                          }}
                          className="w-full bg-transparent text-slate-100 text-xs font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            const mKey = `sms_last_stock_${id}_${selectedSize}_${stockYear}_${stockMonth}`;
                            localStorage.setItem(mKey, editingStockValue);
                            setLastClosingStock(editingStockValue);
                            setIsEditingStock(false);
                          }}
                          className="text-emerald-400 hover:text-emerald-300 p-1 rounded transition-colors ml-auto flex items-center justify-center shrink-0"
                          title="Save starting balance"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 h-9 w-full justify-between">
                        <span className="text-xs font-bold text-slate-100">
                          {getAutoClosingStockForPrevMonth()}
                        </span>
                        <button
                          onClick={() => {
                            const val = getAutoClosingStockForPrevMonth();
                            setEditingStockValue(val === "-" ? "" : val);
                            setIsEditingStock(true);
                          }}
                          className="text-slate-400 hover:text-indigo-400 p-1 rounded transition-colors flex items-center justify-center shrink-0"
                          title="Edit starting balance (No logs found for this month)"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Column 3: Stock Range Filter */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Stock Range Filter (From / To)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={fromMonth}
                        onChange={(e) => setFromMonth(e.target.value)}
                        className="bg-slate-950 border border-slate-900 text-slate-100 rounded-xl px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors h-9 cursor-pointer w-full"
                        title="Stock From Month"
                      >
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>{m.substring(0, 3)}</option>
                        ))}
                      </select>
                      <select
                        value={fromYear}
                        onChange={(e) => setFromYear(e.target.value)}
                        className="bg-slate-950 border border-slate-900 text-slate-100 rounded-xl px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors h-9 cursor-pointer w-full"
                        title="Stock From Year"
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <span className="text-slate-500 text-xs font-medium px-0.5 shrink-0">to</span>
                      <select
                        value={toMonth}
                        onChange={(e) => setToMonth(e.target.value)}
                        className="bg-slate-950 border border-slate-900 text-slate-100 rounded-xl px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors h-9 cursor-pointer w-full"
                        title="Stock To Month"
                      >
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>{m.substring(0, 3)}</option>
                        ))}
                      </select>
                      <select
                        value={toYear}
                        onChange={(e) => setToYear(e.target.value)}
                        className="bg-slate-950 border border-slate-900 text-slate-100 rounded-xl px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors h-9 cursor-pointer w-full"
                        title="Stock To Year"
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Table Card */}
              <div className="bg-slate-900/10 border border-slate-900 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-slate-300">
                    Stock Ledger Sheet - {selectedSize}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 font-semibold">
                      {filteredStockEntries.length} Records
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/30 text-slate-400 uppercase tracking-widest text-[9px] font-bold border-b border-slate-900">
                        <th className="p-4">Date</th>
                        <th className="p-4">Party Name</th>
                        <th className="p-4">Bill No</th>
                        <th className="p-4">Batch No</th>
                        
                        {/* Dynamic Headers matching dispatch */}
                        {(id === "is13488" || id === "is12786") && (
                          <>
                            <th className="p-4 text-right">Production (Roll)</th>
                            <th className="p-4 text-right">Production (Mtr)</th>
                            <th className="p-4 text-right">Dispatch qty (Mtr)</th>
                            <th className="p-4 text-right">Closing Stock (Mtr)</th>
                          </>
                        )}
                        {(id === "is13487" || id === "is14483" || id === "is17425") && (
                          <>
                            <th className="p-4 text-right">Production (Nos)</th>
                            <th className="p-4 text-right">Dispatch qty (Nos)</th>
                            <th className="p-4 text-right">Closing Stock (Nos)</th>
                          </>
                        )}
                        {id === "is4985" && (
                          <>
                            <th className="p-4 text-right">Production (Pipe)</th>
                            <th className="p-4 text-right">Production (Mtr)</th>
                            <th className="p-4 text-right">Dispatch qty (Pipe)</th>
                            <th className="p-4 text-right">Dispatch qty (Mtr)</th>
                            <th className="p-4 text-right">Closing Stock (Pipe)</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {filteredStockEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-900/25 transition-colors">
                          <td className="p-4 text-slate-300 font-medium whitespace-nowrap">{formatDateToDMY(entry.date)}</td>
                          <td className="p-4 text-slate-400 whitespace-nowrap">{entry.partyName}</td>
                          <td className="p-4 text-slate-400 whitespace-nowrap">{entry.billNo}</td>
                          <td className="p-4 text-slate-400 whitespace-nowrap">{entry.batchNo}</td>

                          {/* Dynamic Cells */}
                          {(id === "is13488" || id === "is12786") && (
                            <>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.prodRoll}</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.prodMtr} m</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.dispMtr} m</td>
                              <td className={`p-4 text-right font-semibold whitespace-nowrap ${entry.closingStock >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{entry.closingStock} m</td>
                            </>
                          )}
                          {(id === "is13487" || id === "is14483" || id === "is17425") && (
                            <>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.prodNos}</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.dispNos}</td>
                              <td className={`p-4 text-right font-semibold whitespace-nowrap ${entry.closingStock >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{entry.closingStock}</td>
                            </>
                          )}
                          {id === "is4985" && (
                            <>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.prodPipe}</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.prodMtrPipe} m</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.dispPipe}</td>
                              <td className="p-4 text-right text-slate-200 whitespace-nowrap">{entry.dispMtrPipe} m</td>
                              <td className={`p-4 text-right font-semibold whitespace-nowrap ${entry.closingStock >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{entry.closingStock}</td>
                            </>
                          )}
                        </tr>
                      ))}
                      {filteredStockEntries.length === 0 && (
                        <tr>
                          <td 
                            colSpan={
                              id === "is13488" || id === "is12786" ? 8 :
                              id === "is4985" ? 9 :
                              id === "is13487" || id === "is14483" || id === "is17425" ? 7 : 7
                            } 
                            className="p-12 text-center text-slate-500 italic"
                          >
                            No ledger entries found for {selectedSize} in the selected range.
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {/* Summary row */}
                    {filteredStockEntries.length > 0 && (
                      <tfoot>
                        <tr className="bg-indigo-950/20 text-slate-200 font-bold border-t border-slate-900">
                          <td colSpan={4} className="p-4 text-slate-400 uppercase tracking-widest text-[9px]">Totals</td>
                                                  {(id === "is13488" || id === "is12786") && (
                            <>
                              <td className="p-4 text-right text-slate-100">{stockTotalProdRoll}</td>
                              <td className="p-4 text-right text-slate-100">{stockTotalProdMtr} m</td>
                              <td className="p-4 text-right text-slate-100">{stockTotalDispMtr} m</td>
                              <td className="p-4 text-right text-emerald-400">
                                {filteredStockEntries[filteredStockEntries.length - 1]?.closingStock || 0} m
                              </td>
                            </>
                          )}
                          {(id === "is13487" || id === "is14483" || id === "is17425") && (
                            <>
                              <td className="p-4 text-right text-slate-100">{stockTotalProdNos}</td>
                              <td className="p-4 text-right text-slate-100">{stockTotalDispNos}</td>
                              <td className="p-4 text-right text-emerald-400">
                                {filteredStockEntries[filteredStockEntries.length - 1]?.closingStock || 0}
                              </td>
                            </>
                          )}
                          {id === "is4985" && (
                            <>
                              <td className="p-4 text-right text-slate-100">{stockTotalProdPipe}</td>
                              <td className="p-4 text-right text-slate-100">{stockTotalProdMtrPipe} m</td>
                              <td className="p-4 text-right text-slate-100">{stockTotalDispPipe}</td>
                              <td className="p-4 text-right text-slate-100">{stockTotalDispMtrPipe} m</td>
                              <td className="p-4 text-right text-emerald-400">
                                {filteredStockEntries[filteredStockEntries.length - 1]?.closingStock || 0}
                              </td>
                            </>
                          )}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Fallback Dynamic Placeholder Card */
            <div className="flex-1 w-full bg-slate-900/10 border border-slate-900 rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.02),transparent_60%)] pointer-events-none" />

              {/* Animation set */}
              <div className="relative mb-6 flex items-center justify-center z-10">
                <div className="absolute inset-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl animate-pulse" />
                <div className="relative w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400">
                  <Boxes className="w-8 h-8 animate-pulse" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white">
                    <Hammer className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                </div>
              </div>

              {/* Content Details */}
              <div className="relative z-10 max-w-sm">
                <span className="text-[9px] px-2 py-0.5 rounded border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 font-bold uppercase tracking-wider">
                  {entryTypeLabel}
                </span>
                <h3 className="text-2xl font-extrabold tracking-tight mt-3 text-slate-100">
                  {selectedSize || "Selected Size"}
                </h3>
                <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">
                  Under Development
                </div>
                <p className="mt-4 text-slate-400 text-xs leading-relaxed">
                  Stock entry logs and quantity worksheets for standard <span className="text-slate-200 font-semibold">{currentStandard.name}</span> in size <span className="text-slate-200 font-semibold">{selectedSize}</span> are currently under active development.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Initial Stock Popup Modal */}
      {showInitStockModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative z-50">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Starting Stock Required
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                No historical log entries or saved starting stock were found for size <span className="text-indigo-300 font-bold">{selectedSize}</span> in <span className="text-indigo-400 font-semibold">{stockMonth} {stockYear}</span> (the period preceding your selected stock range).
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Please initialize the closing stock balance at the end of this preceding month to continue.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Last Closing Stock for {selectedSize} ({stockMonth} {stockYear})
              </label>
              <input
                type="number"
                value={initStockValue}
                onChange={(e) => setInitStockValue(e.target.value)}
                placeholder="Enter starting stock balance..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none transition-colors h-10"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowInitStockModal(false);
                  setDismissedInitModalFor({ size: selectedSize, month: stockMonth, year: stockYear });
                }}
                className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-slate-100 rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (initStockValue.trim() === "") return;
                  const mKey = `sms_last_stock_${id}_${selectedSize}_${stockYear}_${stockMonth}`;
                  localStorage.setItem(mKey, initStockValue);
                  setLastClosingStock(initStockValue);
                  setShowInitStockModal(false);
                }}
                disabled={initStockValue.trim() === ""}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Initialize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Ledger Modal */}
      {showExportLedgerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative z-50">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-400" />
                Select Sizes to Export
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Choose the sizes/classes you wish to include in the exported stock register report.
              </p>
            </div>

            {/* Select All / Deselect All */}
            <div className="flex items-center gap-4 text-[10px] uppercase font-bold text-indigo-400">
              <button 
                type="button" 
                onClick={() => setExportLedgerSelectedSizes(sizes)}
                className="hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-700">|</span>
              <button 
                type="button" 
                onClick={() => setExportLedgerSelectedSizes([])}
                className="hover:underline"
              >
                Deselect All
              </button>
            </div>

            {/* Sizes checklist */}
            <div className="max-h-48 overflow-y-auto space-y-2.5 bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
              {sizes.map((sz) => {
                const isChecked = exportLedgerSelectedSizes.includes(sz);
                return (
                  <label key={sz} className="flex items-center gap-3 cursor-pointer text-xs text-slate-300 hover:text-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setExportLedgerSelectedSizes(exportLedgerSelectedSizes.filter(s => s !== sz));
                        } else {
                          setExportLedgerSelectedSizes([...exportLedgerSelectedSizes, sz]);
                        }
                      }}
                      className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                    />
                    <span className="font-medium">{sz}</span>
                  </label>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowExportLedgerModal(false)}
                className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-slate-100 rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (exportLedgerSelectedSizes.length === 0) {
                    alert("Please select at least one size.");
                    return;
                  }
                  performExport(exportLedgerSelectedSizes, false, false, true);
                  setShowExportLedgerModal(false);
                }}
                disabled={exportLedgerSelectedSizes.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consignee Edit/Configure Details Modal */}
      {consigneeEditModal && consigneeEditModal.show && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-xl w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Users className="w-5 h-5 text-indigo-400" />
              Configure Details for {consigneeEditModal.consigneeName}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Address</label>
                <input
                  type="text"
                  value={consigneeEditModal.address}
                  onChange={(e) => setConsigneeEditModal({ ...consigneeEditModal, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">City</label>
                <input
                  type="text"
                  value={consigneeEditModal.city}
                  onChange={(e) => setConsigneeEditModal({ ...consigneeEditModal, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">District</label>
                <input
                  type="text"
                  value={consigneeEditModal.district}
                  onChange={(e) => setConsigneeEditModal({ ...consigneeEditModal, district: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">State</label>
                <input
                  type="text"
                  value={consigneeEditModal.state}
                  onChange={(e) => setConsigneeEditModal({ ...consigneeEditModal, state: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Country</label>
                <input
                  type="text"
                  value={consigneeEditModal.country}
                  onChange={(e) => setConsigneeEditModal({ ...consigneeEditModal, country: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pincode</label>
                <input
                  type="text"
                  value={consigneeEditModal.pincode}
                  onChange={(e) => setConsigneeEditModal({ ...consigneeEditModal, pincode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mobile</label>
                <input
                  type="text"
                  value={consigneeEditModal.mobile}
                  onChange={(e) => setConsigneeEditModal({ ...consigneeEditModal, mobile: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email ID</label>
                <input
                  type="email"
                  value={consigneeEditModal.email}
                  onChange={(e) => setConsigneeEditModal({ ...consigneeEditModal, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telephone</label>
                <input
                  type="text"
                  value={consigneeEditModal.telephone}
                  onChange={(e) => setConsigneeEditModal({ ...consigneeEditModal, telephone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button 
                variant="outline" 
                onClick={() => setConsigneeEditModal(null)}
                className="border-slate-800 text-slate-300 hover:bg-slate-850 h-9"
              >
                Cancel
              </Button>
              <button
                onClick={() => handleSaveConsigneeDetails({
                  name: consigneeEditModal.consigneeName,
                  address: consigneeEditModal.address,
                  city: consigneeEditModal.city,
                  district: consigneeEditModal.district,
                  state: consigneeEditModal.state,
                  country: consigneeEditModal.country,
                  pincode: consigneeEditModal.pincode,
                  telephone: consigneeEditModal.telephone,
                  mobile: consigneeEditModal.mobile,
                  email: consigneeEditModal.email
                })}
                className="px-5 h-9 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
