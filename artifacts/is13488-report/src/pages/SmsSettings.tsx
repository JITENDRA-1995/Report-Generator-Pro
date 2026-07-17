import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { defaultConsignees } from "@/lib/defaultConsignees";
import { supabase } from "@/lib/supabase";
import * as smsStorage from "@/lib/smsStorage";
import { 
  Settings, 
  Sliders, 
  Database, 
  RefreshCw, 
  KeyRound, 
  Trash2, 
  Download, 
  Upload, 
  Plus, 
  Edit2, 
  Check, 
  X,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  Eye,
  Table,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import XLSXStyle from "xlsx-js-style";
import { applyWorksheetTableStyle } from "@/lib/excelHelper";

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

export const defaultConversionsData: Record<string, string> = {
  "sms_conv_value_is12786_20mm Cl-1": "140",
  "sms_conv_weight_is4985_75mm Cl-2": "3.9",
  "sms_conv_value_is4985_90mm Cl-2": "86000",
  "sms_conv_value_is13487_14 LPH": "1250",
  "sms_conv_value_is12786_16mm Cl-1": "140",
  "sms_conv_value_is13488_20mm Cl-1": "200",
  "sms_conv_value_is17425_90mm Cl-1": "360",
  "sms_conv_value_is4985_160mm Cl-2": "86000",
  "sms_conv_weight_is13488_12mm Cl-2": "0.024",
  "sms_conv_weight_is12786_32mm Cl-2": "0.185",
  "sms_conv_weight_is4985_63mm Cl-2": "2.9",
  "sms_conv_value_is17425_75mm Cl-1": "360",
  "sms_conv_value_is17425_75mm Cl-2": "360",
  "sms_conv_value_is13488_16mm Cl-2": "200",
  "sms_conv_weight_is13488_16mm Cl-2": "0.037",
  "sms_conv_weight_is4985_110mm Cl-2": "7.8",
  "sms_conv_weight_is4985_140mm Cl-2": "13",
  "sms_conv_value_is4985_140mm Cl-3": "86000",
  "sms_conv_weight_is12786_20mm Cl-2": "0.069",
  "sms_conv_value_is12786_12mm Cl-2": "140",
  "sms_conv_value_is13487_4 LPH": "1250",
  "sms_conv_value_is4985_140mm Cl-2": "86000",
  "sms_conv_weight_is4985_160mm Cl-2": "17",
  "sms_conv_value_is13488_12mm Cl-2": "200",
  "sms_conv_weight_is12786_12mm Cl-2": "0.031",
  "sms_conv_value_is4985_63mm Cl-2": "86000",
  "sms_conv_weight_is12786_16mm Cl-2": "0.052",
  "sms_conv_value_is4985_75mm Cl-2": "86000",
  "sms_conv_weight_is13488_20mm Cl-1": "0.042",
  "sms_conv_value_is14483_V-2\" (50mm)": "1650",
  "sms_conv_value_is13487_8 LPH": "1250",
  "sms_conv_weight_is13488_16mm CL-1": "0.026",
  "sms_conv_value_is14483_V-1\" (25mm)": "850",
  "sms_conv_weight_is4985_90mm Cl-2": "5.5",
  "sms_conv_weight_is12786_16mm Cl-1": "0.04",
  "sms_conv_value_is12786_32mm Cl-2": "140",
  "sms_conv_weight_is12786_20mm Cl-1": "0.055",
  "sms_conv_value_is4985_110mm Cl-2": "86000",
  "sms_conv_value_is13488_16mm CL-1": "200",
  "sms_conv_value_is12786_16mm Cl-2": "140",
  "sms_conv_weight_is4985_140mm Cl-3": "18.7",
  "sms_conv_value_is12786_20mm Cl-2": "140"
};

export const initializeDefaultConversions = (force = false) => {
  let hasConversions = false;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("sms_conv_")) {
      hasConversions = true;
      break;
    }
  }

  if (force || !hasConversions) {
    Object.keys(defaultConversionsData).forEach((key) => {
      localStorage.setItem(key, defaultConversionsData[key]);
    });
  }
};


interface OverrideStockItem {
  key: string;
  standardId: string;
  sizeName: string;
  year?: string;
  month?: string;
  value: number;
  type: "monthly" | "global";
}

interface ConversionItem {
  standardId: string;
  sizeName: string;
  weight: number;
  value: number;
}

export interface ConsigneeDetails {
  id?: string;
  name: string;
  address?: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  telephone?: string;
  mobile?: string;
  email?: string;
  lookFor?: string;
}

export default function SmsSettings() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overrides" | "conversions" | "data" | "maintenance" | "consignees">("overrides");
  const [overrides, setOverrides] = useState<OverrideStockItem[]>([]);
  
  // Consignee states
  const [consigneesList, setConsigneesList] = useState<ConsigneeDetails[]>([]);
  const [showConsigneePreviewModal, setShowConsigneePreviewModal] = useState<boolean>(false);
  const [consigneeImportBanner, setConsigneeImportBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Consignee registration states
  const [newConsigneeName, setNewConsigneeName] = useState<string>("");
  const [newConsigneeAddress, setNewConsigneeAddress] = useState<string>("");
  const [newConsigneeCountry, setNewConsigneeCountry] = useState<string>("India");
  const [newConsigneeState, setNewConsigneeState] = useState<string>("");
  const [newConsigneeDistrict, setNewConsigneeDistrict] = useState<string>("");
  const [newConsigneeCity, setNewConsigneeCity] = useState<string>("");
  const [newConsigneePincode, setNewConsigneePincode] = useState<string>("");
  const [newConsigneeTelephone, setNewConsigneeTelephone] = useState<string>("");
  const [newConsigneeMobile, setNewConsigneeMobile] = useState<string>("");
  const [newConsigneeEmail, setNewConsigneeEmail] = useState<string>("");
  const [newConsigneeLookFor, setNewConsigneeLookFor] = useState<string>("");

  const [editingConsigneeIdx, setEditingConsigneeIdx] = useState<number | null>(null);
  const [editingConsigneeVal, setEditingConsigneeVal] = useState<ConsigneeDetails | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  
  // Add new override states
  const [newStd, setNewStd] = useState<string>("is13488");
  const [newSize, setNewSize] = useState<string>("");
  const [newType, setNewType] = useState<"monthly" | "global">("monthly");
  const [newYear, setNewYear] = useState<string>("2026");
  const [newMonth, setNewMonth] = useState<string>("January");
  const [newValue, setNewValue] = useState<string>("");
  const [addError, setAddError] = useState<string>("");

  // Add new conversion states
  const [conversions, setConversions] = useState<ConversionItem[]>([]);
  const [convStd, setConvStd] = useState<string>("is13488");
  const [convSize, setConvSize] = useState<string>("");
  const [convWeight, setConvWeight] = useState<string>("");
  const [convValue, setConvValue] = useState<string>("");
  const [editingConvKey, setEditingConvKey] = useState<string | null>(null); // format: std_size
  const [editingConvWeight, setEditingConvWeight] = useState<string>("");
  const [editingConvValue, setEditingConvValue] = useState<string>("");
  const [convError, setConvError] = useState<string>("");

  // Confirmation Modal states
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: () => void;
    destructive: boolean;
  } | null>(null);

  // Import states
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [convImportStatus, setConvImportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [clearConsigneeStd, setClearConsigneeStd] = useState<string>("all");

  // Load active size list when standard changes
  useEffect(() => {
    const sizes = standardSizes[newStd] || [];
    if (sizes.length > 0) {
      setNewSize(sizes[0]);
    }
  }, [newStd]);

  // Load active size list for conversions standard
  useEffect(() => {
    const sizes = standardSizes[convStd] || [];
    if (sizes.length > 0) {
      setConvSize(sizes[0]);
    }
  }, [convStd]);

  // Load all overrides from localStorage
  const loadOverrides = () => {
    const items: OverrideStockItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sms_last_stock_")) {
        const parts = key.split("_");
        // Format: sms_last_stock_[id]_[size]_[year]_[month] OR sms_last_stock_[id]_[size]
        // parts[0]: sms, parts[1]: last, parts[2]: stock, parts[3]: id, parts[4]: size
        // If length is 5, it's global fallback
        // If length is 7, parts[5] is year, parts[6] is month
        
        const standardId = parts[3];
        const val = Number(localStorage.getItem(key)) || 0;

        if (parts.length === 5) {
          const sizeName = parts[4];
          items.push({
            key,
            standardId,
            sizeName,
            value: val,
            type: "global"
          });
        } else if (parts.length === 7) {
          const sizeName = parts[4];
          const year = parts[5];
          const month = parts[6];
          items.push({
            key,
            standardId,
            sizeName,
            year,
            month,
            value: val,
            type: "monthly"
          });
        }
      }
    }
    setOverrides(items.sort((a, b) => a.key.localeCompare(b.key)));
  };

  // Load all conversions from localStorage
  const loadConversions = () => {
    const map = new Map<string, ConversionItem>();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("sms_conv_weight_") || key.startsWith("sms_conv_value_"))) {
        const parts = key.split("_");
        // Format: sms_conv_[type]_[id]_[size]
        const type = parts[2]; // "weight" or "value"
        const standardId = parts[3];
        const sizeName = parts[4];
        const mapKey = `${standardId}_${sizeName}`;
        const val = Number(localStorage.getItem(key)) || 0;

        if (!map.has(mapKey)) {
          map.set(mapKey, {
            standardId,
            sizeName,
            weight: 0,
            value: 0
          });
        }

        const item = map.get(mapKey)!;
        if (type === "weight") {
          item.weight = val;
        } else if (type === "value") {
          item.value = val;
        }
      }
    }
    setConversions(Array.from(map.values()).sort((a, b) => a.standardId.localeCompare(b.standardId) || a.sizeName.localeCompare(b.sizeName)));
  };

  const loadConsigneesList = async () => {
    // Load local list (combined defaults + custom) first
    const localList = smsStorage.getLocalConsignees();
    setConsigneesList(localList);

    try {
      // Sync and retrieve updated list from cloud
      const cloudList = await smsStorage.syncConsigneesFromCloud();
      setConsigneesList(cloudList);
    } catch (err) {
      console.error("Failed to sync consignees list from cloud:", err);
    }
  };

  useEffect(() => {
    initializeDefaultConversions();
    loadOverrides();
    loadConversions();
    loadConsigneesList();
    cleanupLegacyImportedConsigneeData();
  }, []);

  const handleDownloadConsigneeTemplate = () => {
    const headers = ["Consignee Name", "Address", "City", "District", "State", "Country", "Pincode", "Telephone", "Mobile", "Email", "Look For"];
    const ws = XLSX.utils.json_to_sheet([], { header: headers });
    const widths = [
      { wch: 24 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
      { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 24 }, { wch: 28 }
    ];
    ws["!cols"] = widths;
    applyWorksheetTableStyle(ws, widths);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consignees_Template");
    XLSXStyle.writeFile(wb, "SMS_Consignee_Master_Template.xlsx");
  };

  const handleImportConsigneesExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) {
          setConsigneeImportBanner({ type: "error", message: "No worksheet found in file." });
          return;
        }

        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        if (rows.length === 0) {
          setConsigneeImportBanner({ type: "error", message: "Uploaded sheet has no data rows." });
          return;
        }

        let addedCount = 0;
        let updatedCount = 0;
        const currentList = [...consigneesList];

        rows.forEach((row) => {
          const nameVal = String(row["Consignee Name"] || row["Name"] || row["consignee_name"] || "").trim();
          if (!nameVal) return;

          const existingIdx = currentList.findIndex(c => c.name.toLowerCase() === nameVal.toLowerCase());
          const newObj: ConsigneeDetails = {
            name: nameVal,
            address: String(row["Address"] || "").trim(),
            city: String(row["City"] || "").trim(),
            district: String(row["District"] || "").trim(),
            state: String(row["State"] || "").trim(),
            country: String(row["Country"] || "India").trim(),
            pincode: String(row["Pincode"] || "").trim(),
            telephone: String(row["Telephone"] || "").trim(),
            mobile: String(row["Mobile"] || "").trim(),
            email: String(row["Email"] || "").trim(),
            lookFor: String(row["Look For"] || row["Alias"] || "").trim()
          };

          if (existingIdx >= 0) {
            currentList[existingIdx] = { ...currentList[existingIdx], ...newObj };
            updatedCount++;
          } else {
            currentList.push(newObj);
            addedCount++;
          }
          smsStorage.saveConsignee(newObj);
        });

        const sorted = currentList.sort((a, b) => a.name.localeCompare(b.name));
        setConsigneesList(sorted);
        setConsigneeImportBanner({
          type: "success",
          message: `Successfully processed file! Added ${addedCount} new and updated ${updatedCount} existing consignees.`
        });
        if (e.target) e.target.value = "";
      } catch (err: any) {
        setConsigneeImportBanner({ type: "error", message: `Error reading file: ${err?.message || String(err)}` });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddConsignee = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newConsigneeName.trim();
    if (!trimmedName) return;

    if (consigneesList.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert("Consignee with this name already exists.");
      return;
    }

    const newConsigneeObj: any = {
      id: Math.random().toString(36).substring(2, 9),
      name: trimmedName,
      address: newConsigneeAddress.trim(),
      country: newConsigneeCountry.trim(),
      state: newConsigneeState.trim(),
      district: newConsigneeDistrict.trim(),
      city: newConsigneeCity.trim(),
      pincode: newConsigneePincode.trim(),
      telephone: newConsigneeTelephone.trim(),
      mobile: newConsigneeMobile.trim(),
      email: newConsigneeEmail.trim(),
      lookFor: newConsigneeLookFor.trim()
    };

    const updated = [...consigneesList, newConsigneeObj].sort((a, b) => a.name.localeCompare(b.name));
    setConsigneesList(updated);
    smsStorage.saveConsignee(newConsigneeObj);

    // Reset inputs
    setNewConsigneeName("");
    setNewConsigneeAddress("");
    setNewConsigneeCountry("India");
    setNewConsigneeState("");
    setNewConsigneeDistrict("");
    setNewConsigneeCity("");
    setNewConsigneePincode("");
    setNewConsigneeTelephone("");
    setNewConsigneeMobile("");
    setNewConsigneeEmail("");
    setNewConsigneeLookFor("");
  };

  const handleSaveConsigneeEdit = (index: number) => {
    if (!editingConsigneeVal) return;
    const trimmedName = editingConsigneeVal.name.trim();
    if (!trimmedName) return;

    const updated = [...consigneesList];
    updated[index] = {
      ...editingConsigneeVal,
      name: trimmedName,
      address: (editingConsigneeVal.address || "").trim(),
      country: (editingConsigneeVal.country || "").trim(),
      state: (editingConsigneeVal.state || "").trim(),
      district: (editingConsigneeVal.district || "").trim(),
      city: (editingConsigneeVal.city || "").trim(),
      pincode: (editingConsigneeVal.pincode || "").trim(),
      telephone: (editingConsigneeVal.telephone || "").trim(),
      mobile: (editingConsigneeVal.mobile || "").trim(),
      email: (editingConsigneeVal.email || "").trim(),
      lookFor: (editingConsigneeVal.lookFor || "").trim()
    };

    updated.sort((a, b) => a.name.localeCompare(b.name));
    setConsigneesList(updated);
    smsStorage.saveConsignee(updated[index]);
    setEditingConsigneeIdx(null);
    setEditingConsigneeVal(null);
  };

  const handleDeleteConsignee = (name: string) => {
    setConfirmModal({
      show: true,
      title: "Delete Consignee?",
      message: `Are you sure you want to delete "${name}" from your registered consignee list?`,
      destructive: true,
      action: () => {
        const updated = consigneesList.filter(n => n.name !== name);
        const deletedObj = consigneesList.find(n => n.name === name);
        setConsigneesList(updated);
        if (deletedObj) {
          smsStorage.deleteConsignee(deletedObj.id || "", deletedObj.name);
        }
        setConfirmModal(null);
      }
    });
  };

  const saveStartingStockKey = async (key: string, val: number) => {
    localStorage.setItem(key, val.toString());
    if (smsStorage.isCloudEnabled()) {
      const parts = key.split("_");
      if (parts.length >= 4) {
        const stdId = parts[3];
        let size = "";
        let year = 2026;
        let month = "January";
        if (parts.length >= 7) {
          month = parts[parts.length - 1];
          year = Number(parts[parts.length - 2]);
          size = parts.slice(4, parts.length - 2).join("_");
        } else {
          size = parts.slice(4).join("_");
          year = 0;
          month = "Global";
        }
        try {
          await supabase.from("sms_starting_stocks").upsert({
            id: key,
            standard_id: stdId,
            size: size,
            year: year,
            month: month,
            val: val,
            updated_at: new Date().toISOString()
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const deleteStartingStockKey = async (key: string) => {
    localStorage.removeItem(key);
    if (smsStorage.isCloudEnabled()) {
      try {
        await supabase.from("sms_starting_stocks").delete().eq("id", key);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const saveConversionSetting = async (stdId: string, key: string, val: string) => {
    localStorage.setItem(key, val);
    if (smsStorage.isCloudEnabled()) {
      try {
        await supabase.from("sms_conversion_settings").upsert({
          id: key,
          standard_id: stdId,
          key: key,
          val: val,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const deleteConversionSetting = async (key: string) => {
    localStorage.removeItem(key);
    if (smsStorage.isCloudEnabled()) {
      try {
        await supabase.from("sms_conversion_settings").delete().eq("id", key);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Update an existing override
  const handleSaveEdit = async (key: string) => {
    const valNum = Number(editingValue);
    if (isNaN(valNum) || valNum < 0) {
      alert("Please enter a valid positive number.");
      return;
    }
    await saveStartingStockKey(key, valNum);
    setEditingKey(null);
    loadOverrides();
  };

  // Delete an override
  const handleDeleteOverride = (key: string) => {
    setConfirmModal({
      show: true,
      title: "Delete Stock Override?",
      message: `Are you sure you want to delete the starting stock override for "${key.replace("sms_last_stock_", "")}"? The system will fallback to 0 or its global configuration.`,
      destructive: true,
      action: async () => {
        await deleteStartingStockKey(key);
        loadOverrides();
        setConfirmModal(null);
      }
    });
  };

  // Create a new override
  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    const valNum = Number(newValue);
    if (isNaN(valNum) || valNum < 0) {
      setAddError("Please enter a valid positive stock value.");
      return;
    }

    let key = "";
    if (newType === "global") {
      key = `sms_last_stock_${newStd}_${newSize}`;
    } else {
      key = `sms_last_stock_${newStd}_${newSize}_${newYear}_${newMonth}`;
    }

    if (localStorage.getItem(key) !== null) {
      setAddError("An override key already exists for this configuration. Edit the existing value below instead.");
      return;
    }

    await saveStartingStockKey(key, valNum);
    setNewValue("");
    loadOverrides();
  };

  // Create or Update conversion factors
  const handleAddConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    setConvError("");
    
    const weightNum = Number(convWeight);
    const valueNum = Number(convValue);

    if (convWeight && (isNaN(weightNum) || weightNum < 0)) {
      setConvError("Weight must be a valid positive number.");
      return;
    }
    if (convValue && (isNaN(valueNum) || valueNum < 0)) {
      setConvError("Standard value must be a valid positive number.");
      return;
    }

    const weightKey = `sms_conv_weight_${convStd}_${convSize}`;
    const valueKey = `sms_conv_value_${convStd}_${convSize}`;

    if (convWeight) {
      await saveConversionSetting(convStd, weightKey, weightNum.toString());
    } else {
      await deleteConversionSetting(weightKey);
    }

    if (convValue) {
      await saveConversionSetting(convStd, valueKey, valueNum.toString());
    } else {
      await deleteConversionSetting(valueKey);
    }

    setConvWeight("");
    setConvValue("");
    loadConversions();
  };

  // Save inline edits for conversion rates
  const handleSaveConvEdit = async (standardId: string, sizeName: string) => {
    const weightNum = Number(editingConvWeight);
    const valueNum = Number(editingConvValue);

    if (isNaN(weightNum) || weightNum < 0 || isNaN(valueNum) || valueNum < 0) {
      alert("Please enter valid positive numbers.");
      return;
    }

    const weightKey = `sms_conv_weight_${standardId}_${sizeName}`;
    const valueKey = `sms_conv_value_${standardId}_${sizeName}`;

    if (weightNum > 0) {
      await saveConversionSetting(standardId, weightKey, weightNum.toString());
    } else {
      await deleteConversionSetting(weightKey);
    }

    if (valueNum > 0) {
      await saveConversionSetting(standardId, valueKey, valueNum.toString());
    } else {
      await deleteConversionSetting(valueKey);
    }

    setEditingConvKey(null);
    loadConversions();
  };

  // Delete conversion rates
  const handleDeleteConversion = (standardId: string, sizeName: string) => {
    setConfirmModal({
      show: true,
      title: "Delete Conversion Rates?",
      message: `Are you sure you want to delete configured conversion rates (weight and standard value) for size "${sizeName}"? production logs for this size will return to manual typing mode.`,
      destructive: true,
      action: async () => {
        await deleteConversionSetting(`sms_conv_weight_${standardId}_${sizeName}`);
        await deleteConversionSetting(`sms_conv_value_${standardId}_${sizeName}`);
        loadConversions();
        setConfirmModal(null);
      }
    });
  };

  // Export ONLY Auto-Calculation Conversion rates
  const handleExportConversions = () => {
    const backupData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sms_conv_")) {
        backupData[key] = localStorage.getItem(key) || "";
      }
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SMS_Conversion_Rates_Backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import ONLY Auto-Calculation Conversion rates
  const handleImportConversions = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConvImportStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (typeof json !== "object" || json === null) {
          throw new Error("Invalid format");
        }

        // Apply backup to localStorage
        let importCount = 0;
        Object.keys(json).forEach((key) => {
          if (key.startsWith("sms_conv_")) {
            localStorage.setItem(key, json[key]);
            importCount++;
          }
        });

        if (importCount === 0) {
          setConvImportStatus({ type: "error", message: "No conversion settings keys found in the backup file." });
        } else {
          setConvImportStatus({ type: "success", message: `Successfully loaded and merged ${importCount} rate settings!` });
          loadConversions();
        }
      } catch (err) {
        setConvImportStatus({ type: "error", message: "Failed to parse file. Make sure it is a valid conversion settings JSON backup." });
      }
    };
    reader.readAsText(file);
  };

  // Export SMS Backup to JSON
  const handleExportBackup = () => {
    const backupData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith("sms_prod_") || 
        key.startsWith("sms_disp_") || 
        key.startsWith("sms_last_stock_") ||
        key.startsWith("sms_stock_") ||
        key.startsWith("sms_conv_")
      )) {
        backupData[key] = localStorage.getItem(key) || "";
      }
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SMS_Preservation_Backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import SMS Backup from JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (typeof json !== "object" || json === null) {
          throw new Error("Invalid format");
        }

        // Apply backup to localStorage
        Object.keys(json).forEach((key) => {
          if (
            key.startsWith("sms_prod_") || 
            key.startsWith("sms_disp_") || 
            key.startsWith("sms_last_stock_") ||
            key.startsWith("sms_stock_") ||
            key.startsWith("sms_conv_")
          ) {
            localStorage.setItem(key, json[key]);
          }
        });

        setImportStatus({ type: "success", message: "Data backup successfully loaded and merged!" });
        loadOverrides();
        loadConversions();
      } catch (err) {
        setImportStatus({ type: "error", message: "Failed to parse file. Make sure it is a valid SMS settings JSON backup." });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Destructive Maintenance Actions
  const handleClearStandardData = (standardId: string, clearType: "prod" | "disp" | "stocks" | "conv") => {
    const stdName = smsStandards[standardId]?.name || standardId;
    const typeLabel = clearType === "prod" ? "Production Sheets" : clearType === "disp" ? "Dispatch Sheets" : clearType === "stocks" ? "Starting Stocks" : "Conversion Rates";
    const storagePrefix = clearType === "prod" ? `sms_prod_${standardId}` : clearType === "disp" ? `sms_disp_${standardId}` : clearType === "stocks" ? `sms_last_stock_${standardId}` : `sms_conv_`;

    setConfirmModal({
      show: true,
      title: `Clear ${typeLabel} for ${stdName}?`,
      message: `CAUTION: This will delete ALL local and cloud entries of type "${typeLabel}" for ${stdName}. This operation cannot be undone!`,
      destructive: true,
      action: async () => {
        if (clearType === "stocks" || clearType === "conv") {
          // Remove all starting stocks or conversions matching prefix for this standard
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(storagePrefix) && key.includes(`_${standardId}_`)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
          
          if (smsStorage.isCloudEnabled()) {
            try {
              if (clearType === "stocks") {
                const { error } = await supabase
                  .from("sms_starting_stocks")
                  .delete()
                  .eq("standard_id", standardId);
                if (error) console.error("Error clearing starting stocks from Supabase:", error);
              } else {
                const { error } = await supabase
                  .from("sms_conversion_settings")
                  .delete()
                  .eq("standard_id", standardId);
                if (error) console.error("Error clearing conversions from Supabase:", error);
              }
            } catch (err) {
              console.error("Error clearing config from Supabase:", err);
            }
          }
        } else {
          // Clear logs
          localStorage.removeItem(storagePrefix);
          // Also clean up any synced IDs tracker if they exist
          localStorage.removeItem(`sms_synced_${clearType === "prod" ? "prod" : "disp"}_ids_${standardId}`);

          if (smsStorage.isCloudEnabled()) {
            try {
              if (clearType === "prod") {
                const { error } = await supabase
                  .from("sms_production")
                  .delete()
                  .eq("standard_id", standardId);
                if (error) console.error("Error clearing production logs from Supabase:", error);
              } else {
                const { error } = await supabase
                  .from("sms_dispatch")
                  .delete()
                  .eq("standard_id", standardId);
                if (error) console.error("Error clearing dispatch logs from Supabase:", error);
              }
            } catch (err) {
              console.error("Error clearing logs from Supabase:", err);
            }
          }
        }
        loadOverrides();
        loadConversions();
        setConfirmModal(null);
        alert(`Successfully cleared ${typeLabel} for ${stdName}.`);
      }
    });
  };

  const cleanupLegacyImportedConsigneeData = async () => {
    const standards = ["is13488", "is13487", "is12786", "is4985", "is17425", "is14483"];
    for (const stdId of standards) {
      const trackerKey = `sms_consignee_imported_ids_${stdId}`;
      const rawIds = localStorage.getItem(trackerKey);
      if (rawIds) {
        try {
          const ids: string[] = JSON.parse(rawIds);
          if (Array.isArray(ids) && ids.length > 0) {
            // Load and filter local storage dispatch
            const dispKey = `sms_disp_${stdId}`;
            const rawDisp = localStorage.getItem(dispKey);
            if (rawDisp) {
              const entries = JSON.parse(rawDisp);
              if (Array.isArray(entries)) {
                const filtered = entries.filter((e: any) => !ids.includes(e.id) && !e.isConsigneeImport);
                localStorage.setItem(dispKey, JSON.stringify(filtered));
              }
            }

            // Delete from Supabase in chunks of 100 to avoid URI too large errors
            if (smsStorage.isCloudEnabled()) {
              const chunkSize = 100;
              for (let i = 0; i < ids.length; i += chunkSize) {
                const chunk = ids.slice(i, i + chunkSize);
                await supabase
                  .from("sms_dispatch")
                  .delete()
                  .in("id", chunk);
              }
            }
          }
        } catch (e) {
          console.error(`Error cleaning up legacy imported consignee data for ${stdId}:`, e);
        } finally {
          localStorage.removeItem(trackerKey);
        }
      }
    }
  };

  const handleClearConsigneeSalesData = (targetStd?: string) => {
    const stdParam = targetStd || "all";
    const stdName = stdParam === "all" ? "All Standards" : (smsStandards[stdParam]?.name || stdParam);
    setConfirmModal({
      show: true,
      title: `Clear Consignee Sales Logs for ${stdName}?`,
      message: `WARNING: This will permanently delete all imported/generated consignee sales dispatch records for ${stdName} from both local storage and the cloud. This operation cannot be undone!`,
      destructive: true,
      action: async () => {
        const standards = stdParam === "all" 
          ? Object.keys(smsStandards) 
          : [stdParam];

        for (const stdId of standards) {
          // Clear locally
          const dispKey = `sms_disp_${stdId}`;
          const rawDisp = localStorage.getItem(dispKey);
          let legacyIds: string[] = [];

          // Get legacy IDs
          const trackerKey = `sms_consignee_imported_ids_${stdId}`;
          const rawIds = localStorage.getItem(trackerKey);
          if (rawIds) {
            try {
              legacyIds = JSON.parse(rawIds);
            } catch (e) {}
          }

          if (rawDisp) {
            try {
              const entries = JSON.parse(rawDisp);
              if (Array.isArray(entries)) {
                const filtered = entries.filter((e: any) => !e.isConsigneeImport && !legacyIds.includes(e.id));
                localStorage.setItem(dispKey, JSON.stringify(filtered));
              }
            } catch (e) {
              console.error(`Failed to parse dispatch logs for standard ${stdId}:`, e);
            }
          }

          // Delete legacy IDs from Supabase in chunks of 100
          if (smsStorage.isCloudEnabled() && legacyIds.length > 0) {
            try {
              const chunkSize = 100;
              for (let i = 0; i < legacyIds.length; i += chunkSize) {
                const chunk = legacyIds.slice(i, i + chunkSize);
                await supabase
                  .from("sms_dispatch")
                  .delete()
                  .in("id", chunk);
              }
            } catch (err) {
              console.error(`Failed to clear legacy IDs for standard ${stdId} from Supabase:`, err);
            }
          }

          // Remove legacy import ids tracker if present
          localStorage.removeItem(trackerKey);
        }

        // Clear newly imported records with flag from Cloud (Supabase)
        if (smsStorage.isCloudEnabled()) {
          try {
            let query = supabase.from("sms_dispatch").delete().eq("data->>isConsigneeImport", "true");
            if (stdParam !== "all") {
              query = query.eq("standard_id", stdParam);
            }
            const { error } = await query;
            if (error) console.error("Error clearing consignee sales dispatches from Supabase:", error);
          } catch (err) {
            console.error("Error clearing consignee sales dispatches from Supabase:", err);
          }
        }

        setConfirmModal(null);
        alert(`Successfully cleared consignee sales logs for ${stdName}.`);
      }
    });
  };

  const handleClearConsigneeData = () => {
    setConfirmModal({
      show: true,
      title: "Clear Consignees Directory?",
      message: "WARNING: This will completely delete all registered consignees from the directory, both locally and from the cloud database. This operation cannot be undone!",
      destructive: true,
      action: async () => {
        localStorage.removeItem("sms_consignees");
        localStorage.removeItem("sms_synced_consignee_ids");
        
        if (smsStorage.isCloudEnabled()) {
          try {
            const { error } = await supabase
              .from("sms_consignees")
              .delete()
              .neq("name", "");
            if (error) console.error("Error clearing consignees from Supabase:", error);
          } catch (err) {
            console.error("Error clearing consignees from Supabase:", err);
          }
        }
        
        setConfirmModal(null);
        alert("Consignee directory has been cleared.");
      }
    });
  };

  const handleClearAllSmsData = () => {
    setConfirmModal({
      show: true,
      title: "WIPE ALL SMS DATA?",
      message: "WARNING: This will completely delete all Production entries, Dispatch entries, Starting Stocks, Conversions, Consignees, and Preferences for ALL IS standards from both local storage and the cloud. You will lose all logged SMS data! Please proceed with absolute caution.",
      destructive: true,
      action: async () => {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith("sms_prod_") || 
            key.startsWith("sms_disp_") || 
            key.startsWith("sms_last_stock_") ||
            key.startsWith("sms_stock_") ||
            key.startsWith("sms_conv_") ||
            key.startsWith("sms_synced_") ||
            key === "sms_consignees"
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        
        if (smsStorage.isCloudEnabled()) {
          try {
            await Promise.all([
              supabase.from("sms_production").delete().neq("id", ""),
              supabase.from("sms_dispatch").delete().neq("id", ""),
              supabase.from("sms_starting_stocks").delete().neq("id", ""),
              supabase.from("sms_conversion_settings").delete().neq("id", ""),
              supabase.from("sms_consignees").delete().neq("name", "")
            ]);
            console.log("Cloud databases wiped successfully.");
          } catch (err) {
            console.error("Error wiping cloud databases:", err);
          }
        }

        initializeDefaultConversions(true);
        loadOverrides();
        loadConversions();
        setConfirmModal(null);
        alert("All SMS Module data has been completely reset. Default conversion factors have been restored.");
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100 flex flex-col font-sans py-8 px-4 max-w-6xl mx-auto">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.02),transparent_60%)] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">SMS Module Settings</h1>
              <p className="text-sm text-slate-400 mt-1 font-medium">Manage transaction data, manual stocks, and system backups</p>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate("/sms")}
          className="border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300 self-start md:self-auto h-9"
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Main Panel Layout */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 border-b lg:border-b-0 lg:border-r border-slate-900 pb-4 lg:pb-0 lg:pr-6">
          <button
            onClick={() => setActiveTab("overrides")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full ${
              activeTab === "overrides" 
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-500/5" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Stock Overrides</span>
          </button>
          
          <button
            onClick={() => setActiveTab("data")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full ${
              activeTab === "data" 
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-500/5" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Backup & Sync</span>
          </button>

          <button
            onClick={() => setActiveTab("conversions")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full ${
              activeTab === "conversions" 
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-500/5" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-450" />
            <span>Auto-Calculations</span>
          </button>

          <button
            onClick={() => setActiveTab("consignees")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full ${
              activeTab === "consignees" 
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-500/5" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span>Manage Consignees</span>
          </button>

          <button
            onClick={() => setActiveTab("maintenance")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full ${
              activeTab === "maintenance" 
                ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-md shadow-red-500/5" 
                : "text-slate-400 hover:text-red-400 hover:bg-slate-900/60"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Maintenance</span>
          </button>
        </aside>

        {/* Setting View Pane */}
        <main className="flex-1 bg-slate-900/20 border border-slate-900/80 rounded-2xl p-6 min-h-[400px]">
          {/* TAB 1: OVERRIDES */}
          {activeTab === "overrides" && (
            <div className="space-y-8">
              {/* Info Banner */}
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/15 rounded-xl text-xs text-indigo-300 leading-relaxed">
                Opening stock overrides allow you to establish a starting balance for any size/period without relying on prior month computations. <strong>Monthly Overrides</strong> set starting balances for a specific month, while <strong>Global Overrides</strong> serve as general fallback starting points.
              </div>

              {/* Add New Override Form */}
              <form onSubmit={handleAddOverride} className="bg-slate-900/50 border border-slate-900 p-5 rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  Add Stock Override Entry
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Standard Select */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">IS Standard</label>
                    <select
                      value={newStd}
                      onChange={(e) => setNewStd(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    >
                      {Object.keys(smsStandards).map((stdKey) => (
                        <option key={stdKey} value={stdKey}>{smsStandards[stdKey].name} - {smsStandards[stdKey].subName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Size Select */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Size / Dimension</label>
                    <select
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    >
                      {(standardSizes[newStd] || []).map((sz) => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </select>
                  </div>

                  {/* Override Type */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Override Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as "monthly" | "global")}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="monthly">Monthly Override (Target Month)</option>
                      <option value="global">Global Override (Default Fallback)</option>
                    </select>
                  </div>

                  {/* Date fields (only if monthly) */}
                  {newType === "monthly" && (
                    <>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Year</label>
                        <select
                          value={newYear}
                          onChange={(e) => setNewYear(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                        >
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Month</label>
                        <select
                          value={newMonth}
                          onChange={(e) => setNewMonth(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                        >
                          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Stock Value */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Starting Stock Value</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {addError && <p className="text-red-400 text-xs font-semibold">{addError}</p>}

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-8">
                    Create Override
                  </Button>
                </div>
              </form>

              {/* Active Overrides Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200">Existing Custom Stock Overrides</h3>
                
                {overrides.length === 0 ? (
                  <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
                    No custom overrides configured. Using global default fallback of 0.
                  </div>
                ) : (
                  <div className="border border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 border-b border-slate-850 font-bold">
                          <th className="p-3">Standard</th>
                          <th className="p-3">Size</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Period</th>
                          <th className="p-3 text-right">Starting Stock</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/50">
                        {overrides.map((item) => (
                          <tr key={item.key} className="hover:bg-slate-900/20 text-slate-350">
                            <td className="p-3 font-semibold text-slate-200">
                              {smsStandards[item.standardId]?.name || item.standardId}
                            </td>
                            <td className="p-3 font-medium">{item.sizeName}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.type === "monthly" 
                                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15" 
                                  : "bg-slate-950 text-slate-400 border border-slate-800"
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="p-3 font-mono">
                              {item.type === "monthly" ? `${item.month} ${item.year}` : "All Periods (Fallback)"}
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-450">
                              {editingKey === item.key ? (
                                <input
                                  type="number"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  className="bg-slate-950 border border-indigo-500 rounded px-2 py-0.5 w-24 text-right text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  autoFocus
                                />
                              ) : (
                                <span>{item.value.toLocaleString()}</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-2">
                                {editingKey === item.key ? (
                                  <>
                                    <button 
                                      onClick={() => handleSaveEdit(item.key)}
                                      className="p-1 hover:bg-emerald-500/10 rounded text-emerald-400"
                                      title="Save Edit"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => setEditingKey(null)}
                                      className="p-1 hover:bg-red-500/10 rounded text-red-400"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => {
                                        setEditingKey(item.key);
                                        setEditingValue(item.value.toString());
                                      }}
                                      className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-indigo-400"
                                      title="Edit Value"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteOverride(item.key)}
                                      className="p-1 hover:bg-red-500/10 rounded text-red-400"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1.5: CONVERSIONS & AUTO-CALCULATIONS */}
          {/* TAB 1.5: CONVERSIONS & AUTO-CALCULATIONS */}
          {activeTab === "conversions" && (() => {
            const isWeightRequired = (stdId: string) => {
              return stdId === "is13488" || stdId === "is12786" || stdId === "is4985";
            };

            const getWeightLabel = (stdId: string) => {
              if (stdId === "is4985") return "Weight per Pipe (KG)";
              return "Weight per Meter (KG)";
            };

            const getValueLabel = (stdId: string) => {
              if (stdId === "is13488" || stdId === "is12786") return "Value per KG (Rs.)";
              if (stdId === "is13487") return "Value per 1000 Nos (Rs.)";
              if (stdId === "is4985") return "Value per Tonn (Rs.)";
              if (stdId === "is17425" || stdId === "is14483") return "Value per Nos (Rs.)";
              return "Standard Value per Unit (Rs.)";
            };

             const formatWeightRate = (stdId: string, val: number) => {
              if (val <= 0) return "-";
              if (stdId === "is4985") return `${val.toFixed(3)} kg/pipe`;
              return `${val.toFixed(3)} kg/mtr`;
            };

            const formatValueRate = (stdId: string, val: number) => {
              if (val <= 0) return "-";
              if (stdId === "is13488" || stdId === "is12786") return `Rs. ${val.toLocaleString()} / kg`;
              if (stdId === "is13487") return `Rs. ${val.toLocaleString()} / 1000 Nos`;
              if (stdId === "is4985") return `Rs. ${val.toLocaleString()} / Tonn`;
              if (stdId === "is17425" || stdId === "is14483") return `Rs. ${val.toLocaleString()} / Nos`;
              return `Rs. ${val.toLocaleString()}`;
            };

            return (
              <div className="space-y-8">
                {/* Info Banner */}
                <div className="p-4 bg-indigo-950/20 border border-indigo-500/15 rounded-xl text-xs text-indigo-300 leading-relaxed">
                  Configure conversion parameters to automate production logging. 
                  Depending on the IS standard selected, standard value can be entered per kg, per 1000 nos, per tonn, or per single nos. 
                  Weight per meter or per pipe is only configured for weight-based standards (IS 13488, IS 12786, IS 4985). All auto-calculated values are rounded to the nearest integer.
                </div>

                {/* Add New Conversion Form */}
                <form onSubmit={handleAddConversion} className="bg-slate-900/50 border border-slate-900 p-5 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-400" />
                    Configure Auto-Calculation Constants
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Standard Select */}
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">IS Standard</label>
                      <select
                        value={convStd}
                        onChange={(e) => setConvStd(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                      >
                        {Object.keys(smsStandards).map((stdKey) => (
                          <option key={stdKey} value={stdKey}>{smsStandards[stdKey].name} - {smsStandards[stdKey].subName}</option>
                        ))}
                      </select>
                    </div>

                    {/* Size Select */}
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Size / Dimension</label>
                      <select
                        value={convSize}
                        onChange={(e) => setConvSize(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                      >
                        {(standardSizes[convStd] || []).map((sz) => (
                          <option key={sz} value={sz}>{sz}</option>
                        ))}
                      </select>
                    </div>

                    {/* Weight per Meter or Pipe */}
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                        {getWeightLabel(convStd)}
                      </label>
                      {isWeightRequired(convStd) ? (
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={convWeight}
                          onChange={(e) => setConvWeight(e.target.value)}
                          placeholder="e.g. 0.125 (use 3 decimals)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <div className="w-full bg-slate-950/40 border border-slate-900/60 rounded-lg px-3 py-1.5 text-xs text-slate-500 italic flex items-center h-8">
                          Not Applicable
                        </div>
                      )}
                    </div>

                    {/* Value per Unit */}
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                        {getValueLabel(convStd)}
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={convValue}
                        onChange={(e) => setConvValue(e.target.value)}
                        placeholder="e.g. 250"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {convError && <p className="text-red-400 text-xs font-semibold">{convError}</p>}

                  <div className="flex justify-end pt-2">
                    <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-8">
                      Save Conversion Settings
                    </Button>
                  </div>
                </form>

                {/* Conversion Factor Lists */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-200">Active Conversion Factors</h3>
                  
                  {conversions.length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
                      No active conversion factors set. Weight and monetary values must be entered manually during production logs.
                    </div>
                  ) : (
                    <div className="border border-slate-900 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-400 border-b border-slate-850 font-bold">
                            <th className="p-3">Standard</th>
                            <th className="p-3">Size / Dimension</th>
                            <th className="p-3 text-right font-medium">Weight Factor</th>
                            <th className="p-3 text-right">Value Rate</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/50">
                          {conversions.map((item) => {
                            const key = `${item.standardId}_${item.sizeName}`;
                            const isEditing = editingConvKey === key;
                            return (
                              <tr key={key} className="hover:bg-slate-900/20 text-slate-350">
                                <td className="p-3 font-semibold text-slate-200">
                                  {smsStandards[item.standardId]?.name || item.standardId}
                                </td>
                                <td className="p-3 font-medium">{item.sizeName}</td>
                                <td className="p-3 text-right font-bold">
                                  {isEditing ? (
                                    isWeightRequired(item.standardId) ? (
                                      <input
                                        type="number"
                                        step="0.001"
                                        value={editingConvWeight}
                                        onChange={(e) => setEditingConvWeight(e.target.value)}
                                        className="bg-slate-950 border border-indigo-500 rounded px-2 py-0.5 w-24 text-right text-xs focus:outline-none"
                                      />
                                    ) : (
                                      <span className="text-slate-500 italic font-normal">N/A</span>
                                    )
                                  ) : (
                                    <span>{isWeightRequired(item.standardId) && item.weight > 0 ? formatWeightRate(item.standardId, item.weight) : "-"}</span>
                                  )}
                                </td>
                                <td className="p-3 text-right font-bold text-emerald-450">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="any"
                                      value={editingConvValue}
                                      onChange={(e) => setEditingConvValue(e.target.value)}
                                      className="bg-slate-950 border border-indigo-500 rounded px-2 py-0.5 w-24 text-right text-xs focus:outline-none"
                                    />
                                  ) : (
                                    <span>{formatValueRate(item.standardId, item.value)}</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center gap-2">
                                    {isEditing ? (
                                      <>
                                        <button 
                                          onClick={() => handleSaveConvEdit(item.standardId, item.sizeName)}
                                          className="p-1 hover:bg-emerald-500/10 rounded text-emerald-400"
                                          title="Save Edit"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                          onClick={() => setEditingConvKey(null)}
                                          className="p-1 hover:bg-red-500/10 rounded text-red-400"
                                          title="Cancel"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button 
                                          onClick={() => {
                                            setEditingConvKey(key);
                                            setEditingConvWeight(item.weight.toString());
                                            setEditingConvValue(item.value.toString());
                                          }}
                                          className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-indigo-400"
                                          title="Edit Rates"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteConversion(item.standardId, item.sizeName)}
                                          className="p-1 hover:bg-red-500/10 rounded text-red-400"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Backup & Restore rates card */}
                <div className="bg-slate-900/50 border border-slate-900 p-5 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-200">Backup & Restore Rates</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Export or import only your auto-calculation conversion rates (weights and values per standard/size) as a JSON file.
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <Button 
                      type="button" 
                      onClick={handleExportConversions}
                      className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 h-9"
                    >
                      <Download className="w-4 h-4" />
                      Export Rates JSON
                    </Button>

                    <label className="bg-slate-950 border border-slate-800 hover:border-indigo-500/30 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-colors h-9">
                      <Upload className="w-4 h-4 text-indigo-400" />
                      <span>Import Rates JSON</span>
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={handleImportConversions} 
                        className="hidden" 
                      />
                    </label>

                    <Button 
                      type="button" 
                      onClick={() => {
                        initializeDefaultConversions(true);
                        loadConversions();
                        alert("Default conversion rates have been restored successfully!");
                      }}
                      className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 h-9"
                    >
                      <RefreshCw className="w-4 h-4 text-indigo-400" />
                      Restore Default Rates
                    </Button>
                  </div>

                  {convImportStatus && (
                    <div className={`p-3 rounded-lg text-xs font-medium border ${
                      convImportStatus.type === "success" 
                        ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" 
                        : "bg-red-950/20 border-red-500/20 text-red-400"
                    }`}>
                      {convImportStatus.message}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 2: BACKUP & SYNC */}
          {activeTab === "data" && (
            <div className="space-y-8">
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/15 rounded-xl text-xs text-indigo-300 leading-relaxed">
                Exporting database states lets you download your entire logs inventory (including all transaction sheets and override parameters) as a single JSON file. You can restore this file at any time or merge configurations across setups.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Export Card */}
                <div className="bg-slate-900/50 border border-slate-900 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
                      <Download className="w-5 h-5 text-indigo-400" />
                      Export Data Backup
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                      Download a structured JSON configuration containing all local databases: Production logs, Dispatch entries, manual starting balances, and settings.
                    </p>
                  </div>
                  <Button 
                    onClick={handleExportBackup}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-10 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download JSON Backup</span>
                  </Button>
                </div>

                {/* Import Card */}
                <div className="bg-slate-900/50 border border-slate-900 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
                      <Upload className="w-5 h-5 text-emerald-400" />
                      Restore / Load Backup
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Upload a previously exported SMS JSON backup file to restore or merge logs databases. Duplicate entries will be merged safely.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-indigo-500/40 bg-slate-950/50 rounded-xl p-4 cursor-pointer hover:bg-slate-950 transition-all text-center">
                      <FileSpreadsheet className="w-6 h-6 text-slate-400 mb-1.5" />
                      <span className="text-xs font-semibold text-slate-300">Choose JSON Backup File</span>
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={handleImportBackup} 
                        className="hidden" 
                      />
                    </label>

                    {importStatus && (
                      <div className={`p-3 rounded-lg text-xs font-semibold ${
                        importStatus.type === "success" 
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                          : "bg-red-500/10 border border-red-500/20 text-red-400"
                      }`}>
                        {importStatus.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MAINTENANCE (CLEAR DATA) */}
          {activeTab === "maintenance" && (
            <div className="space-y-8">
              <div className="p-4 bg-red-950/20 border border-red-500/15 rounded-xl text-xs text-red-350 leading-relaxed flex gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
                <div>
                  <strong>CRITICAL DESTRUCTIVE OPERATIONS:</strong> Modifying or wiping local databases here removes actual operational logs. Ensure you have downloaded a JSON backup beforehand in the <em>Backup & Sync</em> tab!
                </div>
              </div>

              {/* Clear logs per standard */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Clear Records by Standard Group</h3>
                <div className="border border-slate-900 rounded-xl overflow-hidden divide-y divide-slate-900/60">
                  {Object.keys(smsStandards).map((stdId) => (
                    <div key={stdId} className="p-4 bg-slate-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-200">{smsStandards[stdId].name}</span>
                        <span className="text-slate-400 text-xs ml-2 font-medium">({smsStandards[stdId].subName})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleClearStandardData(stdId, "prod")}
                          className="px-3 py-1.5 bg-red-550/10 hover:bg-red-550/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all"
                        >
                          Clear Prod Logs
                        </button>
                        <button
                          onClick={() => handleClearStandardData(stdId, "disp")}
                          className="px-3 py-1.5 bg-red-550/10 hover:bg-red-550/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all"
                        >
                          Clear Disp Logs
                        </button>
                        <button
                          onClick={() => handleClearStandardData(stdId, "stocks")}
                          className="px-3 py-1.5 bg-red-550/10 hover:bg-red-550/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all"
                        >
                          Clear Overrides
                        </button>
                        <button
                          onClick={() => handleClearConsigneeSalesData(stdId)}
                          className="px-3 py-1.5 bg-red-550/10 hover:bg-red-550/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all"
                        >
                          Clear Sales Logs
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wipe All Data Button */}
              <div className="bg-red-950/10 border border-red-500/20 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-400">Complete SMS Database Reset</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                    Completely resets the stock application module, erasing all standards production sheets, dispatch transactions, and overriding configs.
                  </p>
                </div>
                <button
                  onClick={handleClearAllSmsData}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-550 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-red-500/10 border border-red-500"
                >
                  Wipe All Data
                </button>
              </div>

              {/* Clear Consignee Data Button */}
              <div className="bg-red-950/10 border border-red-500/20 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-400">Clear Consignee Directory</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                    Erases the registered consignee directory locally and from the cloud database.
                  </p>
                </div>
                <button
                  onClick={handleClearConsigneeData}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-550 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-red-500/10 border border-red-500"
                >
                  Clear Consignee Data
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: MANAGE CONSIGNEES */}
          {activeTab === "consignees" && (
            <div className="space-y-8">
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/15 rounded-xl text-xs text-indigo-300 leading-relaxed">
                Add, edit, or delete regular consignees (parties) to choose from when generating the Consignee Report.
              </div>

              {/* Consignee Import Status Banner */}
              {consigneeImportBanner && (
                <div className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
                  consigneeImportBanner.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/25 text-rose-400"
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{consigneeImportBanner.message}</span>
                  </div>
                  <button onClick={() => setConsigneeImportBanner(null)} className="text-slate-400 hover:text-slate-200 font-extrabold uppercase tracking-wider text-[10px]">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Standard Template & Bulk Import Section */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold text-slate-100">Bulk Consignee Directory Import</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                      Quickly register or update multiple consignees at once using our standardized Excel template. Preview the required columns before downloading.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowConsigneePreviewModal(true)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      <Eye className="w-4 h-4 text-indigo-400" />
                      <span>Preview Template</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadConsigneeTemplate}
                      className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/25 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Template (.xlsx)</span>
                    </button>

                    <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-md">
                      <Upload className="w-4 h-4" />
                      <span>Upload Consignee Sheet</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleImportConsigneesExcel}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Add New Consignee Form */}
              <form onSubmit={handleAddConsignee} className="bg-slate-900/50 border border-slate-900 p-5 rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  Register New Consignee
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Name (Required) */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Consignee Name *</label>
                    <input
                      type="text"
                      required
                      value={newConsigneeName}
                      onChange={(e) => setNewConsigneeName(e.target.value)}
                      placeholder="Enter company/consignee name"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email ID</label>
                    <input
                      type="email"
                      value={newConsigneeEmail}
                      onChange={(e) => setNewConsigneeEmail(e.target.value)}
                      placeholder="consignee@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* Look for (Alias) */}
                  <div className="space-y-1.5 md:col-span-3">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Look for (Alias for Uploaded Sheets)</label>
                    <input
                      type="text"
                      value={newConsigneeLookFor}
                      onChange={(e) => setNewConsigneeLookFor(e.target.value)}
                      placeholder="e.g. Hem / Hariyali Irri - Amirgadh (comma separated for multiple)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5 md:col-span-3">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Address</label>
                    <input
                      type="text"
                      value={newConsigneeAddress}
                      onChange={(e) => setNewConsigneeAddress(e.target.value)}
                      placeholder="Enter street, office number, or area details"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">City</label>
                    <input
                      type="text"
                      value={newConsigneeCity}
                      onChange={(e) => setNewConsigneeCity(e.target.value)}
                      placeholder="e.g. Ahmedabad"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* District */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">District</label>
                    <input
                      type="text"
                      value={newConsigneeDistrict}
                      onChange={(e) => setNewConsigneeDistrict(e.target.value)}
                      placeholder="e.g. Rajkot"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* State */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">State</label>
                    <input
                      type="text"
                      value={newConsigneeState}
                      onChange={(e) => setNewConsigneeState(e.target.value)}
                      placeholder="e.g. Gujarat"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* Country */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Country</label>
                    <input
                      type="text"
                      value={newConsigneeCountry}
                      onChange={(e) => setNewConsigneeCountry(e.target.value)}
                      placeholder="e.g. India"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* Pincode */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pincode</label>
                    <input
                      type="text"
                      value={newConsigneePincode}
                      onChange={(e) => setNewConsigneePincode(e.target.value)}
                      placeholder="e.g. 360001"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* Telephone */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telephone</label>
                    <input
                      type="text"
                      value={newConsigneeTelephone}
                      onChange={(e) => setNewConsigneeTelephone(e.target.value)}
                      placeholder="e.g. 0281-223344"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* Mobile */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mobile Number</label>
                    <input
                      type="text"
                      value={newConsigneeMobile}
                      onChange={(e) => setNewConsigneeMobile(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 px-6 rounded-lg">
                    Register Consignee
                  </Button>
                </div>
              </form>

              {/* Consignee List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200">Registered Consignees ({consigneesList.length})</h3>
                
                {consigneesList.length === 0 ? (
                  <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
                    No consignees registered yet. Register a consignee above.
                  </div>
                ) : (
                  <div className="border border-slate-900 rounded-xl overflow-hidden divide-y divide-slate-900/60">
                    {consigneesList.map((item, index) => {
                      const isEditing = editingConsigneeIdx === index;
                      const isDefault = defaultConsignees.some(d => d.name.toLowerCase() === item.name.toLowerCase());
                      return (
                        <div key={index} className="p-4 bg-slate-900/10 flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            {isEditing && editingConsigneeVal ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5 md:col-span-2">
                                  <label className="block text-[9px] text-slate-500 font-bold uppercase">Consignee Name</label>
                                  <input
                                    type="text"
                                    required
                                    value={editingConsigneeVal.name}
                                    onChange={(e) => setEditingConsigneeVal({ ...editingConsigneeVal, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-indigo-500 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[9px] text-slate-500 font-bold uppercase">Email</label>
                                  <input
                                    type="email"
                                    value={editingConsigneeVal.email || ""}
                                    onChange={(e) => setEditingConsigneeVal({ ...editingConsigneeVal, email: e.target.value })}
                                    className="w-full bg-slate-950 border border-indigo-500 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5 md:col-span-3">
                                  <label className="block text-[9px] text-slate-500 font-bold uppercase">Look for (Alias for Uploaded Sheets)</label>
                                  <input
                                    type="text"
                                    value={editingConsigneeVal.lookFor || ""}
                                    onChange={(e) => setEditingConsigneeVal({ ...editingConsigneeVal, lookFor: e.target.value })}
                                    className="w-full bg-slate-950 border border-indigo-500 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5 md:col-span-3">
                                  <label className="block text-[9px] text-slate-500 font-bold uppercase">Address</label>
                                  <input
                                    type="text"
                                    value={editingConsigneeVal.address || ""}
                                    onChange={(e) => setEditingConsigneeVal({ ...editingConsigneeVal, address: e.target.value })}
                                    className="w-full bg-slate-950 border border-indigo-500 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[9px] text-slate-500 font-bold uppercase">City</label>
                                  <input
                                    type="text"
                                    value={editingConsigneeVal.city || ""}
                                    onChange={(e) => setEditingConsigneeVal({ ...editingConsigneeVal, city: e.target.value })}
                                    className="w-full bg-slate-950 border border-indigo-500 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[9px] text-slate-500 font-bold uppercase">District</label>
                                  <input
                                    type="text"
                                    value={editingConsigneeVal.district || ""}
                                    onChange={(e) => setEditingConsigneeVal({ ...editingConsigneeVal, district: e.target.value })}
                                    className="w-full bg-slate-950 border border-indigo-500 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[9px] text-slate-500 font-bold uppercase">State</label>
                                  <input
                                    type="text"
                                    value={editingConsigneeVal.state || ""}
                                    onChange={(e) => setEditingConsigneeVal({ ...editingConsigneeVal, state: e.target.value })}
                                    className="w-full bg-slate-950 border border-indigo-500 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[9px] text-slate-500 font-bold uppercase">Country</label>
                                  <input
                                    type="text"
                                    value={editingConsigneeVal.country || ""}
                                    onChange={(e) => setEditingConsigneeVal({ ...editingConsigneeVal, country: e.target.value })}
                                    className="w-full bg-slate-950 border border-indigo-500 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[9px] text-slate-500 font-bold uppercase">Pincode</label>
                                  <input
                                    type="text"
                                    value={editingConsigneeVal.pincode || ""}
                                    onChange={(e) => setEditingConsigneeVal({ ...editingConsigneeVal, pincode: e.target.value })}
                                    className="w-full bg-slate-950 border border-indigo-500 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[9px] text-slate-500 font-bold uppercase">Telephone</label>
                                  <input
                                    type="text"
                                    value={editingConsigneeVal.telephone || ""}
                                    onChange={(e) => setEditingConsigneeVal({ ...editingConsigneeVal, telephone: e.target.value })}
                                    className="w-full bg-slate-950 border border-indigo-500 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[9px] text-slate-500 font-bold uppercase">Mobile</label>
                                  <input
                                    type="text"
                                    value={editingConsigneeVal.mobile || ""}
                                    onChange={(e) => setEditingConsigneeVal({ ...editingConsigneeVal, mobile: e.target.value })}
                                    className="w-full bg-slate-950 border border-indigo-500 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <h4 className="text-xs font-bold text-slate-100">{item.name}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[10px] text-slate-400 font-medium">
                                  {item.address && <div><strong>Address:</strong> {item.address}</div>}
                                  {(item.city || item.district || item.state || item.pincode) && (
                                    <div>
                                      <strong>Location:</strong> {[item.city, item.district, item.state, item.pincode].filter(Boolean).join(", ")}
                                    </div>
                                  )}
                                  {item.mobile && <div><strong>Mobile:</strong> {item.mobile}</div>}
                                  {item.email && <div><strong>Email:</strong> {item.email}</div>}
                                  {item.telephone && <div><strong>Phone:</strong> {item.telephone}</div>}
                                  {item.lookFor && <div className="sm:col-span-2"><strong>Look for (Alias):</strong> {item.lookFor}</div>}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isDefault ? (
                              <span className="text-[9px] bg-slate-900/60 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-slate-800">
                                Default
                              </span>
                            ) : isEditing ? (
                              <>
                                <button 
                                  onClick={() => handleSaveConsigneeEdit(index)}
                                  className="p-1.5 hover:bg-emerald-500/10 rounded text-emerald-400"
                                  title="Save"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setEditingConsigneeIdx(null)}
                                  className="p-1.5 hover:bg-red-500/10 rounded text-red-400"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={() => {
                                    setEditingConsigneeIdx(index);
                                    setEditingConsigneeVal(item);
                                  }}
                                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteConsignee(item.name)}
                                  className="p-1.5 hover:bg-red-500/10 rounded text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.show && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {confirmModal.destructive && (
              <div className="absolute top-0 inset-x-0 h-1.5 bg-red-550" />
            )}
            
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-3">
              {confirmModal.destructive && <AlertTriangle className="w-5 h-5 text-red-450" />}
              {confirmModal.title}
            </h3>
            
            <p className="text-xs text-slate-350 leading-relaxed mb-6">
              {confirmModal.message}
            </p>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setConfirmModal(null)}
                className="border-slate-800 text-slate-300 hover:bg-slate-850 h-9"
              >
                Cancel
              </Button>
              <button
                onClick={confirmModal.action}
                className={`px-4 h-9 text-xs font-extrabold rounded-lg transition-all ${
                  confirmModal.destructive 
                    ? "bg-red-600 hover:bg-red-550 text-white" 
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consignee Master Template Preview Modal */}
      {showConsigneePreviewModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-5xl w-full rounded-3xl overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Table className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                    Standard Consignee Directory Template Preview
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    This template uses standard Navy (#366092) headers and bold white font. Download it blank without demo data to import your consignees.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowConsigneePreviewModal(false)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Guidance Notice */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-slate-200">Key Guidelines for Consignee Master Import:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                    <li><strong className="text-slate-300">Consignee Name</strong> is required and unique. If a name matches an existing consignee, that record is automatically updated.</li>
                    <li><strong className="text-slate-300">Look For / Alias</strong> allows you to map alternate spelling or city suffixes (e.g., <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300">Siddhi Corporation / prantij</code>).</li>
                    <li>When downloaded, all columns are formatted cleanly with Excel Table styles ready for immediate entry.</li>
                  </ul>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-inner">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#366092] text-white font-bold select-none">
                        <th className="py-3 px-4 border border-[#2B4D75]">Consignee Name</th>
                        <th className="py-3 px-4 border border-[#2B4D75]">Address</th>
                        <th className="py-3 px-4 border border-[#2B4D75]">City</th>
                        <th className="py-3 px-4 border border-[#2B4D75]">District</th>
                        <th className="py-3 px-4 border border-[#2B4D75]">State</th>
                        <th className="py-3 px-4 border border-[#2B4D75]">Country</th>
                        <th className="py-3 px-4 border border-[#2B4D75]">Pincode</th>
                        <th className="py-3 px-4 border border-[#2B4D75]">Telephone</th>
                        <th className="py-3 px-4 border border-[#2B4D75]">Mobile</th>
                        <th className="py-3 px-4 border border-[#2B4D75]">Email</th>
                        <th className="py-3 px-4 border border-[#2B4D75]">Look For</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-4 font-semibold text-slate-200">Siddhi Corporation</td>
                        <td className="py-2.5 px-4 text-slate-400">GIDC Phase 2, Plot 45</td>
                        <td className="py-2.5 px-4">Prantij</td>
                        <td className="py-2.5 px-4 text-slate-400">Sabarkantha</td>
                        <td className="py-2.5 px-4">Gujarat</td>
                        <td className="py-2.5 px-4 text-slate-400">India</td>
                        <td className="py-2.5 px-4 text-slate-400">383205</td>
                        <td className="py-2.5 px-4 text-slate-400">02770-240123</td>
                        <td className="py-2.5 px-4">9825012345</td>
                        <td className="py-2.5 px-4 text-slate-400">siddhi@example.com</td>
                        <td className="py-2.5 px-4 text-indigo-300 font-mono text-[11px]">Siddhi Corp, Prantij</td>
                      </tr>
                      <tr className="hover:bg-slate-900/40 bg-slate-900/10">
                        <td className="py-2.5 px-4 font-semibold text-slate-200">Kisan Agro Kendra</td>
                        <td className="py-2.5 px-4 text-slate-400">Main Market Yard</td>
                        <td className="py-2.5 px-4">Mehsana</td>
                        <td className="py-2.5 px-4 text-slate-400">Mehsana</td>
                        <td className="py-2.5 px-4">Gujarat</td>
                        <td className="py-2.5 px-4 text-slate-400">India</td>
                        <td className="py-2.5 px-4 text-slate-400">384002</td>
                        <td className="py-2.5 px-4 text-slate-400">02762-251456</td>
                        <td className="py-2.5 px-4">9426098765</td>
                        <td className="py-2.5 px-4 text-slate-400">kisanagro@example.com</td>
                        <td className="py-2.5 px-4 text-indigo-300 font-mono text-[11px]">Kisan Agro</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Ready to import your consignees? Download this blank template to start.
              </span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConsigneePreviewModal(false)}
                  className="border-slate-800 text-slate-300 hover:bg-slate-850 text-xs font-bold h-9 px-4"
                >
                  Close Preview
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadConsigneeTemplate();
                    setShowConsigneePreviewModal(false);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Blank Template (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
