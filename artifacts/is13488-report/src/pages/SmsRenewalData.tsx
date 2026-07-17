import { useState, useEffect, useMemo } from "react";
import { 
  FileCheck, 
  Download, 
  Settings2, 
  Calendar, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  Search, 
  Table as TableIcon, 
  Sparkles, 
  Layers, 
  RefreshCw, 
  Save, 
  Info,
  HelpCircle,
  Droplet,
  Cpu,
  Workflow,
  Disc,
  Gauge,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as smsStorage from "@/lib/smsStorage";
import * as XLSX from "xlsx";
import XLSXStyle from "xlsx-js-style";
import { applyWorksheetTableStyle } from "@/lib/excelHelper";

interface LicenseRenewalInfo {
  cmlNumber: string;
  validFrom: string;
  validTo: string;
  status: "Active" | "Due Soon" | "Under Audit" | "Expired";
  testingAgency: string;
  remarks: string;
}

export const getRenewalPeriodBounds = (standardId: string, yearStr: string): { start: string; end: string } | null => {
  if (yearStr === "All" || !yearStr) return null;
  const match = yearStr.match(/^(\d{4})/);
  if (!match) return null;
  const startYr = parseInt(match[1], 10);
  const endYr = startYr + 1;

  switch (standardId) {
    case "is13488":
      return { start: `${startYr}-09-16`, end: `${endYr}-09-15` };
    case "is13487":
      return { start: `${startYr}-09-15`, end: `${endYr}-09-14` };
    case "is14483":
      return { start: `${startYr}-11-10`, end: `${endYr}-11-09` };
    case "is4985":
      return { start: `${startYr}-12-25`, end: `${endYr}-12-24` };
    case "is12786":
      return { start: `${startYr}-09-22`, end: `${endYr}-09-21` };
    case "is17425":
      return { start: `${startYr}-09-21`, end: `${endYr}-09-20` };
    default:
      return { start: `${startYr}-01-01`, end: `${endYr}-12-31` };
  }
};

const defaultLicenseInfo: Record<string, LicenseRenewalInfo> = {
  is13488: {
    cmlNumber: "CM/L-7800045123",
    validFrom: "2025-01-01",
    validTo: "2027-12-31",
    status: "Active",
    testingAgency: "BIS Ahmedabad Branch Office",
    remarks: "Emitting pipes in-line & online drip irrigation system verified."
  },
  is13487: {
    cmlNumber: "CM/L-7800045234",
    validFrom: "2025-04-01",
    validTo: "2027-03-31",
    status: "Active",
    testingAgency: "BIS Ahmedabad Branch Office",
    remarks: "Emitters for drip irrigation regular QC pass."
  },
  is12786: {
    cmlNumber: "CM/L-7800045345",
    validFrom: "2024-06-01",
    validTo: "2026-05-31",
    status: "Active",
    testingAgency: "BIS Ahmedabad Branch Office",
    remarks: "Polyethylene plain laterals Class-1 & Class-2 verified."
  },
  is4985: {
    cmlNumber: "CM/L-7800045456",
    validFrom: "2024-10-01",
    validTo: "2026-09-30",
    status: "Active",
    testingAgency: "BIS Ahmedabad Branch Office",
    remarks: "Unplasticized PVC pipes for water supplies conforming to IS 4985."
  },
  is17425: {
    cmlNumber: "CM/L-7800045567",
    validFrom: "2025-02-01",
    validTo: "2027-01-31",
    status: "Active",
    testingAgency: "BIS Ahmedabad Branch Office",
    remarks: "HDPE pipes for sprinkler irrigation system verified."
  },
  is14483: {
    cmlNumber: "CM/L-7800045678",
    validFrom: "2025-05-01",
    validTo: "2027-04-30",
    status: "Active",
    testingAgency: "BIS Ahmedabad Branch Office",
    remarks: "Venturi fertilizer injectors tested & compliant."
  }
};

const smsStandardsList = [
  { 
    id: "is13488", 
    code: "IS 13488", 
    title: "Emitting Pipe", 
    icon: Droplet,
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    glowGradient: "from-cyan-500/20 to-blue-500/10",
    iconBg: "bg-cyan-500/10 text-cyan-400",
    activeBorder: "border-cyan-500 shadow-cyan-500/20 ring-cyan-500/30",
    activeBg: "bg-cyan-950/40",
    accentBar: "bg-cyan-400"
  },
  { 
    id: "is13487", 
    code: "IS 13487", 
    title: "Emitters", 
    icon: Cpu,
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    glowGradient: "from-amber-500/20 to-orange-500/10",
    iconBg: "bg-amber-500/10 text-amber-400",
    activeBorder: "border-amber-500 shadow-amber-500/20 ring-amber-500/30",
    activeBg: "bg-amber-950/40",
    accentBar: "bg-amber-400"
  },
  { 
    id: "is12786", 
    code: "IS 12786", 
    title: "Plain Laterals", 
    icon: Workflow,
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    glowGradient: "from-purple-500/20 to-pink-500/10",
    iconBg: "bg-purple-500/10 text-purple-400",
    activeBorder: "border-purple-500 shadow-purple-500/20 ring-purple-500/30",
    activeBg: "bg-purple-950/40",
    accentBar: "bg-purple-400"
  },
  { 
    id: "is4985", 
    code: "IS 4985", 
    title: "uPVC Pipe", 
    icon: Disc,
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    glowGradient: "from-emerald-500/20 to-teal-500/10",
    iconBg: "bg-emerald-500/10 text-emerald-400",
    activeBorder: "border-emerald-500 shadow-emerald-500/20 ring-emerald-500/30",
    activeBg: "bg-emerald-950/40",
    accentBar: "bg-emerald-400"
  },
  { 
    id: "is17425", 
    code: "IS 17425", 
    title: "HDPE Pipe", 
    icon: Layers,
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    glowGradient: "from-blue-500/20 to-indigo-500/10",
    iconBg: "bg-blue-500/10 text-blue-400",
    activeBorder: "border-blue-500 shadow-blue-500/20 ring-blue-500/30",
    activeBg: "bg-blue-950/40",
    accentBar: "bg-blue-400"
  },
  { 
    id: "is14483", 
    code: "IS 14483", 
    title: "Venturi Injector", 
    icon: Gauge,
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    glowGradient: "from-rose-500/20 to-red-500/10",
    iconBg: "bg-rose-500/10 text-rose-400",
    activeBorder: "border-rose-500 shadow-rose-500/20 ring-rose-500/30",
    activeBg: "bg-rose-950/40",
    accentBar: "bg-rose-400"
  },
];

const standardSizes: Record<string, string[]> = {
  is13488: ["All Sizes", "12mm Cl-2", "16mm CL-1", "16mm Cl-2", "20mm Cl-1"],
  is13487: ["All Sizes", "4 LPH", "8 LPH", "14 LPH"],
  is12786: ["All Sizes", "12mm Cl-2", "16mm Cl-1", "16mm Cl-2", "20mm Cl-1", "20mm Cl-2", "32mm Cl-2"],
  is4985: ["All Sizes", "63mm Cl-2", "75mm Cl-2", "75mm Cl-3", "90mm Cl-2", "90mm Cl-3", "110mm Cl-2", "110mm Cl-3", "140mm Cl-2", "140mm Cl-3", "160mm Cl-2", "160mm Cl-3"],
  is17425: ["All Sizes", "75mm Cl-1", "75mm Cl-2", "90mm Cl-1"],
};

export interface ExportSizeOption {
  id: string;
  label: string;
  convKey?: string;
  defaultConv?: number;
  requireConv: boolean;
}

export const exportSizesConfig: Record<string, ExportSizeOption[]> = {
  is13488: [
    { id: "12mm_cl2", label: "12 MM(II) Mtr.", convKey: "sms_conv_weight_is13488_12mm Cl-2", defaultConv: 0.055, requireConv: true },
    { id: "16mm_cl2", label: "16 MM(II) Mtr.", convKey: "sms_conv_weight_is13488_16mm Cl-2", defaultConv: 0.082, requireConv: true },
    { id: "20mm_cl1", label: "20 MM(I) Mtr.", convKey: "sms_conv_weight_is13488_20mm Cl-1", defaultConv: 0.110, requireConv: true },
    { id: "16mm_cl1", label: "16 MM(I) Mtr.", convKey: "sms_conv_weight_is13488_16mm Cl-1", defaultConv: 0.068, requireConv: true },
  ],
  is12786: [
    { id: "12mm_cl2", label: "12 MM(II) Mtr.", convKey: "sms_conv_weight_is12786_12mm Cl-2", defaultConv: 0.045, requireConv: true },
    { id: "16mm_cl2", label: "16 MM(II) Mtr.", convKey: "sms_conv_weight_is12786_16mm Cl-2", defaultConv: 0.085, requireConv: true },
    { id: "32mm_cl2", label: "32 MM(II) Mtr.", convKey: "sms_conv_weight_is12786_32mm Cl-2", defaultConv: 0.180, requireConv: true },
    { id: "16mm_cl1", label: "16 MM(I) Mtr.", convKey: "sms_conv_weight_is12786_16mm Cl-1", defaultConv: 0.065, requireConv: true },
    { id: "20mm_cl1", label: "20 MM(I) Mtr.", convKey: "sms_conv_weight_is12786_20mm Cl-1", defaultConv: 0.095, requireConv: true },
    { id: "20mm_cl2", label: "20 MM(II) Mtr.", convKey: "sms_conv_weight_is12786_20mm Cl-2", defaultConv: 0.125, requireConv: true },
  ],
  is4985: [
    { id: "pipe_63mm_cl2", label: "63mm Cl-2 (Pipe)", convKey: "sms_conv_weight_is4985_63mm Cl-2", defaultConv: 2.9, requireConv: true },
    { id: "pipe_75mm_cl2", label: "75mm Cl-2 (Pipe)", convKey: "sms_conv_weight_is4985_75mm Cl-2", defaultConv: 3.9, requireConv: true },
    { id: "pipe_75mm_cl3", label: "75mm Cl-3 (Pipe)", convKey: "sms_conv_weight_is4985_75mm Cl-3", defaultConv: 4.8, requireConv: true },
    { id: "pipe_90mm_cl2", label: "90mm Cl-2 (Pipe)", convKey: "sms_conv_weight_is4985_90mm Cl-2", defaultConv: 5.5, requireConv: true },
    { id: "pipe_90mm_cl3", label: "90mm Cl-3 (Pipe)", convKey: "sms_conv_weight_is4985_90mm Cl-3", defaultConv: 6.9, requireConv: true },
    { id: "pipe_110mm_cl2", label: "110mm Cl-2 (Pipe)", convKey: "sms_conv_weight_is4985_110mm Cl-2", defaultConv: 7.8, requireConv: true },
    { id: "pipe_110mm_cl3", label: "110mm Cl-3 (Pipe)", convKey: "sms_conv_weight_is4985_110mm Cl-3", defaultConv: 10.2, requireConv: true },
    { id: "pipe_140mm_cl2", label: "140mm Cl-2 (Pipe)", convKey: "sms_conv_weight_is4985_140mm Cl-2", defaultConv: 13.0, requireConv: true },
    { id: "pipe_140mm_cl3", label: "140mm Cl-3 (Pipe)", convKey: "sms_conv_weight_is4985_140mm Cl-3", defaultConv: 18.7, requireConv: true },
    { id: "pipe_160mm_cl2", label: "160mm Cl-2 (Pipe)", convKey: "sms_conv_weight_is4985_160mm Cl-2", defaultConv: 17.0, requireConv: true },
    { id: "pipe_160mm_cl3", label: "160mm Cl-3 (Pipe)", convKey: "sms_conv_weight_is4985_160mm Cl-3", defaultConv: 21.0, requireConv: true },
  ],
  is17425: [
    { id: "prod_75mm_cl1", label: "75 MM(I) (Nos.)", requireConv: false },
    { id: "prod_75mm_cl2", label: "75 MM(II) (Nos.)", requireConv: false },
    { id: "prod_90mm_cl1", label: "90 MM(I) (Nos.)", requireConv: false },
  ],
  is13487: [
    { id: "prod_4lph", label: "4 LPH (Nos.)", requireConv: false },
    { id: "prod_8lph", label: "8 LPH (Nos.)", requireConv: false },
    { id: "prod_14lph", label: "14 LPH (Nos.)", requireConv: false },
    { id: "prod_16lph", label: "16 LPH (Nos.)", requireConv: false },
  ],
  is14483: [
    { id: "prod_2inch", label: "2\"(50MM) (Nos.)", requireConv: false },
    { id: "prod_1inch", label: "1\"(25MM) (Nos.)", requireConv: false },
  ]
};

interface IS13488MonthlyAuditRow {
  monthLabel: string;
  monthKey: string;
  mtr_12mm_cl2: number;
  mtr_16mm_cl2: number;
  mtr_20mm_cl1: number;
  mtr_16mm_cl1: number;
  total_mtr: number;
  kg_12mm_cl2: number;
  kg_16mm_cl2: number;
  kg_20mm_cl1: number;
  kg_16mm_cl1: number;
  total_kg: number;
  value: number;
}

interface IS12786MonthlyAuditRow {
  monthLabel: string;
  monthKey: string;
  mtr_12mm_cl2: number;
  mtr_16mm_cl2: number;
  mtr_32mm_cl2: number;
  mtr_16mm_cl1: number;
  mtr_20mm_cl1: number;
  mtr_20mm_cl2: number;
  total_mtr: number;
  kg_12mm_cl2: number;
  kg_16mm_cl2: number;
  kg_32mm_cl2: number;
  kg_16mm_cl1: number;
  kg_20mm_cl1: number;
  kg_20mm_cl2: number;
  total_kg: number;
  value: number;
}

interface IS17425MonthlyAuditRow {
  monthLabel: string;
  monthKey: string;
  prod_75mm_cl1: number;
  prod_75mm_cl2: number;
  prod_90mm_cl1: number;
  total_nos: number;
  value: number;
}

interface IS13487MonthlyAuditRow {
  monthLabel: string;
  monthKey: string;
  prod_4lph: number;
  prod_8lph: number;
  prod_14lph: number;
  prod_16lph: number;
  total_nos: number;
  unit_of_1000: number;
  value: number;
}

interface IS14483MonthlyAuditRow {
  monthLabel: string;
  monthKey: string;
  prod_2inch: number;
  prod_1inch: number;
  total_nos: number;
  value: number;
}

interface IS4985MonthlyAuditRow {
  srNo: number | string;
  monthLabel: string;
  monthKey: string;
  pipe_63mm_cl2: number;
  pipe_75mm_cl2: number;
  pipe_75mm_cl3: number;
  pipe_90mm_cl2: number;
  pipe_90mm_cl3: number;
  pipe_110mm_cl2: number;
  pipe_110mm_cl3: number;
  pipe_140mm_cl2: number;
  pipe_140mm_cl3: number;
  pipe_160mm_cl2: number;
  pipe_160mm_cl3: number;
  wt_63mm_cl2: number;
  wt_75mm_cl2: number;
  wt_75mm_cl3: number;
  wt_90mm_cl2: number;
  wt_90mm_cl3: number;
  wt_110mm_cl2: number;
  wt_110mm_cl3: number;
  wt_140mm_cl2: number;
  wt_140mm_cl3: number;
  wt_160mm_cl2: number;
  wt_160mm_cl3: number;
  total_wt: number;
  qty_tons: number;
  value: number;
  [key: string]: any;
}


const getMonthAbbr = (monthIdx: number): string => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
  return months[monthIdx] || "Jan";
};

const formatDateToDDMMYYYY = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes("-")) return "16/09/2024";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export default function SmsRenewalData() {
  const { toast } = useToast();
  const [selectedStandard, setSelectedStandard] = useState<string>("is13488");
  const [viewMode, setViewMode] = useState<"audit" | "detailed">("audit");
  const [selectedYear, setSelectedYear] = useState<string>("2026-27");
  const [selectedSize, setSelectedSize] = useState<string>("All Sizes");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [productionData, setProductionData] = useState<smsStorage.ProductionEntry[]>([]);
  const [licenseInfo, setLicenseInfo] = useState<LicenseRenewalInfo>(defaultLicenseInfo["is13488"]);
  const [isEditingLicense, setIsEditingLicense] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [wizardSelectedSizes, setWizardSelectedSizes] = useState<string[]>([]);
  const [inlineConversions, setInlineConversions] = useState<Record<string, string>>({});

  // Load production & license data whenever selected standard changes
  useEffect(() => {
    // Load production entries from local storage / cloud
    const prod = smsStorage.getLocalProduction(selectedStandard);
    setProductionData(prod);

    // Load license metadata (strict certificate validity period)
    const savedLicense = localStorage.getItem(`sms_license_info_${selectedStandard}`);
    let baseLicense = defaultLicenseInfo[selectedStandard] || defaultLicenseInfo["is13488"];
    if (savedLicense) {
      try {
        baseLicense = JSON.parse(savedLicense);
      } catch {
        baseLicense = defaultLicenseInfo[selectedStandard] || defaultLicenseInfo["is13488"];
      }
    }

    setLicenseInfo(baseLicense);
  }, [selectedStandard]);

  // Save updated license renewal info
  const handleSaveLicenseInfo = () => {
    localStorage.setItem(`sms_license_info_${selectedStandard}`, JSON.stringify(licenseInfo));
    setIsEditingLicense(false);
    toast({
      title: "Renewal Metadata Saved",
      description: `License details for ${selectedStandard.toUpperCase()} updated successfully.`
    });
  };

  // Renewal Production Audit Date Range (distinct from official certificate validity period)
  const currentRenewalPeriod = useMemo(() => {
    const bounds = getRenewalPeriodBounds(selectedStandard, selectedYear);
    if (bounds) return bounds;
    return { start: licenseInfo.validFrom, end: licenseInfo.validTo };
  }, [selectedStandard, selectedYear, licenseInfo.validFrom, licenseInfo.validTo]);

  // Filtered production data
  const filteredData = useMemo(() => {
    return productionData.filter(item => {
      // Date range check strictly based on selected Renewal Production Period
      if (selectedYear !== "All") {
        if (!item.date || item.date < currentRenewalPeriod.start || item.date > currentRenewalPeriod.end) {
          return false;
        }
      }
      // Size check
      if (selectedSize !== "All Sizes" && item.size !== selectedSize) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const dateMatch = item.date.toLowerCase().includes(q);
        const sizeMatch = item.size.toLowerCase().includes(q);
        return dateMatch || sizeMatch;
      }
      return true;
    });
  }, [productionData, selectedYear, selectedSize, searchQuery, currentRenewalPeriod.start, currentRenewalPeriod.end]);

  // Aggregated totals
  const totals = useMemo(() => {
    let totalQty = 0;
    let totalWeightKg = 0;
    let totalValue = 0;

    filteredData.forEach(item => {
      const q = item.mtr || item.nos || item.pipe || item.coils || item.thousandUnit || 0;
      totalQty += q;
      if (item.kg) {
        totalWeightKg += item.kg;
      } else if (item.tonn) {
        totalWeightKg += item.tonn * 1000;
      } else {
        // approximate fallback weight calculation based on value / quantity if needed
        totalWeightKg += q * 0.15;
      }
      totalValue += item.value || 0;
    });

    return { totalQty, totalWeightKg, totalValue, count: filteredData.length };
  }, [filteredData]);

  // IS 13488 Monthly Audit Data Aggregation across exact License Validity Period
  const is13488AuditData = useMemo(() => {
    if (selectedStandard !== "is13488") return { rows: [], summary: null, fullLastMonth: null, conversions: null };

    const startStr = currentRenewalPeriod.start || "2024-09-16";
    const endStr = currentRenewalPeriod.end || "2025-09-15";

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { rows: [], summary: null, fullLastMonth: null, conversions: null };
    }

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const startDay = startDate.getDate();

    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();
    const endDay = endDate.getDate();

    const rowsMap = new Map<string, IS13488MonthlyAuditRow>();
    const rowsList: IS13488MonthlyAuditRow[] = [];

    let currYear = startYear;
    let currMonth = startMonth;

    while (currYear < endYear || (currYear === endYear && currMonth <= endMonth)) {
      const monthKey = `${currYear}-${String(currMonth + 1).padStart(2, "0")}`;
      const isStart = currYear === startYear && currMonth === startMonth;
      const isEnd = currYear === endYear && currMonth === endMonth;

      let monthLabel = `${getMonthAbbr(currMonth)}-${String(currYear).slice(-2)}`;
      if (isStart && startStr.includes("-")) {
        const parts = startStr.split("-");
        monthLabel = `From ${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (isEnd && endStr.includes("-")) {
        const parts = endStr.split("-");
        monthLabel = `Up to ${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      const rowObj: IS13488MonthlyAuditRow = {
        monthLabel,
        monthKey,
        mtr_12mm_cl2: 0,
        mtr_16mm_cl2: 0,
        mtr_20mm_cl1: 0,
        mtr_16mm_cl1: 0,
        total_mtr: 0,
        kg_12mm_cl2: 0,
        kg_16mm_cl2: 0,
        kg_20mm_cl1: 0,
        kg_16mm_cl1: 0,
        total_kg: 0,
        value: 0,
      };

      rowsMap.set(monthKey, rowObj);
      rowsList.push(rowObj);

      currMonth++;
      if (currMonth > 11) {
        currMonth = 0;
        currYear++;
      }
    }

    productionData.forEach(item => {
      if (!item.date || item.date < startStr || item.date > endStr) return;
      const mKey = item.date.slice(0, 7);
      const row = rowsMap.get(mKey);
      if (!row) return;

      const sz = (item.size || "").toLowerCase();
      const mtr = item.mtr || 0;
      const kg = item.kg || (item.tonn ? item.tonn * 1000 : 0);

      if (sz.includes("12mm") && (sz.includes("cl-2") || sz.includes("(ii)"))) {
        row.mtr_12mm_cl2 += mtr;
        row.kg_12mm_cl2 += kg || mtr * 0.055;
      } else if (sz.includes("16mm") && (sz.includes("cl-2") || sz.includes("(ii)"))) {
        row.mtr_16mm_cl2 += mtr;
        row.kg_16mm_cl2 += kg || mtr * 0.082;
      } else if (sz.includes("20mm") && (sz.includes("cl-1") || sz.includes("(i)"))) {
        row.mtr_20mm_cl1 += mtr;
        row.kg_20mm_cl1 += kg || mtr * 0.110;
      } else if (sz.includes("16mm") && (sz.includes("cl-1") || sz.includes("(i)"))) {
        row.mtr_16mm_cl1 += mtr;
        row.kg_16mm_cl1 += kg || mtr * 0.068;
      } else {
        if (sz.includes("12mm")) {
          row.mtr_12mm_cl2 += mtr;
          row.kg_12mm_cl2 += kg || mtr * 0.055;
        } else if (sz.includes("20mm")) {
          row.mtr_20mm_cl1 += mtr;
          row.kg_20mm_cl1 += kg || mtr * 0.110;
        } else if (sz.includes("16mm")) {
          row.mtr_16mm_cl2 += mtr;
          row.kg_16mm_cl2 += kg || mtr * 0.082;
        }
      }

      row.value += item.value || 0;
    });

    const summary: IS13488MonthlyAuditRow = {
      monthLabel: "TOTAL",
      monthKey: "TOTAL",
      mtr_12mm_cl2: 0,
      mtr_16mm_cl2: 0,
      mtr_20mm_cl1: 0,
      mtr_16mm_cl1: 0,
      total_mtr: 0,
      kg_12mm_cl2: 0,
      kg_16mm_cl2: 0,
      kg_20mm_cl1: 0,
      kg_16mm_cl1: 0,
      total_kg: 0,
      value: 0,
    };

    rowsList.forEach(row => {
      row.total_mtr = row.mtr_12mm_cl2 + row.mtr_16mm_cl2 + row.mtr_20mm_cl1 + row.mtr_16mm_cl1;
      row.total_kg = row.kg_12mm_cl2 + row.kg_16mm_cl2 + row.kg_20mm_cl1 + row.kg_16mm_cl1;

      summary.mtr_12mm_cl2 += row.mtr_12mm_cl2;
      summary.mtr_16mm_cl2 += row.mtr_16mm_cl2;
      summary.mtr_20mm_cl1 += row.mtr_20mm_cl1;
      summary.mtr_16mm_cl1 += row.mtr_16mm_cl1;
      summary.total_mtr += row.total_mtr;

      summary.kg_12mm_cl2 += row.kg_12mm_cl2;
      summary.kg_16mm_cl2 += row.kg_16mm_cl2;
      summary.kg_20mm_cl1 += row.kg_20mm_cl1;
      summary.kg_16mm_cl1 += row.kg_16mm_cl1;
      summary.total_kg += row.total_kg;

      summary.value += row.value;
    });

    const endMonthKey = `${endYear}-${String(endMonth + 1).padStart(2, "0")}`;
    const fullLastMonth: IS13488MonthlyAuditRow = {
      monthLabel: `${getMonthAbbr(endMonth)}-${String(endYear).slice(-2)}`,
      monthKey: endMonthKey,
      mtr_12mm_cl2: 0,
      mtr_16mm_cl2: 0,
      mtr_20mm_cl1: 0,
      mtr_16mm_cl1: 0,
      total_mtr: 0,
      kg_12mm_cl2: 0,
      kg_16mm_cl2: 0,
      kg_20mm_cl1: 0,
      kg_16mm_cl1: 0,
      total_kg: 0,
      value: 0,
    };

    productionData.forEach(item => {
      if (!item.date || !item.date.startsWith(endMonthKey)) return;
      const sz = (item.size || "").toLowerCase();
      const mtr = item.mtr || 0;
      const kg = item.kg || (item.tonn ? item.tonn * 1000 : 0);

      if (sz.includes("12mm") && (sz.includes("cl-2") || sz.includes("(ii)"))) {
        fullLastMonth.mtr_12mm_cl2 += mtr;
        fullLastMonth.kg_12mm_cl2 += kg || mtr * 0.055;
      } else if (sz.includes("16mm") && (sz.includes("cl-2") || sz.includes("(ii)"))) {
        fullLastMonth.mtr_16mm_cl2 += mtr;
        fullLastMonth.kg_16mm_cl2 += kg || mtr * 0.082;
      } else if (sz.includes("20mm") && (sz.includes("cl-1") || sz.includes("(i)"))) {
        fullLastMonth.mtr_20mm_cl1 += mtr;
        fullLastMonth.kg_20mm_cl1 += kg || mtr * 0.110;
      } else if (sz.includes("16mm") && (sz.includes("cl-1") || sz.includes("(i)"))) {
        fullLastMonth.mtr_16mm_cl1 += mtr;
        fullLastMonth.kg_16mm_cl1 += kg || mtr * 0.068;
      } else {
        if (sz.includes("12mm")) {
          fullLastMonth.mtr_12mm_cl2 += mtr;
          fullLastMonth.kg_12mm_cl2 += kg || mtr * 0.055;
        } else if (sz.includes("20mm")) {
          fullLastMonth.mtr_20mm_cl1 += mtr;
          fullLastMonth.kg_20mm_cl1 += kg || mtr * 0.110;
        } else if (sz.includes("16mm")) {
          fullLastMonth.mtr_16mm_cl2 += mtr;
          fullLastMonth.kg_16mm_cl2 += kg || mtr * 0.082;
        }
      }
      fullLastMonth.value += item.value || 0;
    });

    fullLastMonth.total_mtr = fullLastMonth.mtr_12mm_cl2 + fullLastMonth.mtr_16mm_cl2 + fullLastMonth.mtr_20mm_cl1 + fullLastMonth.mtr_16mm_cl1;
    fullLastMonth.total_kg = fullLastMonth.kg_12mm_cl2 + fullLastMonth.kg_16mm_cl2 + fullLastMonth.kg_20mm_cl1 + fullLastMonth.kg_16mm_cl1;

    const conv12_cl2 = Number(localStorage.getItem("sms_conv_weight_is13488_12mm Cl-2") || 0.055);
    const conv16_cl2 = Number(localStorage.getItem("sms_conv_weight_is13488_16mm Cl-2") || 0.082);
    const conv20_cl1 = Number(localStorage.getItem("sms_conv_weight_is13488_20mm Cl-1") || 0.110);
    const conv16_cl1 = Number(localStorage.getItem("sms_conv_weight_is13488_16mm Cl-1") || 0.068);

    const conversions: IS13488MonthlyAuditRow = {
      monthLabel: "CONVERSIONS (KG/MTR)",
      monthKey: "CONVERSIONS",
      mtr_12mm_cl2: conv12_cl2,
      mtr_16mm_cl2: conv16_cl2,
      mtr_20mm_cl1: conv20_cl1,
      mtr_16mm_cl1: conv16_cl1,
      total_mtr: 0,
      kg_12mm_cl2: conv12_cl2,
      kg_16mm_cl2: conv16_cl2,
      kg_20mm_cl1: conv20_cl1,
      kg_16mm_cl1: conv16_cl1,
      total_kg: 0,
      value: 0
    };

    return { rows: rowsList, summary, fullLastMonth, conversions };
  }, [selectedStandard, currentRenewalPeriod.start, currentRenewalPeriod.end, productionData]);

  // IS 12786 Monthly Audit Data Aggregation
  const is12786AuditData = useMemo(() => {
    if (selectedStandard !== "is12786") return { rows: [], summary: null, fullLastMonth: null, conversions: null };

    const startStr = currentRenewalPeriod.start || "2024-09-22";
    const endStr = currentRenewalPeriod.end || "2025-09-21";
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return { rows: [], summary: null, fullLastMonth: null, conversions: null };

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();

    const rowsMap = new Map<string, IS12786MonthlyAuditRow>();
    const rowsList: IS12786MonthlyAuditRow[] = [];

    let currYear = startYear;
    let currMonth = startMonth;

    while (currYear < endYear || (currYear === endYear && currMonth <= endMonth)) {
      const monthKey = `${currYear}-${String(currMonth + 1).padStart(2, "0")}`;
      const isStart = currYear === startYear && currMonth === startMonth;
      const isEnd = currYear === endYear && currMonth === endMonth;

      let monthLabel = `${getMonthAbbr(currMonth)}-${String(currYear).slice(-2)}`;
      if (isStart && startStr.includes("-")) {
        const parts = startStr.split("-");
        monthLabel = `From ${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (isEnd && endStr.includes("-")) {
        const parts = endStr.split("-");
        monthLabel = `Up to ${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      const rowObj: IS12786MonthlyAuditRow = {
        monthLabel,
        monthKey,
        mtr_12mm_cl2: 0,
        mtr_16mm_cl2: 0,
        mtr_32mm_cl2: 0,
        mtr_16mm_cl1: 0,
        mtr_20mm_cl1: 0,
        mtr_20mm_cl2: 0,
        total_mtr: 0,
        kg_12mm_cl2: 0,
        kg_16mm_cl2: 0,
        kg_32mm_cl2: 0,
        kg_16mm_cl1: 0,
        kg_20mm_cl1: 0,
        kg_20mm_cl2: 0,
        total_kg: 0,
        value: 0
      };
      rowsMap.set(monthKey, rowObj);
      rowsList.push(rowObj);

      currMonth++;
      if (currMonth > 11) {
        currMonth = 0;
        currYear++;
      }
    }

    productionData.forEach(item => {
      if (!item.date || item.date < startStr || item.date > endStr) return;
      const mKey = item.date.slice(0, 7);
      const row = rowsMap.get(mKey);
      if (!row) return;

      const sz = (item.size || "").toLowerCase();
      const mtr = item.mtr || item.coils || 0;
      const kg = item.kg || (item.tonn ? item.tonn * 1000 : 0);

      if (sz.includes("12mm")) {
        row.mtr_12mm_cl2 += mtr;
        row.kg_12mm_cl2 += kg || mtr * 0.045;
      } else if (sz.includes("32mm")) {
        row.mtr_32mm_cl2 += mtr;
        row.kg_32mm_cl2 += kg || mtr * 0.180;
      } else if (sz.includes("16mm")) {
        if (sz.includes("cl-1") || sz.includes("(i)")) {
          row.mtr_16mm_cl1 += mtr;
          row.kg_16mm_cl1 += kg || mtr * 0.065;
        } else {
          row.mtr_16mm_cl2 += mtr;
          row.kg_16mm_cl2 += kg || mtr * 0.085;
        }
      } else if (sz.includes("20mm")) {
        if (sz.includes("cl-2") || sz.includes("(ii)")) {
          row.mtr_20mm_cl2 += mtr;
          row.kg_20mm_cl2 += kg || mtr * 0.125;
        } else {
          row.mtr_20mm_cl1 += mtr;
          row.kg_20mm_cl1 += kg || mtr * 0.095;
        }
      } else {
        row.mtr_20mm_cl1 += mtr;
        row.kg_20mm_cl1 += kg || mtr * 0.095;
      }
      row.value += item.value || 0;
    });

    const summary: IS12786MonthlyAuditRow = {
      monthLabel: "Total",
      monthKey: "TOTAL",
      mtr_12mm_cl2: 0,
      mtr_16mm_cl2: 0,
      mtr_32mm_cl2: 0,
      mtr_16mm_cl1: 0,
      mtr_20mm_cl1: 0,
      mtr_20mm_cl2: 0,
      total_mtr: 0,
      kg_12mm_cl2: 0,
      kg_16mm_cl2: 0,
      kg_32mm_cl2: 0,
      kg_16mm_cl1: 0,
      kg_20mm_cl1: 0,
      kg_20mm_cl2: 0,
      total_kg: 0,
      value: 0
    };

    rowsList.forEach(row => {
      row.total_mtr = row.mtr_12mm_cl2 + row.mtr_16mm_cl2 + row.mtr_32mm_cl2 + row.mtr_16mm_cl1 + row.mtr_20mm_cl1 + row.mtr_20mm_cl2;
      row.total_kg = row.kg_12mm_cl2 + row.kg_16mm_cl2 + row.kg_32mm_cl2 + row.kg_16mm_cl1 + row.kg_20mm_cl1 + row.kg_20mm_cl2;

      summary.mtr_12mm_cl2 += row.mtr_12mm_cl2;
      summary.mtr_16mm_cl2 += row.mtr_16mm_cl2;
      summary.mtr_32mm_cl2 += row.mtr_32mm_cl2;
      summary.mtr_16mm_cl1 += row.mtr_16mm_cl1;
      summary.mtr_20mm_cl1 += row.mtr_20mm_cl1;
      summary.mtr_20mm_cl2 += row.mtr_20mm_cl2;
      summary.total_mtr += row.total_mtr;

      summary.kg_12mm_cl2 += row.kg_12mm_cl2;
      summary.kg_16mm_cl2 += row.kg_16mm_cl2;
      summary.kg_32mm_cl2 += row.kg_32mm_cl2;
      summary.kg_16mm_cl1 += row.kg_16mm_cl1;
      summary.kg_20mm_cl1 += row.kg_20mm_cl1;
      summary.kg_20mm_cl2 += row.kg_20mm_cl2;
      summary.total_kg += row.total_kg;
      summary.value += row.value;
    });

    const endMonthKey = `${endYear}-${String(endMonth + 1).padStart(2, "0")}`;
    const fullLastMonth: IS12786MonthlyAuditRow = {
      monthLabel: `${getMonthAbbr(endMonth)}-${String(endYear).slice(-2)}`,
      monthKey: endMonthKey,
      mtr_12mm_cl2: 0,
      mtr_16mm_cl2: 0,
      mtr_32mm_cl2: 0,
      mtr_16mm_cl1: 0,
      mtr_20mm_cl1: 0,
      mtr_20mm_cl2: 0,
      total_mtr: 0,
      kg_12mm_cl2: 0,
      kg_16mm_cl2: 0,
      kg_32mm_cl2: 0,
      kg_16mm_cl1: 0,
      kg_20mm_cl1: 0,
      kg_20mm_cl2: 0,
      total_kg: 0,
      value: 0
    };

    productionData.forEach(item => {
      if (!item.date || !item.date.startsWith(endMonthKey)) return;
      const sz = (item.size || "").toLowerCase();
      const mtr = item.mtr || item.coils || 0;
      const kg = item.kg || (item.tonn ? item.tonn * 1000 : 0);

      if (sz.includes("12mm")) {
        fullLastMonth.mtr_12mm_cl2 += mtr;
        fullLastMonth.kg_12mm_cl2 += kg || mtr * 0.045;
      } else if (sz.includes("32mm")) {
        fullLastMonth.mtr_32mm_cl2 += mtr;
        fullLastMonth.kg_32mm_cl2 += kg || mtr * 0.180;
      } else if (sz.includes("16mm")) {
        if (sz.includes("cl-1") || sz.includes("(i)")) {
          fullLastMonth.mtr_16mm_cl1 += mtr;
          fullLastMonth.kg_16mm_cl1 += kg || mtr * 0.065;
        } else {
          fullLastMonth.mtr_16mm_cl2 += mtr;
          fullLastMonth.kg_16mm_cl2 += kg || mtr * 0.085;
        }
      } else if (sz.includes("20mm")) {
        if (sz.includes("cl-2") || sz.includes("(ii)")) {
          fullLastMonth.mtr_20mm_cl2 += mtr;
          fullLastMonth.kg_20mm_cl2 += kg || mtr * 0.125;
        } else {
          fullLastMonth.mtr_20mm_cl1 += mtr;
          fullLastMonth.kg_20mm_cl1 += kg || mtr * 0.095;
        }
      } else {
        fullLastMonth.mtr_20mm_cl1 += mtr;
        fullLastMonth.kg_20mm_cl1 += kg || mtr * 0.095;
      }
      fullLastMonth.value += item.value || 0;
    });

    fullLastMonth.total_mtr = fullLastMonth.mtr_12mm_cl2 + fullLastMonth.mtr_16mm_cl2 + fullLastMonth.mtr_32mm_cl2 + fullLastMonth.mtr_16mm_cl1 + fullLastMonth.mtr_20mm_cl1 + fullLastMonth.mtr_20mm_cl2;
    fullLastMonth.total_kg = fullLastMonth.kg_12mm_cl2 + fullLastMonth.kg_16mm_cl2 + fullLastMonth.kg_32mm_cl2 + fullLastMonth.kg_16mm_cl1 + fullLastMonth.kg_20mm_cl1 + fullLastMonth.kg_20mm_cl2;

    const conv12_cl2 = Number(localStorage.getItem("sms_conv_weight_is12786_12mm Cl-2") || 0.045);
    const conv16_cl2 = Number(localStorage.getItem("sms_conv_weight_is12786_16mm Cl-2") || 0.085);
    const conv32_cl2 = Number(localStorage.getItem("sms_conv_weight_is12786_32mm Cl-2") || 0.180);
    const conv16_cl1 = Number(localStorage.getItem("sms_conv_weight_is12786_16mm Cl-1") || 0.065);
    const conv20_cl1 = Number(localStorage.getItem("sms_conv_weight_is12786_20mm Cl-1") || 0.095);
    const conv20_cl2 = Number(localStorage.getItem("sms_conv_weight_is12786_20mm Cl-2") || 0.125);

    const conversions: IS12786MonthlyAuditRow = {
      monthLabel: "CONVERSIONS (KG/MTR)",
      monthKey: "CONVERSIONS",
      mtr_12mm_cl2: conv12_cl2,
      mtr_16mm_cl2: conv16_cl2,
      mtr_32mm_cl2: conv32_cl2,
      mtr_16mm_cl1: conv16_cl1,
      mtr_20mm_cl1: conv20_cl1,
      mtr_20mm_cl2: conv20_cl2,
      total_mtr: 0,
      kg_12mm_cl2: conv12_cl2,
      kg_16mm_cl2: conv16_cl2,
      kg_32mm_cl2: conv32_cl2,
      kg_16mm_cl1: conv16_cl1,
      kg_20mm_cl1: conv20_cl1,
      kg_20mm_cl2: conv20_cl2,
      total_kg: 0,
      value: 0
    };

    return { rows: rowsList, summary, fullLastMonth, conversions };
  }, [selectedStandard, currentRenewalPeriod.start, currentRenewalPeriod.end, productionData]);

  // IS 17425 Monthly Audit Data Aggregation
  const is17425AuditData = useMemo(() => {
    if (selectedStandard !== "is17425") return { rows: [], summary: null, fullLastMonth: null, conversions: null };

    const startStr = currentRenewalPeriod.start || "2024-09-21";
    const endStr = currentRenewalPeriod.end || "2025-09-20";
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return { rows: [], summary: null, fullLastMonth: null, conversions: null };

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();

    const rowsMap = new Map<string, IS17425MonthlyAuditRow>();
    const rowsList: IS17425MonthlyAuditRow[] = [];

    let currYear = startYear;
    let currMonth = startMonth;

    while (currYear < endYear || (currYear === endYear && currMonth <= endMonth)) {
      const monthKey = `${currYear}-${String(currMonth + 1).padStart(2, "0")}`;
      const isStart = currYear === startYear && currMonth === startMonth;
      const isEnd = currYear === endYear && currMonth === endMonth;

      let monthLabel = `${getMonthAbbr(currMonth)}-${String(currYear).slice(-2)}`;
      if (isStart && startStr.includes("-")) {
        const parts = startStr.split("-");
        monthLabel = `From ${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (isEnd && endStr.includes("-")) {
        const parts = endStr.split("-");
        monthLabel = `Up to ${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      const rowObj: IS17425MonthlyAuditRow = {
        monthLabel,
        monthKey,
        prod_75mm_cl1: 0,
        prod_75mm_cl2: 0,
        prod_90mm_cl1: 0,
        total_prod: 0,
        value: 0
      };
      rowsMap.set(monthKey, rowObj);
      rowsList.push(rowObj);

      currMonth++;
      if (currMonth > 11) {
        currMonth = 0;
        currYear++;
      }
    }

    productionData.forEach(item => {
      if (!item.date || item.date < startStr || item.date > endStr) return;
      const mKey = item.date.slice(0, 7);
      const row = rowsMap.get(mKey);
      if (!row) return;

      const sz = (item.size || "").toLowerCase();
      const qty = item.nos || item.pipe || item.mtr || 0;

      if (sz.includes("75mm") && (sz.includes("cl-2") || sz.includes("(ii)"))) {
        row.prod_75mm_cl2 += qty;
      } else if (sz.includes("90mm")) {
        row.prod_90mm_cl1 += qty;
      } else {
        row.prod_75mm_cl1 += qty;
      }
      row.value += item.value || 0;
    });

    const summary: IS17425MonthlyAuditRow = {
      monthLabel: "TOTAL",
      monthKey: "TOTAL",
      prod_75mm_cl1: 0,
      prod_75mm_cl2: 0,
      prod_90mm_cl1: 0,
      total_prod: 0,
      value: 0
    };

    rowsList.forEach(row => {
      row.total_prod = row.prod_75mm_cl1 + row.prod_75mm_cl2 + row.prod_90mm_cl1;
      summary.prod_75mm_cl1 += row.prod_75mm_cl1;
      summary.prod_75mm_cl2 += row.prod_75mm_cl2;
      summary.prod_90mm_cl1 += row.prod_90mm_cl1;
      summary.total_prod += row.total_prod;
      summary.value += row.value;
    });

    const endMonthKey = `${endYear}-${String(endMonth + 1).padStart(2, "0")}`;
    const fullLastMonth: IS17425MonthlyAuditRow = {
      monthLabel: `${getMonthAbbr(endMonth)}-${String(endYear).slice(-2)}`,
      monthKey: endMonthKey,
      prod_75mm_cl1: 0,
      prod_75mm_cl2: 0,
      prod_90mm_cl1: 0,
      total_prod: 0,
      value: 0
    };

    productionData.forEach(item => {
      if (!item.date || !item.date.startsWith(endMonthKey)) return;
      const sz = (item.size || "").toLowerCase();
      const qty = item.nos || item.pipe || item.mtr || 0;

      if (sz.includes("75mm") && (sz.includes("cl-2") || sz.includes("(ii)"))) {
        fullLastMonth.prod_75mm_cl2 += qty;
      } else if (sz.includes("90mm")) {
        fullLastMonth.prod_90mm_cl1 += qty;
      } else {
        fullLastMonth.prod_75mm_cl1 += qty;
      }
      fullLastMonth.value += item.value || 0;
    });
    fullLastMonth.total_prod = fullLastMonth.prod_75mm_cl1 + fullLastMonth.prod_75mm_cl2 + fullLastMonth.prod_90mm_cl1;

    return { rows: rowsList, summary, fullLastMonth, conversions: null };
  }, [selectedStandard, currentRenewalPeriod.start, currentRenewalPeriod.end, productionData]);

  // IS 13487 Monthly Audit Data Aggregation
  const is13487AuditData = useMemo(() => {
    if (selectedStandard !== "is13487") return { rows: [], summary: null, fullLastMonth: null, conversions: null };

    const startStr = currentRenewalPeriod.start || "2024-09-15";
    const endStr = currentRenewalPeriod.end || "2025-09-14";
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return { rows: [], summary: null, fullLastMonth: null, conversions: null };

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();

    const rowsMap = new Map<string, IS13487MonthlyAuditRow>();
    const rowsList: IS13487MonthlyAuditRow[] = [];

    let currYear = startYear;
    let currMonth = startMonth;

    while (currYear < endYear || (currYear === endYear && currMonth <= endMonth)) {
      const monthKey = `${currYear}-${String(currMonth + 1).padStart(2, "0")}`;
      const isStart = currYear === startYear && currMonth === startMonth;
      const isEnd = currYear === endYear && currMonth === endMonth;

      let monthLabel = `${getMonthAbbr(currMonth)}-${String(currYear).slice(-2)}`;
      if (isStart && startStr.includes("-")) {
        const parts = startStr.split("-");
        monthLabel = `From ${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (isEnd && endStr.includes("-")) {
        const parts = endStr.split("-");
        monthLabel = `Up to ${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      const rowObj: IS13487MonthlyAuditRow = {
        monthLabel,
        monthKey,
        prod_4lph: 0,
        prod_8lph: 0,
        prod_14lph: 0,
        prod_16lph: 0,
        total_prod: 0,
        unit_of_1000: 0,
        value: 0
      };
      rowsMap.set(monthKey, rowObj);
      rowsList.push(rowObj);

      currMonth++;
      if (currMonth > 11) {
        currMonth = 0;
        currYear++;
      }
    }

    productionData.forEach(item => {
      if (!item.date || item.date < startStr || item.date > endStr) return;
      const mKey = item.date.slice(0, 7);
      const row = rowsMap.get(mKey);
      if (!row) return;

      const sz = (item.size || "").toLowerCase();
      const qty = item.nos || item.thousandUnit || item.mtr || 0;

      if (sz.includes("8 lph") || sz.includes("8lph")) {
        row.prod_8lph += qty;
      } else if (sz.includes("14 lph") || sz.includes("14lph")) {
        row.prod_14lph += qty;
      } else if (sz.includes("16 lph") || sz.includes("16lph")) {
        row.prod_16lph += qty;
      } else {
        row.prod_4lph += qty;
      }
      row.value += item.value || 0;
    });

    const summary: IS13487MonthlyAuditRow = {
      monthLabel: "TOTAL",
      monthKey: "TOTAL",
      prod_4lph: 0,
      prod_8lph: 0,
      prod_14lph: 0,
      prod_16lph: 0,
      total_prod: 0,
      unit_of_1000: 0,
      value: 0
    };

    rowsList.forEach(row => {
      row.total_prod = row.prod_4lph + row.prod_8lph + row.prod_14lph + row.prod_16lph;
      row.unit_of_1000 = Math.round(row.total_prod / 1000);

      summary.prod_4lph += row.prod_4lph;
      summary.prod_8lph += row.prod_8lph;
      summary.prod_14lph += row.prod_14lph;
      summary.prod_16lph += row.prod_16lph;
      summary.total_prod += row.total_prod;
      summary.value += row.value;
    });
    summary.unit_of_1000 = Math.round(summary.total_prod / 1000);

    const endMonthKey = `${endYear}-${String(endMonth + 1).padStart(2, "0")}`;
    const fullLastMonth: IS13487MonthlyAuditRow = {
      monthLabel: `${getMonthAbbr(endMonth)}-${String(endYear).slice(-2)}`,
      monthKey: endMonthKey,
      prod_4lph: 0,
      prod_8lph: 0,
      prod_14lph: 0,
      prod_16lph: 0,
      total_prod: 0,
      unit_of_1000: 0,
      value: 0
    };

    productionData.forEach(item => {
      if (!item.date || !item.date.startsWith(endMonthKey)) return;
      const sz = (item.size || "").toLowerCase();
      const qty = item.nos || item.thousandUnit || item.mtr || 0;

      if (sz.includes("8 lph") || sz.includes("8lph")) {
        fullLastMonth.prod_8lph += qty;
      } else if (sz.includes("14 lph") || sz.includes("14lph")) {
        fullLastMonth.prod_14lph += qty;
      } else if (sz.includes("16 lph") || sz.includes("16lph")) {
        fullLastMonth.prod_16lph += qty;
      } else {
        fullLastMonth.prod_4lph += qty;
      }
      fullLastMonth.value += item.value || 0;
    });
    fullLastMonth.total_prod = fullLastMonth.prod_4lph + fullLastMonth.prod_8lph + fullLastMonth.prod_14lph + fullLastMonth.prod_16lph;
    fullLastMonth.unit_of_1000 = Math.round(fullLastMonth.total_prod / 1000);

    return { rows: rowsList, summary, fullLastMonth, conversions: null };
  }, [selectedStandard, currentRenewalPeriod.start, currentRenewalPeriod.end, productionData]);

  // IS 14483 Monthly Audit Data Aggregation
  const is14483AuditData = useMemo(() => {
    if (selectedStandard !== "is14483") return { rows: [], summary: null, fullLastMonth: null, conversions: null };

    const startStr = currentRenewalPeriod.start || "2024-11-10";
    const endStr = currentRenewalPeriod.end || "2025-11-09";
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return { rows: [], summary: null, fullLastMonth: null, conversions: null };

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();

    const rowsMap = new Map<string, IS14483MonthlyAuditRow>();
    const rowsList: IS14483MonthlyAuditRow[] = [];

    let currYear = startYear;
    let currMonth = startMonth;

    while (currYear < endYear || (currYear === endYear && currMonth <= endMonth)) {
      const monthKey = `${currYear}-${String(currMonth + 1).padStart(2, "0")}`;
      const isStart = currYear === startYear && currMonth === startMonth;
      const isEnd = currYear === endYear && currMonth === endMonth;

      let monthLabel = `${getMonthAbbr(currMonth)}-${String(currYear).slice(-2)}`;
      if (isStart && startStr.includes("-")) {
        const parts = startStr.split("-");
        monthLabel = `From ${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (isEnd && endStr.includes("-")) {
        const parts = endStr.split("-");
        monthLabel = `Up to ${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      const rowObj: IS14483MonthlyAuditRow = {
        monthLabel,
        monthKey,
        prod_2inch: 0,
        prod_1inch: 0,
        total_prod: 0,
        value: 0
      };
      rowsMap.set(monthKey, rowObj);
      rowsList.push(rowObj);

      currMonth++;
      if (currMonth > 11) {
        currMonth = 0;
        currYear++;
      }
    }

    productionData.forEach(item => {
      if (!item.date || item.date < startStr || item.date > endStr) return;
      const mKey = item.date.slice(0, 7);
      const row = rowsMap.get(mKey);
      if (!row) return;

      const sz = (item.size || "").toLowerCase();
      const qty = item.nos || item.pipe || 0;

      if (sz.includes("1\"") || sz.includes("25mm") || sz.includes("1 inch")) {
        row.prod_1inch += qty;
      } else {
        row.prod_2inch += qty;
      }
      row.value += item.value || 0;
    });

    const summary: IS14483MonthlyAuditRow = {
      monthLabel: "TOTAL",
      monthKey: "TOTAL",
      prod_2inch: 0,
      prod_1inch: 0,
      total_prod: 0,
      value: 0
    };

    rowsList.forEach(row => {
      row.total_prod = row.prod_2inch + row.prod_1inch;
      summary.prod_2inch += row.prod_2inch;
      summary.prod_1inch += row.prod_1inch;
      summary.total_prod += row.total_prod;
      summary.value += row.value;
    });

    const endMonthKey = `${endYear}-${String(endMonth + 1).padStart(2, "0")}`;
    const fullLastMonth: IS14483MonthlyAuditRow = {
      monthLabel: `${getMonthAbbr(endMonth)}-${String(endYear).slice(-2)}`,
      monthKey: endMonthKey,
      prod_2inch: 0,
      prod_1inch: 0,
      total_prod: 0,
      value: 0
    };

    productionData.forEach(item => {
      if (!item.date || !item.date.startsWith(endMonthKey)) return;
      const sz = (item.size || "").toLowerCase();
      const qty = item.nos || item.pipe || 0;

      if (sz.includes("1\"") || sz.includes("25mm") || sz.includes("1 inch")) {
        fullLastMonth.prod_1inch += qty;
      } else {
        fullLastMonth.prod_2inch += qty;
      }
      fullLastMonth.value += item.value || 0;
    });
    fullLastMonth.total_prod = fullLastMonth.prod_2inch + fullLastMonth.prod_1inch;

    return { rows: rowsList, summary, fullLastMonth, conversions: null };
  }, [selectedStandard, currentRenewalPeriod.start, currentRenewalPeriod.end, productionData]);

  // IS 4985 Monthly Audit Data Aggregation
  const is4985AuditData = useMemo(() => {
    if (selectedStandard !== "is4985") return { rows: [], summary: null, fullLastMonth: null, conversions: null };

    const startStr = currentRenewalPeriod.start || "2025-03-25";
    const endStr = currentRenewalPeriod.end || "2026-03-24";
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return { rows: [], summary: null, fullLastMonth: null, conversions: null };

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();

    const rowsMap = new Map<string, IS4985MonthlyAuditRow>();
    const rowsList: IS4985MonthlyAuditRow[] = [];

    let currYear = startYear;
    let currMonth = startMonth;
    let srCounter = 1;

    while (currYear < endYear || (currYear === endYear && currMonth <= endMonth)) {
      const monthKey = `${currYear}-${String(currMonth + 1).padStart(2, "0")}`;
      const isStart = currYear === startYear && currMonth === startMonth;
      const isEnd = currYear === endYear && currMonth === endMonth;

      let monthLabel = `${getMonthAbbr(currMonth)}-${String(currYear).slice(-2)}`;
      if (isStart && startStr.includes("-")) {
        const parts = startStr.split("-");
        monthLabel = `From ${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (isEnd && endStr.includes("-")) {
        const parts = endStr.split("-");
        monthLabel = `Up to ${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      const createIS4985RowObj = (srNoVal: number | string, mLabel: string, mKey: string): IS4985MonthlyAuditRow => ({
        srNo: srNoVal,
        monthLabel: mLabel,
        monthKey: mKey,
        pipe_63mm_cl2: 0,
        pipe_75mm_cl2: 0,
        pipe_75mm_cl3: 0,
        pipe_90mm_cl2: 0,
        pipe_90mm_cl3: 0,
        pipe_110mm_cl2: 0,
        pipe_110mm_cl3: 0,
        pipe_140mm_cl2: 0,
        pipe_140mm_cl3: 0,
        pipe_160mm_cl2: 0,
        pipe_160mm_cl3: 0,
        wt_63mm_cl2: 0,
        wt_75mm_cl2: 0,
        wt_75mm_cl3: 0,
        wt_90mm_cl2: 0,
        wt_90mm_cl3: 0,
        wt_110mm_cl2: 0,
        wt_110mm_cl3: 0,
        wt_140mm_cl2: 0,
        wt_140mm_cl3: 0,
        wt_160mm_cl2: 0,
        wt_160mm_cl3: 0,
        total_wt: 0,
        qty_tons: 0,
        value: 0
      });

      const rowObj = createIS4985RowObj(srCounter++, monthLabel, monthKey);
      rowsMap.set(monthKey, rowObj);
      rowsList.push(rowObj);

      currMonth++;
      if (currMonth > 11) {
        currMonth = 0;
        currYear++;
      }
    }

    const getIS4985SizeInfo = (szRaw: string) => {
      const sz = (szRaw || "").toLowerCase();
      const isCl3 = sz.includes("cl-3") || sz.includes("cl3") || sz.includes("cl 3") || sz.includes("6kg") || sz.includes("6 kg");
      if (sz.includes("160mm")) return isCl3 ? { id: "pipe_160mm_cl3", convKey: "sms_conv_weight_is4985_160mm Cl-3", defaultConv: 21.0 } : { id: "pipe_160mm_cl2", convKey: "sms_conv_weight_is4985_160mm Cl-2", defaultConv: 17.0 };
      if (sz.includes("140mm")) return isCl3 ? { id: "pipe_140mm_cl3", convKey: "sms_conv_weight_is4985_140mm Cl-3", defaultConv: 18.7 } : { id: "pipe_140mm_cl2", convKey: "sms_conv_weight_is4985_140mm Cl-2", defaultConv: 13.0 };
      if (sz.includes("110mm")) return isCl3 ? { id: "pipe_110mm_cl3", convKey: "sms_conv_weight_is4985_110mm Cl-3", defaultConv: 10.2 } : { id: "pipe_110mm_cl2", convKey: "sms_conv_weight_is4985_110mm Cl-2", defaultConv: 7.8 };
      if (sz.includes("90mm")) return isCl3 ? { id: "pipe_90mm_cl3", convKey: "sms_conv_weight_is4985_90mm Cl-3", defaultConv: 6.9 } : { id: "pipe_90mm_cl2", convKey: "sms_conv_weight_is4985_90mm Cl-2", defaultConv: 5.5 };
      if (sz.includes("75mm")) return isCl3 ? { id: "pipe_75mm_cl3", convKey: "sms_conv_weight_is4985_75mm Cl-3", defaultConv: 4.8 } : { id: "pipe_75mm_cl2", convKey: "sms_conv_weight_is4985_75mm Cl-2", defaultConv: 3.9 };
      return { id: "pipe_63mm_cl2", convKey: "sms_conv_weight_is4985_63mm Cl-2", defaultConv: 2.9 };
    };

    productionData.forEach(item => {
      if (!item.date || item.date < startStr || item.date > endStr) return;
      const mKey = item.date.slice(0, 7);
      const row = rowsMap.get(mKey);
      if (!row) return;

      const szInfo = getIS4985SizeInfo(item.size || "");
      const qty = item.pipe || item.nos || item.mtr || 0;
      const conv = Number(localStorage.getItem(szInfo.convKey) || szInfo.defaultConv);
      const kg = item.kg || (item.tonn ? item.tonn * 1000 : qty * conv);

      row[szInfo.id] = (row[szInfo.id] || 0) + qty;
      const wtKey = szInfo.id.replace("pipe_", "wt_");
      row[wtKey] = (row[wtKey] || 0) + kg;
      row.value += item.value || 0;
    });

    const createIS4985RowObj2 = (srNoVal: number | string, mLabel: string, mKey: string): IS4985MonthlyAuditRow => ({
      srNo: srNoVal,
      monthLabel: mLabel,
      monthKey: mKey,
      pipe_63mm_cl2: 0,
      pipe_75mm_cl2: 0,
      pipe_75mm_cl3: 0,
      pipe_90mm_cl2: 0,
      pipe_90mm_cl3: 0,
      pipe_110mm_cl2: 0,
      pipe_110mm_cl3: 0,
      pipe_140mm_cl2: 0,
      pipe_140mm_cl3: 0,
      pipe_160mm_cl2: 0,
      pipe_160mm_cl3: 0,
      wt_63mm_cl2: 0,
      wt_75mm_cl2: 0,
      wt_75mm_cl3: 0,
      wt_90mm_cl2: 0,
      wt_90mm_cl3: 0,
      wt_110mm_cl2: 0,
      wt_110mm_cl3: 0,
      wt_140mm_cl2: 0,
      wt_140mm_cl3: 0,
      wt_160mm_cl2: 0,
      wt_160mm_cl3: 0,
      total_wt: 0,
      qty_tons: 0,
      value: 0
    });

    const summary: IS4985MonthlyAuditRow = createIS4985RowObj2("", "TOTAL", "TOTAL");

    rowsList.forEach(row => {
      let totalWt = 0;
      exportSizesConfig.is4985.forEach(opt => {
        const wtKey = opt.id.replace("pipe_", "wt_");
        totalWt += (row[wtKey] || 0);
        summary[opt.id] = (summary[opt.id] || 0) + (row[opt.id] || 0);
        summary[wtKey] = (summary[wtKey] || 0) + (row[wtKey] || 0);
      });
      row.total_wt = totalWt;
      row.qty_tons = Math.round((row.total_wt / 1000) * 100) / 100;
      summary.total_wt += row.total_wt;
      summary.value += row.value;
    });
    summary.qty_tons = Math.round((summary.total_wt / 1000) * 100) / 100;

    const endMonthKey = `${endYear}-${String(endMonth + 1).padStart(2, "0")}`;
    const fullLastMonth: IS4985MonthlyAuditRow = createIS4985RowObj2("", `${getMonthAbbr(endMonth)}-${String(endYear).slice(-2)}`, endMonthKey);

    productionData.forEach(item => {
      if (!item.date || !item.date.startsWith(endMonthKey)) return;
      const szInfo = getIS4985SizeInfo(item.size || "");
      const qty = item.pipe || item.nos || item.mtr || 0;
      const conv = Number(localStorage.getItem(szInfo.convKey) || szInfo.defaultConv);
      const kg = item.kg || (item.tonn ? item.tonn * 1000 : qty * conv);

      fullLastMonth[szInfo.id] = (fullLastMonth[szInfo.id] || 0) + qty;
      const wtKey = szInfo.id.replace("pipe_", "wt_");
      fullLastMonth[wtKey] = (fullLastMonth[wtKey] || 0) + kg;
      fullLastMonth.value += item.value || 0;
    });

    let fullLastMonthTotalWt = 0;
    exportSizesConfig.is4985.forEach(opt => {
      const wtKey = opt.id.replace("pipe_", "wt_");
      fullLastMonthTotalWt += (fullLastMonth[wtKey] || 0);
    });
    fullLastMonth.total_wt = fullLastMonthTotalWt;
    fullLastMonth.qty_tons = Math.round((fullLastMonth.total_wt / 1000) * 100) / 100;

    const conversions: IS4985MonthlyAuditRow = createIS4985RowObj2("", "CONVERSIONS (KG/PIPE)", "CONVERSIONS");
    exportSizesConfig.is4985.forEach(opt => {
      const wtKey = opt.id.replace("pipe_", "wt_");
      conversions[wtKey] = Number(localStorage.getItem(opt.convKey) || opt.defaultConv);
    });

    return { rows: rowsList, summary, fullLastMonth, conversions };
  }, [selectedStandard, currentRenewalPeriod.start, currentRenewalPeriod.end, productionData]);

  // Execute size-filtered Excel Export
  const handleConfirmExport = (selectedSizes: string[]) => {
    setIsWizardOpen(false);
    const currentStdObj = smsStandardsList.find(s => s.id === selectedStandard) || smsStandardsList[0];
    const wb = XLSX.utils.book_new();

    const availableOptions = exportSizesConfig[selectedStandard] || [];
    const activeSizes = (selectedSizes && selectedSizes.length > 0) ? selectedSizes : availableOptions.map(o => o.id);

    const titleRows = [
      [`IS CODE : ${currentStdObj.code}`],
      [`LICENSE / CM/L NO.: ${licenseInfo.cmlNumber}`],
      [`RENEWAL PRODUCTION PERIOD: ${currentRenewalPeriod.start} to ${currentRenewalPeriod.end} (${selectedYear})`],
      []
    ];

    let headers: string[] = ["Month"];
    activeSizes.forEach(sizeId => {
      const opt = availableOptions.find(o => o.id === sizeId);
      if (selectedStandard === "is13488" || selectedStandard === "is12786") {
        headers.push(opt ? opt.label : `${sizeId} Mtr.`);
      } else if (selectedStandard === "is4985" || selectedStandard === "is17425") {
        headers.push(opt ? opt.label : `${sizeId} (Pipe)`);
      } else {
        headers.push(opt ? opt.label : `${sizeId} (Nos.)`);
      }
    });

    if (selectedStandard === "is13488" || selectedStandard === "is12786") {
      headers.push("Total Mtr.");
      activeSizes.forEach(sizeId => {
        const opt = availableOptions.find(o => o.id === sizeId);
        headers.push(opt ? opt.label.replace("Mtr.", "Kgs.") : `${sizeId} Kgs.`);
      });
      headers.push("Total Kgs.", "Value (₹)");
    } else if (selectedStandard === "is4985") {
      headers.push("Total Pipe");
      activeSizes.forEach(sizeId => {
        const opt = availableOptions.find(o => o.id === sizeId);
        headers.push(opt ? opt.label.replace("(Pipe)", "wt.").replace(" 6kg", " wt. 6kg") : `${sizeId} wt.`);
      });
      headers.push("Total Weight (MT)", "Total Weight (Kg)", "Value (₹)");
    } else if (selectedStandard === "is17425") {
      headers.push("TOTAL (Nos.)", "Value (₹)");
    } else if (selectedStandard === "is13487") {
      headers.push("Total Nos.", "Total in 1000 Unit", "Value (₹)");
    } else if (selectedStandard === "is14483") {
      headers.push("TOTAL (Nos.)", "Value (₹)");
    }

    let currentAuditData: any = is13488AuditData;
    if (selectedStandard === "is12786") currentAuditData = is12786AuditData;
    else if (selectedStandard === "is17425") currentAuditData = is17425AuditData;
    else if (selectedStandard === "is13487") currentAuditData = is13487AuditData;
    else if (selectedStandard === "is14483") currentAuditData = is14483AuditData;
    else if (selectedStandard === "is4985") currentAuditData = is4985AuditData;

    const buildRow = (rowObj: any) => {
      if (!rowObj) return [];
      const row: any[] = [rowObj.monthLabel || ""];
      let totalQty = 0;
      activeSizes.forEach(sizeId => {
        let val = 0;
        if (selectedStandard === "is13488" || selectedStandard === "is12786") {
          const key = `mtr_${sizeId}`;
          val = rowObj[key] || 0;
        } else {
          val = rowObj[sizeId] || 0;
        }
        row.push(val || "");
        totalQty += Number(val) || 0;
      });

      if (selectedStandard === "is13488" || selectedStandard === "is12786") {
        row.push(totalQty || "");
        let totalKg = 0;
        activeSizes.forEach(sizeId => {
          let kgVal = 0;
          const key = `kg_${sizeId}`;
          if (rowObj[key] !== undefined) {
            kgVal = rowObj[key];
          } else {
            const opt = availableOptions.find(o => o.id === sizeId);
            const conv = Number(inlineConversions[sizeId] || localStorage.getItem(opt?.convKey || "") || opt?.defaultConv || 0);
            const mtrKey = `mtr_${sizeId}`;
            kgVal = (rowObj[mtrKey] || 0) * conv;
          }
          row.push(kgVal ? Math.round(kgVal * 100) / 100 : "");
          totalKg += Number(kgVal) || 0;
        });
        row.push(totalKg ? Math.round(totalKg * 100) / 100 : "", rowObj.value ? Math.round(rowObj.value) : "");
      } else if (selectedStandard === "is4985") {
        row.push(totalQty || "");
        let totalMt = 0;
        activeSizes.forEach(sizeId => {
          const opt = availableOptions.find(o => o.id === sizeId);
          const conv = Number(inlineConversions[sizeId] || localStorage.getItem(opt?.convKey || "") || opt?.defaultConv || 0);
          const pipeVal = rowObj[sizeId] || 0;
          const wtVal = (pipeVal * conv) / 1000;
          totalMt += wtVal;
          row.push(wtVal ? Math.round(wtVal * 1000) / 1000 : "");
        });
        const totalKg = totalMt * 1000;
        row.push(totalMt ? Math.round(totalMt * 1000) / 1000 : "", totalKg ? Math.round(totalKg) : "", rowObj.value ? Math.round(rowObj.value) : "");
      } else if (selectedStandard === "is17425") {
        row.push(totalQty || "", rowObj.value ? Math.round(rowObj.value) : "");
      } else if (selectedStandard === "is13487") {
        const unit1000 = rowObj.unit_of_1000 !== undefined ? rowObj.unit_of_1000 : (totalQty / 1000);
        row.push(totalQty || "", unit1000 ? Math.round(unit1000 * 100) / 100 : "", rowObj.value ? Math.round(rowObj.value) : "");
      } else if (selectedStandard === "is14483") {
        row.push(totalQty || "", rowObj.value ? Math.round(rowObj.value) : "");
      }
      return row;
    };

    const dataRows = (currentAuditData.rows || []).map(buildRow);
    const summaryRow = currentAuditData.summary ? buildRow(currentAuditData.summary) : [];
    const fullLastMonthRow = currentAuditData.fullLastMonth ? buildRow(currentAuditData.fullLastMonth) : [];

    let conversionsRow: any[] = [];
    if (selectedStandard === "is13488" || selectedStandard === "is12786") {
      if (currentAuditData.conversions || inlineConversions) {
        conversionsRow = [currentAuditData.conversions?.monthLabel || "CONVERSIONS (KG/MTR)"];
        activeSizes.forEach(() => conversionsRow.push(""));
        conversionsRow.push("");
        activeSizes.forEach(sizeId => {
          const opt = availableOptions.find(o => o.id === sizeId);
          const convKey = `kg_${sizeId}`;
          const val = inlineConversions[sizeId] || currentAuditData.conversions?.[convKey] || localStorage.getItem(opt?.convKey || "") || opt?.defaultConv || "";
          conversionsRow.push(val);
        });
        conversionsRow.push("", "");
      }
    } else if (selectedStandard === "is4985") {
      conversionsRow = ["CONVERSIONS (MT/PIPE)"];
      activeSizes.forEach(() => conversionsRow.push(""));
      conversionsRow.push("");
      activeSizes.forEach(sizeId => {
        const opt = availableOptions.find(o => o.id === sizeId);
        const val = inlineConversions[sizeId] || localStorage.getItem(opt?.convKey || "") || opt?.defaultConv || "";
        conversionsRow.push(val);
      });
      conversionsRow.push("", "", "");
    }

    const sheetData = [
      ...titleRows,
      headers,
      ...dataRows,
      ...(summaryRow.length ? [summaryRow] : []),
      ...(fullLastMonthRow.length ? [[], fullLastMonthRow] : []),
      ...(conversionsRow.length ? [[], conversionsRow] : [])
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    let mergeEndCol = 2;
    if (selectedStandard === "is4985") mergeEndCol = 4;
    else if (selectedStandard === "is13488" || selectedStandard === "is12786") mergeEndCol = 3;

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: mergeEndCol } }
    ];

    const colWidths = [{ wch: 20 }];
    for (let i = 1; i < headers.length; i++) colWidths.push({ wch: 16 });
    ws["!cols"] = colWidths;

    const range = XLSX.utils.decode_range(ws["!ref"] || "A1:Z30");
    const headerRowIdx = 4;
    const summaryRowIdx = summaryRow.length ? headerRowIdx + dataRows.length + 1 : -1;
    const fullLastMonthRowIdx = fullLastMonthRow.length ? summaryRowIdx + 2 : -1;
    const conversionsRowIdx = conversionsRow.length ? fullLastMonthRowIdx + 2 : -1;

    for (let R = 0; R <= range.e.r; ++R) {
      for (let C = 0; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = { t: "s", v: "" };
        const cell = ws[cellAddress];

        if (R < headerRowIdx) {
          cell.s = {
            font: { bold: true, sz: R === 0 ? 14 : 11, color: { rgb: "1F2937" } },
            alignment: { horizontal: "left", vertical: "center" }
          };
          continue;
        }

        if (R === headerRowIdx) {
          let isHighlight = false;
          if (selectedStandard === "is13488" || selectedStandard === "is12786") {
            const kgStartCol = 1 + activeSizes.length + 1;
            const kgEndCol = kgStartCol + activeSizes.length;
            if (C >= kgStartCol && C <= kgEndCol) isHighlight = true;
          } else if (selectedStandard === "is4985") {
            const wtStartCol = 1 + activeSizes.length + 1;
            const wtEndCol = wtStartCol + activeSizes.length + 1;
            if (C >= wtStartCol && C <= wtEndCol) isHighlight = true;
          }
          cell.s = {
            font: { bold: true, sz: 11, color: { rgb: isHighlight ? "000000" : "FFFFFF" } },
            fill: { fgColor: { rgb: isHighlight ? "FFFF00" : "1E3A8A" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
              top: { style: "thin", color: { rgb: "D1D5DB" } },
              bottom: { style: "medium", color: { rgb: "111827" } },
              left: { style: "thin", color: { rgb: "D1D5DB" } },
              right: { style: "thin", color: { rgb: "D1D5DB" } }
            }
          };
          continue;
        }

        if (R === summaryRowIdx + 1 || R === fullLastMonthRowIdx + 1) continue;

        const isSummaryRow = R === summaryRowIdx;
        const isFullLastMonthRow = R === fullLastMonthRowIdx;
        const isConversionsRow = R === conversionsRowIdx;

        let isHighlightCol = false;
        if (selectedStandard === "is13488" || selectedStandard === "is12786") {
          const kgStartCol = 1 + activeSizes.length + 1;
          const kgEndCol = kgStartCol + activeSizes.length;
          if (C >= kgStartCol && C <= kgEndCol) isHighlightCol = true;
        } else if (selectedStandard === "is4985") {
          const wtStartCol = 1 + activeSizes.length + 1;
          const wtEndCol = wtStartCol + activeSizes.length + 1;
          if (C >= wtStartCol && C <= wtEndCol) isHighlightCol = true;
        }

        let fgColor = "FFFFFF";
        if (isSummaryRow) fgColor = isHighlightCol ? "FFFF00" : "E5E7EB";
        else if (isFullLastMonthRow) fgColor = isHighlightCol ? "FFFFC2" : "F3F4F6";
        else if (isConversionsRow) fgColor = isHighlightCol ? "FFFFC2" : "F9FAFB";
        else if (isHighlightCol) fgColor = "FFFFC2";
        else if (R % 2 === 1) fgColor = "F9FAFB";

        cell.s = {
          font: {
            bold: isSummaryRow || isFullLastMonthRow || isConversionsRow || C === 0,
            sz: isSummaryRow ? 11 : 10,
            color: { rgb: "111827" }
          },
          fill: { fgColor: { rgb: fgColor } },
          alignment: { horizontal: C !== 0 ? "right" : "left", vertical: "center" },
          border: {
            top: { style: isSummaryRow ? "medium" : "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: isSummaryRow ? "double" : "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } }
          }
        };

        if (typeof cell.v === "number") {
          if (isConversionsRow) cell.z = "#,##0.0000";
          else if (headers[C]?.includes("₹")) cell.z = "₹#,##0";
          else if (headers[C]?.includes("Mtr.") || headers[C]?.includes("Nos.") || headers[C]?.includes("Pipe")) cell.z = "#,##0";
          else cell.z = "#,##0.00";
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, `Renewal Data ${currentStdObj.code.replace(" ", "_")}`);
    XLSXStyle.writeFile(wb, `BIS_Renewal_Audit_Statement_${currentStdObj.code.replace(" ", "_")}_${selectedYear === "All" ? "Full_Period" : selectedYear}.xlsx`);

    toast({
      title: "Renewal Statement Downloaded",
      description: `Exact format for ${currentStdObj.code} generated successfully.`
    });
  };

  // Open Export Wizard Modal with Size selection and conversion checks
  const handleDownloadRenewalExcel = () => {
    const config = exportSizesConfig[selectedStandard];
    if (config && config.length > 0) {
      setWizardSelectedSizes(config.map(c => c.id));
      const loadedConversions: Record<string, string> = {};
      config.forEach(option => {
        if (option.requireConv && option.convKey) {
          const val = localStorage.getItem(option.convKey) || (option.defaultConv ? String(option.defaultConv) : "");
          loadedConversions[option.id] = val;
        }
      });
      setInlineConversions(loadedConversions);
      setIsWizardOpen(true);
    } else {
      handleConfirmExport([]);
    }
  };









  const currentStandardObj = smsStandardsList.find(s => s.id === selectedStandard) || smsStandardsList[0];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 font-sans relative overflow-hidden">
      {/* Subtle Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Top Header & Intro Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-900">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                  BIS License Renewal Data
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold tracking-wide">
                    Production Based
                  </span>
                </h1>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Maintain, verify, and export standardized production statements required for Bureau of Indian Standards (BIS / ISI) periodic license renewal audits across all 6 manufactured IS standards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleDownloadRenewalExcel}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 flex items-center gap-2.5"
            >
              <Download className="w-4 h-4" />
              <span>Download Renewal Format</span>
            </Button>
          </div>
        </div>

        {/* Standard Selection Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {smsStandardsList.map((std) => {
            const isSelected = selectedStandard === std.id;
            const IconComponent = std.icon;
            return (
              <button
                key={std.id}
                onClick={() => setSelectedStandard(std.id)}
                className={`group relative p-4 rounded-2xl border transition-all duration-300 text-left flex flex-col justify-between overflow-hidden cursor-pointer ${
                  isSelected
                    ? `${std.activeBg} ${std.activeBorder} ring-1 shadow-xl -translate-y-1 scale-[1.02]`
                    : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/80 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40"
                }`}
              >
                {/* Glowing Background Gradient on Hover or Selection */}
                <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${std.glowGradient} opacity-0 ${
                  isSelected ? "opacity-100" : "group-hover:opacity-75"
                } transition-opacity duration-500 blur-[2px] -z-10`} />

                {/* Animated Top Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${std.accentBar} transition-all duration-300 rounded-t-2xl ${
                  isSelected ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-60"
                }`} />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl ${std.iconBg} flex items-center justify-center border border-white/10 transition-transform duration-300 ${
                      isSelected ? "scale-110 rotate-3 shadow-md" : "group-hover:scale-110 group-hover:rotate-6"
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold text-white animate-in zoom-in-50 duration-200 shadow-sm">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Active</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border tracking-wider transition-colors ${std.badgeColor}`}>
                      {std.code}
                    </span>
                  </div>

                  <div className="text-sm font-extrabold text-slate-100 group-hover:text-white transition-colors tracking-tight mt-1">
                    {std.title}
                  </div>
                </div>

                {/* Bottom subtle indicator line */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">
                  <span>Audit Statement</span>
                  <span className={`font-mono font-bold ${isSelected ? "text-white" : "text-slate-500 group-hover:text-slate-400"}`}>→</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* License Renewal Metadata Card & Status Bar */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-6 shadow-xl relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>{currentStandardObj.code} : {currentStandardObj.title}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">License Metadata</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Required license details embedded in downloaded production renewal statements.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${
                licenseInfo.status === "Active" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
              }`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                License {licenseInfo.status}
              </span>

              {!isEditingLicense ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditingLicense(true)}
                  className="bg-slate-900/90 border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-200 gap-1.5 text-xs h-8 px-3 transition-all shadow-sm"
                >
                  <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
                  Edit Details
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={handleSaveLicenseInfo}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs h-8 px-3.5 transition-all shadow-md shadow-emerald-600/20 font-medium"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </Button>
              )}
            </div>
          </div>

          {/* License Info Display Mode vs Edit Mode */}
          {!isEditingLicense ? (
            <div className="pt-5 relative z-10 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: CM/L Number */}
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between hover:border-slate-700/80 transition-all group">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">BIS CM/L Number</span>
                    <FileCheck className="w-4 h-4 text-indigo-400/80" />
                  </div>
                  <div className="text-base font-extrabold text-indigo-300 font-mono tracking-tight mt-1 flex items-center justify-between">
                    <span>{licenseInfo.cmlNumber}</span>
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">Verified</span>
                  </div>
                </div>

                {/* Card 2: Certificate Validity Period */}
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between hover:border-slate-700/80 transition-all group">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">Certificate Validity Period</span>
                    <Calendar className="w-4 h-4 text-sky-400/80" />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-200 mt-1 flex items-center gap-2 font-mono">
                    <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200">{licenseInfo.validFrom}</span>
                    <span className="text-slate-500 font-sans text-xs">to</span>
                    <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200">{licenseInfo.validTo}</span>
                  </div>
                </div>

                {/* Card 3: Renewal Production Range */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 flex flex-col justify-between hover:border-emerald-500/50 transition-all group shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <div className="flex items-center justify-between text-emerald-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Renewal Production Range</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedYear === "All" ? "All Years" : selectedYear}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-emerald-300 mt-1 flex items-center gap-2 font-mono">
                    <span className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">{currentRenewalPeriod.start}</span>
                    <span className="text-emerald-500/70 font-sans text-xs">to</span>
                    <span className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">{currentRenewalPeriod.end}</span>
                  </div>
                </div>
              </div>

              {/* Remarks Banner (Full Width, Easy to Read, Never Truncates) */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-slate-700/80 transition-all">
                <div className="flex items-center gap-2 text-slate-400 shrink-0 sm:w-56">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Testing Agency / QC Remarks</span>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed font-normal flex-1 sm:border-l sm:border-slate-800/80 sm:pl-4 bg-slate-900/30 sm:bg-transparent p-2.5 sm:p-0 rounded-lg border border-slate-800/50 sm:border-0">
                  {licenseInfo.remarks || "No additional remarks logged for this license."}
                </div>
              </div>
            </div>
          ) : (
            /* Editing Mode Panel */
            <div className="pt-5 relative z-10">
              <div className="rounded-xl border border-indigo-500/30 bg-slate-950/90 p-5 space-y-4 shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Editing License Metadata
                  </span>
                  <span className="text-xs text-slate-500">Changes apply instantly to exported sheets</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">BIS CM/L Number</label>
                    <input
                      type="text"
                      value={licenseInfo.cmlNumber}
                      onChange={(e) => setLicenseInfo({ ...licenseInfo, cmlNumber: e.target.value })}
                      placeholder="e.g. CM/L-7800045123"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Certificate Validity From</label>
                    <input
                      type="date"
                      value={licenseInfo.validFrom}
                      onChange={(e) => setLicenseInfo({ ...licenseInfo, validFrom: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Certificate Validity To</label>
                    <input
                      type="date"
                      value={licenseInfo.validTo}
                      onChange={(e) => setLicenseInfo({ ...licenseInfo, validTo: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Testing Agency / QC Remarks</label>
                  <input
                    type="text"
                    value={licenseInfo.remarks}
                    onChange={(e) => setLicenseInfo({ ...licenseInfo, remarks: e.target.value })}
                    placeholder="e.g. Emitting pipes in-line & online drip irrigation lateral tubes as per IS 13488"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditingLicense(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs h-8 px-4"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSaveLicenseInfo}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs h-8 px-4 font-semibold"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics & Production Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Production Records</span>
              <TableIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100">
              {totals.count.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 mt-1">Logged manufacturing shifts</span>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Output Qty</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">
              {totals.totalQty.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 mt-1">
              {selectedStandard === "is4985" || selectedStandard === "is17425" ? "Pipes / Nos manufactured" : "Total Meters / Units"}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Estimated Tonnage</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400">
              {(Math.round(totals.totalWeightKg / 10) / 100).toLocaleString()} <span className="text-sm font-normal">Tons</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1">Calculated polymer consumption</span>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Production Value</span>
              <span className="text-xs font-bold text-purple-400">₹ INR</span>
            </div>
            <div className="text-2xl font-extrabold text-purple-400">
              ₹{(Math.round(totals.totalValue)).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 mt-1">Gross manufactured valuation</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-300">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs text-slate-100 font-bold focus:outline-none cursor-pointer"
              >
                <option value="2026-27" className="bg-slate-900">2026-27</option>
                <option value="2027-28" className="bg-slate-900">2027-28</option>
                <option value="2025-26" className="bg-slate-900">2025-26</option>
                <option value="2024-25" className="bg-slate-900">2024-25</option>
                <option value="All" className="bg-slate-900">All Years</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-300">Size / Class:</span>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="bg-transparent text-xs text-slate-100 font-bold focus:outline-none cursor-pointer"
              >
                {(standardSizes[selectedStandard] || ["All Sizes"]).map((sz) => (
                  <option key={sz} value={sz} className="bg-slate-900">
                    {sz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800/80 hover:border-indigo-500/50 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-xl px-3.5 py-1.5 w-full sm:w-72 transition-all duration-200 shadow-inner">
              <Search className="w-4 h-4 text-indigo-400 shrink-0" />
              <input
                type="text"
                placeholder="Search date or size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none tracking-wide"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Production Data Statement Table */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900/80 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <TableIcon className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-100">
                {viewMode === "audit" && ["is13488", "is12786", "is17425", "is13487", "is14483", "is4985"].includes(selectedStandard)
                  ? `${selectedStandard.toUpperCase().replace("IS", "IS ")} — Monthly Audit Statement (Real-World BIS Format)`
                  : "Production Statement for License Renewal Audit"}
              </h3>
              <span className="text-xs text-slate-400">
                ({viewMode === "audit" && ["is13488", "is12786", "is17425", "is13487", "is14483", "is4985"].includes(selectedStandard)
                  ? `${
                      selectedStandard === "is13488" ? is13488AuditData.rows.length :
                      selectedStandard === "is12786" ? is12786AuditData.rows.length :
                      selectedStandard === "is17425" ? is17425AuditData.rows.length :
                      selectedStandard === "is13487" ? is13487AuditData.rows.length :
                      selectedStandard === "is14483" ? is14483AuditData.rows.length :
                      is4985AuditData.rows.length
                    } months summarized`
                  : `${filteredData.length} entries shown`})
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {["is13488", "is12786", "is17425", "is13487", "is14483", "is4985"].includes(selectedStandard) && (
                <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-1 text-xs">
                  <button
                    onClick={() => setViewMode("audit")}
                    className={`px-3 py-1 rounded-md font-bold transition-all ${
                      viewMode === "audit"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Monthly Audit View
                  </button>
                  <button
                    onClick={() => setViewMode("detailed")}
                    className={`px-3 py-1 rounded-md font-bold transition-all ${
                      viewMode === "detailed"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Detailed Log View
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Format compliant with BIS required statement</span>
              </div>
            </div>
          </div>

          {viewMode === "audit" ? (
            <>
              {selectedStandard === "is13488" && (
                <div className="overflow-x-auto max-h-[560px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider sticky top-0 z-20 border-b border-slate-800 font-bold">
                      <tr>
                        <th className="py-3 px-3 border-r border-slate-800/80">Month</th>
                        <th className="py-3 px-2.5 text-right border-r border-slate-800/80">12 MM(II) Mtr.</th>
                        <th className="py-3 px-2.5 text-right border-r border-slate-800/80">16 MM(II) Mtr.</th>
                        <th className="py-3 px-2.5 text-right border-r border-slate-800/80">20 MM(I) Mtr.</th>
                        <th className="py-3 px-2.5 text-right border-r border-slate-800/80">16 MM(I) Mtr.</th>
                        <th className="py-3 px-3 text-right font-extrabold text-slate-200 border-r border-slate-800/80 bg-slate-900/60">Total Mtr.</th>
                        <th className="py-3 px-2.5 text-right bg-amber-500/15 text-amber-300 border-r border-amber-500/20">12 MM(II) Kgs.</th>
                        <th className="py-3 px-2.5 text-right bg-amber-500/15 text-amber-300 border-r border-amber-500/20">16 MM(II) Kgs.</th>
                        <th className="py-3 px-2.5 text-right bg-amber-500/15 text-amber-300 border-r border-amber-500/20">20 MM(I) Kgs.</th>
                        <th className="py-3 px-2.5 text-right bg-amber-500/15 text-amber-300 border-r border-amber-500/20">16 MM(I) Kgs.</th>
                        <th className="py-3 px-3 text-right font-extrabold bg-amber-500/25 text-amber-200 border-r border-amber-500/30">Total Kgs.</th>
                        <th className="py-3 px-3 text-right">Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-xs">
                      {is13488AuditData.rows.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2 font-sans">
                              <AlertCircle className="w-8 h-8 text-slate-600" />
                              <span className="text-sm font-medium">No audit period dates configured</span>
                              <span className="text-xs text-slate-600">Please check selected renewal production date range and year above.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        is13488AuditData.rows.map((row) => (
                          <tr key={row.monthKey} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-3 font-sans font-bold text-slate-300 border-r border-slate-800/80">
                              {row.monthLabel}
                            </td>
                            <td className="py-2 px-2.5 text-right border-r border-slate-800/80 text-slate-300">
                              {row.mtr_12mm_cl2 ? row.mtr_12mm_cl2.toLocaleString() : "—"}
                            </td>
                            <td className="py-2 px-2.5 text-right border-r border-slate-800/80 text-slate-300">
                              {row.mtr_16mm_cl2 ? row.mtr_16mm_cl2.toLocaleString() : "—"}
                            </td>
                            <td className="py-2 px-2.5 text-right border-r border-slate-800/80 text-slate-300">
                              {row.mtr_20mm_cl1 ? row.mtr_20mm_cl1.toLocaleString() : "—"}
                            </td>
                            <td className="py-2 px-2.5 text-right border-r border-slate-800/80 text-slate-300">
                              {row.mtr_16mm_cl1 ? row.mtr_16mm_cl1.toLocaleString() : "—"}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-indigo-300 border-r border-slate-800/80 bg-slate-900/40">
                              {row.total_mtr ? row.total_mtr.toLocaleString() : "—"}
                            </td>
                            <td className="py-2 px-2.5 text-right bg-amber-500/10 text-amber-200 border-r border-amber-500/20">
                              {row.kg_12mm_cl2 ? (Math.round(row.kg_12mm_cl2 * 100) / 100).toLocaleString() : "—"}
                            </td>
                            <td className="py-2 px-2.5 text-right bg-amber-500/10 text-amber-200 border-r border-amber-500/20">
                              {row.kg_16mm_cl2 ? (Math.round(row.kg_16mm_cl2 * 100) / 100).toLocaleString() : "—"}
                            </td>
                            <td className="py-2 px-2.5 text-right bg-amber-500/10 text-amber-200 border-r border-amber-500/20">
                              {row.kg_20mm_cl1 ? (Math.round(row.kg_20mm_cl1 * 100) / 100).toLocaleString() : "—"}
                            </td>
                            <td className="py-2 px-2.5 text-right bg-amber-500/10 text-amber-200 border-r border-amber-500/20">
                              {row.kg_16mm_cl1 ? (Math.round(row.kg_16mm_cl1 * 100) / 100).toLocaleString() : "—"}
                            </td>
                            <td className="py-2 px-3 text-right font-extrabold bg-amber-500/20 text-amber-100 border-r border-amber-500/30">
                              {row.total_kg ? (Math.round(row.total_kg * 100) / 100).toLocaleString() : "—"}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-purple-300">
                              {row.value ? `₹${Math.round(row.value).toLocaleString()}` : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                      {is13488AuditData.summary && (
                        <tr className="bg-slate-950 font-extrabold border-t-2 border-slate-700">
                          <td className="py-3 px-3 font-sans text-indigo-400 border-r border-slate-800/80">TOTAL</td>
                          <td className="py-3 px-2.5 text-right border-r border-slate-800/80 text-slate-100">
                            {is13488AuditData.summary.mtr_12mm_cl2.toLocaleString()}
                          </td>
                          <td className="py-3 px-2.5 text-right border-r border-slate-800/80 text-slate-100">
                            {is13488AuditData.summary.mtr_16mm_cl2.toLocaleString()}
                          </td>
                          <td className="py-3 px-2.5 text-right border-r border-slate-800/80 text-slate-100">
                            {is13488AuditData.summary.mtr_20mm_cl1.toLocaleString()}
                          </td>
                          <td className="py-3 px-2.5 text-right border-r border-slate-800/80 text-slate-100">
                            {is13488AuditData.summary.mtr_16mm_cl1.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right text-indigo-300 border-r border-slate-800/80 bg-slate-900/60">
                            {is13488AuditData.summary.total_mtr.toLocaleString()}
                          </td>
                          <td className="py-3 px-2.5 text-right bg-amber-500/20 text-amber-200 border-r border-amber-500/20">
                            {(Math.round(is13488AuditData.summary.kg_12mm_cl2 * 100) / 100).toLocaleString()}
                          </td>
                          <td className="py-3 px-2.5 text-right bg-amber-500/20 text-amber-200 border-r border-amber-500/20">
                            {(Math.round(is13488AuditData.summary.kg_16mm_cl2 * 100) / 100).toLocaleString()}
                          </td>
                          <td className="py-3 px-2.5 text-right bg-amber-500/20 text-amber-200 border-r border-amber-500/20">
                            {(Math.round(is13488AuditData.summary.kg_20mm_cl1 * 100) / 100).toLocaleString()}
                          </td>
                          <td className="py-3 px-2.5 text-right bg-amber-500/20 text-amber-200 border-r border-amber-500/20">
                            {(Math.round(is13488AuditData.summary.kg_16mm_cl1 * 100) / 100).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right bg-amber-500/30 text-amber-100 border-r border-amber-500/40">
                            {(Math.round(is13488AuditData.summary.total_kg * 100) / 100).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right text-purple-300">
                            ₹{Math.round(is13488AuditData.summary.value).toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedStandard === "is12786" && (
                <div className="overflow-x-auto max-h-[560px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider sticky top-0 z-20 border-b border-slate-800 font-bold">
                      <tr>
                        <th className="py-3 px-3 border-r border-slate-800/80">Month</th>
                        <th className="py-3 px-2 text-right border-r border-slate-800/80">12 MM(II) Mtr.</th>
                        <th className="py-3 px-2 text-right border-r border-slate-800/80">16 MM(II) Mtr.</th>
                        <th className="py-3 px-2 text-right border-r border-slate-800/80">32 MM(II) Mtr.</th>
                        <th className="py-3 px-2 text-right border-r border-slate-800/80">16 MM(I) Mtr.</th>
                        <th className="py-3 px-2 text-right border-r border-slate-800/80">20 MM(I) Mtr.</th>
                        <th className="py-3 px-2 text-right border-r border-slate-800/80">20 MM(II) Mtr.</th>
                        <th className="py-3 px-2.5 text-right font-extrabold text-slate-200 border-r border-slate-800/80 bg-slate-900/60">Total Mtr.</th>
                        <th className="py-3 px-2 text-right bg-amber-500/15 text-amber-300 border-r border-amber-500/20">12 MM(II) Kgs.</th>
                        <th className="py-3 px-2 text-right bg-amber-500/15 text-amber-300 border-r border-amber-500/20">16 MM(II) Kgs.</th>
                        <th className="py-3 px-2 text-right bg-amber-500/15 text-amber-300 border-r border-amber-500/20">32 MM(II) Kgs.</th>
                        <th className="py-3 px-2 text-right bg-amber-500/15 text-amber-300 border-r border-amber-500/20">16 MM(I) Kgs.</th>
                        <th className="py-3 px-2 text-right bg-amber-500/15 text-amber-300 border-r border-amber-500/20">20 MM(I) Kgs.</th>
                        <th className="py-3 px-2 text-right bg-amber-500/15 text-amber-300 border-r border-amber-500/20">20 MM(II) Kgs.</th>
                        <th className="py-3 px-2.5 text-right font-extrabold bg-amber-500/25 text-amber-200 border-r border-amber-500/30">Total (Kgs)</th>
                        <th className="py-3 px-3 text-right">Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-xs">
                      {is12786AuditData.rows.length === 0 ? (
                        <tr>
                          <td colSpan={16} className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2 font-sans">
                              <AlertCircle className="w-8 h-8 text-slate-600" />
                              <span className="text-sm font-medium">No audit period dates configured</span>
                              <span className="text-xs text-slate-600">Please check selected renewal production date range and year above.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        is12786AuditData.rows.map((row) => (
                          <tr key={row.monthKey} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-3 font-sans font-bold text-slate-300 border-r border-slate-800/80">{row.monthLabel}</td>
                            <td className="py-2 px-2 text-right border-r border-slate-800/80 text-slate-300">{row.mtr_12mm_cl2 ? row.mtr_12mm_cl2.toLocaleString() : "—"}</td>
                            <td className="py-2 px-2 text-right border-r border-slate-800/80 text-slate-300">{row.mtr_16mm_cl2 ? row.mtr_16mm_cl2.toLocaleString() : "—"}</td>
                            <td className="py-2 px-2 text-right border-r border-slate-800/80 text-slate-300">{row.mtr_32mm_cl2 ? row.mtr_32mm_cl2.toLocaleString() : "—"}</td>
                            <td className="py-2 px-2 text-right border-r border-slate-800/80 text-slate-300">{row.mtr_16mm_cl1 ? row.mtr_16mm_cl1.toLocaleString() : "—"}</td>
                            <td className="py-2 px-2 text-right border-r border-slate-800/80 text-slate-300">{row.mtr_20mm_cl1 ? row.mtr_20mm_cl1.toLocaleString() : "—"}</td>
                            <td className="py-2 px-2 text-right border-r border-slate-800/80 text-slate-300">{row.mtr_20mm_cl2 ? row.mtr_20mm_cl2.toLocaleString() : "—"}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-indigo-300 border-r border-slate-800/80 bg-slate-900/40">{row.total_mtr ? row.total_mtr.toLocaleString() : "—"}</td>
                            <td className="py-2 px-2 text-right bg-amber-500/10 text-amber-200 border-r border-amber-500/20">{row.kg_12mm_cl2 ? (Math.round(row.kg_12mm_cl2 * 100) / 100).toLocaleString() : "—"}</td>
                            <td className="py-2 px-2 text-right bg-amber-500/10 text-amber-200 border-r border-amber-500/20">{row.kg_16mm_cl2 ? (Math.round(row.kg_16mm_cl2 * 100) / 100).toLocaleString() : "—"}</td>
                            <td className="py-2 px-2 text-right bg-amber-500/10 text-amber-200 border-r border-amber-500/20">{row.kg_32mm_cl2 ? (Math.round(row.kg_32mm_cl2 * 100) / 100).toLocaleString() : "—"}</td>
                            <td className="py-2 px-2 text-right bg-amber-500/10 text-amber-200 border-r border-amber-500/20">{row.kg_16mm_cl1 ? (Math.round(row.kg_16mm_cl1 * 100) / 100).toLocaleString() : "—"}</td>
                            <td className="py-2 px-2 text-right bg-amber-500/10 text-amber-200 border-r border-amber-500/20">{row.kg_20mm_cl1 ? (Math.round(row.kg_20mm_cl1 * 100) / 100).toLocaleString() : "—"}</td>
                            <td className="py-2 px-2 text-right bg-amber-500/10 text-amber-200 border-r border-amber-500/20">{row.kg_20mm_cl2 ? (Math.round(row.kg_20mm_cl2 * 100) / 100).toLocaleString() : "—"}</td>
                            <td className="py-2 px-2.5 text-right font-extrabold bg-amber-500/20 text-amber-100 border-r border-amber-500/30">{row.total_kg ? (Math.round(row.total_kg * 100) / 100).toLocaleString() : "—"}</td>
                            <td className="py-2 px-3 text-right font-bold text-purple-300">{row.value ? `₹${Math.round(row.value).toLocaleString()}` : "—"}</td>
                          </tr>
                        ))
                      )}
                      {is12786AuditData.summary && (
                        <tr className="bg-slate-950 font-extrabold border-t-2 border-slate-700">
                          <td className="py-3 px-3 font-sans text-indigo-400 border-r border-slate-800/80">TOTAL</td>
                          <td className="py-3 px-2 text-right border-r border-slate-800/80 text-slate-100">{is12786AuditData.summary.mtr_12mm_cl2.toLocaleString()}</td>
                          <td className="py-3 px-2 text-right border-r border-slate-800/80 text-slate-100">{is12786AuditData.summary.mtr_16mm_cl2.toLocaleString()}</td>
                          <td className="py-3 px-2 text-right border-r border-slate-800/80 text-slate-100">{is12786AuditData.summary.mtr_32mm_cl2.toLocaleString()}</td>
                          <td className="py-3 px-2 text-right border-r border-slate-800/80 text-slate-100">{is12786AuditData.summary.mtr_16mm_cl1.toLocaleString()}</td>
                          <td className="py-3 px-2 text-right border-r border-slate-800/80 text-slate-100">{is12786AuditData.summary.mtr_20mm_cl1.toLocaleString()}</td>
                          <td className="py-3 px-2 text-right border-r border-slate-800/80 text-slate-100">{is12786AuditData.summary.mtr_20mm_cl2.toLocaleString()}</td>
                          <td className="py-3 px-2.5 text-right text-indigo-300 border-r border-slate-800/80 bg-slate-900/60">{is12786AuditData.summary.total_mtr.toLocaleString()}</td>
                          <td className="py-3 px-2 text-right bg-amber-500/20 text-amber-200 border-r border-amber-500/20">{(Math.round(is12786AuditData.summary.kg_12mm_cl2 * 100) / 100).toLocaleString()}</td>
                          <td className="py-3 px-2 text-right bg-amber-500/20 text-amber-200 border-r border-amber-500/20">{(Math.round(is12786AuditData.summary.kg_16mm_cl2 * 100) / 100).toLocaleString()}</td>
                          <td className="py-3 px-2 text-right bg-amber-500/20 text-amber-200 border-r border-amber-500/20">{(Math.round(is12786AuditData.summary.kg_32mm_cl2 * 100) / 100).toLocaleString()}</td>
                          <td className="py-3 px-2 text-right bg-amber-500/20 text-amber-200 border-r border-amber-500/20">{(Math.round(is12786AuditData.summary.kg_16mm_cl1 * 100) / 100).toLocaleString()}</td>
                          <td className="py-3 px-2 text-right bg-amber-500/20 text-amber-200 border-r border-amber-500/20">{(Math.round(is12786AuditData.summary.kg_20mm_cl1 * 100) / 100).toLocaleString()}</td>
                          <td className="py-3 px-2 text-right bg-amber-500/20 text-amber-200 border-r border-amber-500/20">{(Math.round(is12786AuditData.summary.kg_20mm_cl2 * 100) / 100).toLocaleString()}</td>
                          <td className="py-3 px-2.5 text-right bg-amber-500/30 text-amber-100 border-r border-amber-500/40">{(Math.round(is12786AuditData.summary.total_kg * 100) / 100).toLocaleString()}</td>
                          <td className="py-3 px-3 text-right text-purple-300">₹{Math.round(is12786AuditData.summary.value).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedStandard === "is17425" && (
                <div className="overflow-x-auto max-h-[560px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider sticky top-0 z-20 border-b border-slate-800 font-bold">
                      <tr>
                        <th className="py-3 px-4 border-r border-slate-800/80">Month</th>
                        <th className="py-3 px-4 text-right border-r border-slate-800/80">75 MM(I) (Nos.)</th>
                        <th className="py-3 px-4 text-right border-r border-slate-800/80">75 MM(II) (Nos.)</th>
                        <th className="py-3 px-4 text-right border-r border-slate-800/80">90 MM(I) (Nos.)</th>
                        <th className="py-3 px-4 text-right font-extrabold text-slate-200 border-r border-slate-800/80 bg-slate-900/60">TOTAL (Nos.)</th>
                        <th className="py-3 px-4 text-right">Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-xs">
                      {is17425AuditData.rows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2 font-sans">
                              <AlertCircle className="w-8 h-8 text-slate-600" />
                              <span className="text-sm font-medium">No audit period dates configured</span>
                              <span className="text-xs text-slate-600">Please check selected renewal production date range and year above.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        is17425AuditData.rows.map((row) => (
                          <tr key={row.monthKey} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-4 font-sans font-bold text-slate-300 border-r border-slate-800/80">{row.monthLabel}</td>
                            <td className="py-2 px-4 text-right border-r border-slate-800/80 text-slate-300">{row.prod_75mm_cl1 ? row.prod_75mm_cl1.toLocaleString() : "—"}</td>
                            <td className="py-2 px-4 text-right border-r border-slate-800/80 text-slate-300">{row.prod_75mm_cl2 ? row.prod_75mm_cl2.toLocaleString() : "—"}</td>
                            <td className="py-2 px-4 text-right border-r border-slate-800/80 text-slate-300">{row.prod_90mm_cl1 ? row.prod_90mm_cl1.toLocaleString() : "—"}</td>
                            <td className="py-2 px-4 text-right font-bold text-indigo-300 border-r border-slate-800/80 bg-slate-900/40">{row.total_prod ? row.total_prod.toLocaleString() : "—"}</td>
                            <td className="py-2 px-4 text-right font-bold text-purple-300">{row.value ? `₹${Math.round(row.value).toLocaleString()}` : "—"}</td>
                          </tr>
                        ))
                      )}
                      {is17425AuditData.summary && (
                        <tr className="bg-slate-950 font-extrabold border-t-2 border-slate-700">
                          <td className="py-3 px-4 font-sans text-indigo-400 border-r border-slate-800/80">TOTAL</td>
                          <td className="py-3 px-4 text-right border-r border-slate-800/80 text-slate-100">{is17425AuditData.summary.prod_75mm_cl1.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right border-r border-slate-800/80 text-slate-100">{is17425AuditData.summary.prod_75mm_cl2.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right border-r border-slate-800/80 text-slate-100">{is17425AuditData.summary.prod_90mm_cl1.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-indigo-300 border-r border-slate-800/80 bg-slate-900/60">{is17425AuditData.summary.total_prod.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-purple-300">₹{Math.round(is17425AuditData.summary.value).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedStandard === "is13487" && (
                <div className="overflow-x-auto max-h-[560px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider sticky top-0 z-20 border-b border-slate-800 font-bold">
                      <tr>
                        <th className="py-3 px-4 border-r border-slate-800/80">Month</th>
                        <th className="py-3 px-3 text-right border-r border-slate-800/80">4 LPH (Nos.)</th>
                        <th className="py-3 px-3 text-right border-r border-slate-800/80">8 LPH (Nos.)</th>
                        <th className="py-3 px-3 text-right border-r border-slate-800/80">14 LPH (Nos.)</th>
                        <th className="py-3 px-3 text-right border-r border-slate-800/80">16 LPH (Nos.)</th>
                        <th className="py-3 px-3 text-right font-extrabold text-slate-200 border-r border-slate-800/80 bg-slate-900/60">Total Nos.</th>
                        <th className="py-3 px-3 text-right bg-amber-500/15 text-amber-300 border-r border-amber-500/20">Total in 1000 Unit</th>
                        <th className="py-3 px-4 text-right">Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-xs">
                      {is13487AuditData.rows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2 font-sans">
                              <AlertCircle className="w-8 h-8 text-slate-600" />
                              <span className="text-sm font-medium">No audit period dates configured</span>
                              <span className="text-xs text-slate-600">Please check selected renewal production date range and year above.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        is13487AuditData.rows.map((row) => (
                          <tr key={row.monthKey} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-4 font-sans font-bold text-slate-300 border-r border-slate-800/80">{row.monthLabel}</td>
                            <td className="py-2 px-3 text-right border-r border-slate-800/80 text-slate-300">{row.prod_4lph ? row.prod_4lph.toLocaleString() : "—"}</td>
                            <td className="py-2 px-3 text-right border-r border-slate-800/80 text-slate-300">{row.prod_8lph ? row.prod_8lph.toLocaleString() : "—"}</td>
                            <td className="py-2 px-3 text-right border-r border-slate-800/80 text-slate-300">{row.prod_14lph ? row.prod_14lph.toLocaleString() : "—"}</td>
                            <td className="py-2 px-3 text-right border-r border-slate-800/80 text-slate-300">{row.prod_16lph ? row.prod_16lph.toLocaleString() : "—"}</td>
                            <td className="py-2 px-3 text-right font-bold text-indigo-300 border-r border-slate-800/80 bg-slate-900/40">{row.total_prod ? row.total_prod.toLocaleString() : "—"}</td>
                            <td className="py-2 px-3 text-right font-extrabold bg-amber-500/15 text-amber-200 border-r border-amber-500/20">{row.unit_of_1000 ? row.unit_of_1000.toLocaleString() : "—"}</td>
                            <td className="py-2 px-4 text-right font-bold text-purple-300">{row.value ? `₹${Math.round(row.value).toLocaleString()}` : "—"}</td>
                          </tr>
                        ))
                      )}
                      {is13487AuditData.summary && (
                        <tr className="bg-slate-950 font-extrabold border-t-2 border-slate-700">
                          <td className="py-3 px-4 font-sans text-indigo-400 border-r border-slate-800/80">TOTAL</td>
                          <td className="py-3 px-3 text-right border-r border-slate-800/80 text-slate-100">{is13487AuditData.summary.prod_4lph.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right border-r border-slate-800/80 text-slate-100">{is13487AuditData.summary.prod_8lph.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right border-r border-slate-800/80 text-slate-100">{is13487AuditData.summary.prod_14lph.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right border-r border-slate-800/80 text-slate-100">{is13487AuditData.summary.prod_16lph.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right text-indigo-300 border-r border-slate-800/80 bg-slate-900/60">{is13487AuditData.summary.total_prod.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right bg-amber-500/25 text-amber-100 border-r border-amber-500/30">{is13487AuditData.summary.unit_of_1000.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-purple-300">₹{Math.round(is13487AuditData.summary.value).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedStandard === "is14483" && (
                <div className="overflow-x-auto max-h-[560px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider sticky top-0 z-20 border-b border-slate-800 font-bold">
                      <tr>
                        <th className="py-3 px-4 border-r border-slate-800/80">Month</th>
                        <th className="py-3 px-4 text-right border-r border-slate-800/80">2"(50MM) (Nos.)</th>
                        <th className="py-3 px-4 text-right border-r border-slate-800/80">1"(25MM) (Nos.)</th>
                        <th className="py-3 px-4 text-right font-extrabold text-slate-200 border-r border-slate-800/80 bg-slate-900/60">TOTAL (Nos.)</th>
                        <th className="py-3 px-4 text-right">Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-xs">
                      {is14483AuditData.rows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2 font-sans">
                              <AlertCircle className="w-8 h-8 text-slate-600" />
                              <span className="text-sm font-medium">No audit period dates configured</span>
                              <span className="text-xs text-slate-600">Please check selected renewal production date range and year above.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        is14483AuditData.rows.map((row) => (
                          <tr key={row.monthKey} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-4 font-sans font-bold text-slate-300 border-r border-slate-800/80">{row.monthLabel}</td>
                            <td className="py-2 px-4 text-right border-r border-slate-800/80 text-slate-300">{row.prod_2inch ? row.prod_2inch.toLocaleString() : "—"}</td>
                            <td className="py-2 px-4 text-right border-r border-slate-800/80 text-slate-300">{row.prod_1inch ? row.prod_1inch.toLocaleString() : "—"}</td>
                            <td className="py-2 px-4 text-right font-bold text-indigo-300 border-r border-slate-800/80 bg-slate-900/40">{row.total_prod ? row.total_prod.toLocaleString() : "—"}</td>
                            <td className="py-2 px-4 text-right font-bold text-purple-300">{row.value ? `₹${Math.round(row.value).toLocaleString()}` : "—"}</td>
                          </tr>
                        ))
                      )}
                      {is14483AuditData.summary && (
                        <tr className="bg-slate-950 font-extrabold border-t-2 border-slate-700">
                          <td className="py-3 px-4 font-sans text-indigo-400 border-r border-slate-800/80">TOTAL</td>
                          <td className="py-3 px-4 text-right border-r border-slate-800/80 text-slate-100">{is14483AuditData.summary.prod_2inch.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right border-r border-slate-800/80 text-slate-100">{is14483AuditData.summary.prod_1inch.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-indigo-300 border-r border-slate-800/80 bg-slate-900/60">{is14483AuditData.summary.total_prod.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-purple-300">₹{Math.round(is14483AuditData.summary.value).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedStandard === "is4985" && (
                <div className="overflow-x-auto max-h-[560px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider sticky top-0 z-20 border-b border-slate-800 font-bold">
                      <tr>
                        <th className="py-3 px-2 border-r border-slate-800/80 text-center">SR.NO</th>
                        <th className="py-3 px-3 border-r border-slate-800/80">MONTH</th>
                        {exportSizesConfig.is4985.map(opt => (
                          <th key={opt.id} className="py-3 px-2 text-right border-r border-slate-800/80">{opt.label}</th>
                        ))}
                        {exportSizesConfig.is4985.map(opt => (
                          <th key={`wt_${opt.id}`} className="py-3 px-2 text-right bg-amber-500/15 text-amber-300 border-r border-amber-500/20">{opt.label.replace("(Pipe)", "wt.").replace(" Cl-", " wt. Cl-")}</th>
                        ))}
                        <th className="py-3 px-2.5 text-right font-extrabold bg-amber-500/25 text-amber-200 border-r border-amber-500/30">total wt.</th>
                        <th className="py-3 px-2.5 text-right font-extrabold bg-indigo-500/20 text-indigo-200 border-r border-slate-800/80">QTY (tons)</th>
                        <th className="py-3 px-3 text-right">Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-xs">
                      {is4985AuditData.rows.length === 0 ? (
                        <tr>
                          <td colSpan={exportSizesConfig.is4985.length * 2 + 5} className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2 font-sans">
                              <AlertCircle className="w-8 h-8 text-slate-600" />
                              <span className="text-sm font-medium">No audit period dates configured</span>
                              <span className="text-xs text-slate-600">Please check selected renewal production date range and year above.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        is4985AuditData.rows.map((row) => (
                          <tr key={row.monthKey} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-2 text-center text-slate-400 font-sans border-r border-slate-800/80">{row.srNo}</td>
                            <td className="py-2 px-3 font-sans font-bold text-slate-300 border-r border-slate-800/80">{row.monthLabel}</td>
                            {exportSizesConfig.is4985.map(opt => {
                              const val = row[opt.id] || 0;
                              return (
                                <td key={opt.id} className="py-2 px-2 text-right border-r border-slate-800/80 text-slate-300">
                                  {val ? val.toLocaleString() : "—"}
                                </td>
                              );
                            })}
                            {exportSizesConfig.is4985.map(opt => {
                              const wtKey = opt.id.replace("pipe_", "wt_");
                              const wtVal = row[wtKey] || 0;
                              return (
                                <td key={wtKey} className="py-2 px-2 text-right bg-amber-500/10 text-amber-200 border-r border-amber-500/20">
                                  {wtVal ? (Math.round(wtVal * 100) / 100).toLocaleString() : "—"}
                                </td>
                              );
                            })}
                            <td className="py-2 px-2.5 text-right font-extrabold bg-amber-500/20 text-amber-100 border-r border-amber-500/30">{row.total_wt ? (Math.round(row.total_wt * 100) / 100).toLocaleString() : "—"}</td>
                            <td className="py-2 px-2.5 text-right font-bold bg-indigo-500/15 text-indigo-200 border-r border-slate-800/80">{row.qty_tons ? row.qty_tons.toLocaleString() : "—"}</td>
                            <td className="py-2 px-3 text-right font-bold text-purple-300">{row.value ? `₹${Math.round(row.value).toLocaleString()}` : "—"}</td>
                          </tr>
                        ))
                      )}
                      {is4985AuditData.summary && (
                        <tr className="bg-slate-950 font-extrabold border-t-2 border-slate-700">
                          <td className="py-3 px-2 border-r border-slate-800/80"></td>
                          <td className="py-3 px-3 font-sans text-indigo-400 border-r border-slate-800/80">TOTAL</td>
                          {exportSizesConfig.is4985.map(opt => {
                            const val = is4985AuditData.summary[opt.id] || 0;
                            return (
                              <td key={opt.id} className="py-3 px-2 text-right border-r border-slate-800/80 text-slate-100">
                                {val.toLocaleString()}
                              </td>
                            );
                          })}
                          {exportSizesConfig.is4985.map(opt => {
                            const wtKey = opt.id.replace("pipe_", "wt_");
                            const wtVal = is4985AuditData.summary[wtKey] || 0;
                            return (
                              <td key={wtKey} className="py-3 px-2 text-right bg-amber-500/20 text-amber-200 border-r border-amber-500/20">
                                {(Math.round(wtVal * 100) / 100).toLocaleString()}
                              </td>
                            );
                          })}
                          <td className="py-3 px-2.5 text-right bg-amber-500/30 text-amber-100 border-r border-amber-500/40">{(Math.round(is4985AuditData.summary.total_wt * 100) / 100).toLocaleString()}</td>
                          <td className="py-3 px-2.5 text-right bg-indigo-500/25 text-indigo-100 border-r border-slate-800/80">{is4985AuditData.summary.qty_tons.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right text-purple-300">₹{Math.round(is4985AuditData.summary.value).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider sticky top-0 z-20 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">#</th>
                    <th className="py-3 px-4">Production Date</th>
                    <th className="py-3 px-4">Size / Rating Class</th>
                    <th className="py-3 px-4 text-right">Manufactured Qty</th>
                    <th className="py-3 px-4">Unit of Measure</th>
                    <th className="py-3 px-4 text-right">Weight (Kg)</th>
                    <th className="py-3 px-4 text-right">Value (₹)</th>
                    <th className="py-3 px-4">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle className="w-8 h-8 text-slate-600" />
                          <span className="text-sm font-medium">No production data found for this selection</span>
                          <span className="text-xs text-slate-600">Import or record production entries inside {currentStandardObj.code} module.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, index) => {
                      let uom = "Mtrs";
                      let qty = row.mtr || 0;
                      if (selectedStandard === "is4985" || selectedStandard === "is17425") {
                        uom = "Pipes / Nos";
                        qty = row.pipe || row.nos || 0;
                      } else if (selectedStandard === "is13487") {
                        uom = "Thousand Units";
                        qty = row.thousandUnit || row.nos || 0;
                      } else if (selectedStandard === "is14483") {
                        uom = "Nos";
                        qty = row.nos || 0;
                      }

                      const weight = row.kg ? row.kg : (row.tonn ? row.tonn * 1000 : Math.round(qty * 0.15 * 100) / 100);

                      return (
                        <tr key={row.id || index} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 text-center font-mono text-slate-500">{index + 1}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-300">{row.date}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">
                              {row.size}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-100">
                            {qty.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400">{uom}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-amber-300/90">
                            {weight.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-purple-300/90">
                            {row.value ? `₹${row.value.toLocaleString()}` : "—"}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                              <CheckCircle2 className="w-3 h-3" />
                              BIS Compliant
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Required Format Information Box */}
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                Next Step: Customizing Required License Formats
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                The navigation tab <strong className="text-indigo-300">Renewal Data</strong> is now live on the navbar. We have structured this production-based renewal audit dashboard for all 6 IS standards. Please let us know the exact required format specifications (column order, headers, or formulas) for each standard so we can fine-tune the Excel export layout!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Wizard Modal */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent className="sm:max-w-xl bg-slate-950 border border-slate-800 text-slate-100 p-6 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <div className="flex items-center gap-2 text-indigo-400">
              <Filter className="w-5 h-5" />
              <DialogTitle className="text-lg font-bold text-slate-100">
                Export Renewal Format Wizard
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Select sizes to include in the exported Excel statement for <strong className="text-indigo-300">{currentStandardObj.code}</strong>. Verify conversion weights required for weight calculation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 flex-1 overflow-y-auto pr-2 min-h-0 custom-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 sticky top-0 bg-slate-950/95 z-10 py-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Available Sizes ({exportSizesConfig[selectedStandard]?.length || 0})
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-slate-900 px-2"
                  onClick={() => setWizardSelectedSizes((exportSizesConfig[selectedStandard] || []).map(o => o.id))}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-900 px-2"
                  onClick={() => setWizardSelectedSizes([])}
                >
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="space-y-2.5">
              {(exportSizesConfig[selectedStandard] || []).map((option) => {
                const isChecked = wizardSelectedSizes.includes(option.id);
                const convVal = inlineConversions[option.id] || "";
                const isMissingConv = option.requireConv && isChecked && (!convVal || Number(convVal) <= 0);

                return (
                  <div
                    key={option.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                      isChecked
                        ? isMissingConv
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-100"
                          : "bg-indigo-500/10 border-indigo-500/30 text-slate-100"
                        : "bg-slate-900/40 border-slate-800/80 text-slate-400 opacity-60"
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWizardSelectedSizes(prev => [...prev, option.id]);
                          } else {
                            setWizardSelectedSizes(prev => prev.filter(id => id !== option.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer"
                      />
                      <span className="text-xs font-bold font-mono tracking-wide">
                        {option.label}
                      </span>
                    </label>

                    {option.requireConv && (
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-[11px] text-slate-400 font-mono">
                          Conv (Kg/Unit):
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={convVal}
                          placeholder="e.g. 0.055"
                          onChange={(e) => {
                            const newVal = e.target.value;
                            setInlineConversions(prev => ({ ...prev, [option.id]: newVal }));
                            if (option.convKey && newVal) {
                              localStorage.setItem(option.convKey, newVal);
                            }
                          }}
                          className={`w-24 h-7 text-xs font-mono text-right rounded border px-2 focus:outline-none focus:ring-1 ${
                            isMissingConv
                              ? "bg-amber-950/80 border-amber-500 text-amber-200 focus:ring-amber-400"
                              : "bg-slate-900 border-slate-700 text-slate-100 focus:ring-indigo-500"
                          }`}
                        />
                        {isMissingConv && (
                          <span
                            title="Conversion factor required to compute total weight"
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Warning if missing conversions on checked sizes */}
            {wizardSelectedSizes.some(szId => {
              const opt = (exportSizesConfig[selectedStandard] || []).find(o => o.id === szId);
              if (!opt || !opt.requireConv) return false;
              const val = inlineConversions[szId] || "";
              return !val || Number(val) <= 0;
            }) && (
              <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-start gap-2.5 text-amber-200 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Missing Conversion Factors:</span> One or more selected sizes are missing a valid conversion weight (&gt; 0). Please enter conversion factors above before exporting so that accurate weight calculations can be generated in your Excel report.
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-800/80 pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWizardOpen(false)}
              className="w-full sm:w-auto border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={
                wizardSelectedSizes.length === 0 ||
                wizardSelectedSizes.some(szId => {
                  const opt = (exportSizesConfig[selectedStandard] || []).find(o => o.id === szId);
                  if (!opt || !opt.requireConv) return false;
                  const val = inlineConversions[szId] || "";
                  return !val || Number(val) <= 0;
                })
              }
              onClick={() => handleConfirmExport(wizardSelectedSizes)}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Proceed & Export Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

