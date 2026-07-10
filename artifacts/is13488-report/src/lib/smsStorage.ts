import { supabase } from "./supabase";

export interface ProductionEntry {
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

export interface DispatchEntry {
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
}

export interface Consignee {
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
  [key: string]: any;
}

// Helper to check if Supabase is available/configured
export function isCloudEnabled(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key);
}

// ----- SMS PRODUCTION -----
export async function syncProductionFromCloud(standardId: string): Promise<ProductionEntry[]> {
  if (!isCloudEnabled()) return getLocalProduction(standardId);

  try {
    const { data, error } = await supabase
      .from("sms_production")
      .select("*")
      .eq("standard_id", standardId);

    if (error) throw error;

    const cloudEntries: ProductionEntry[] = (data || []).map(row => ({
      ...row.data,
      id: row.id,
      date: row.date,
      size: row.size
    }));

    const localEntries = getLocalProduction(standardId);
    
    // Merge: Keep all cloud entries, and add local entries not in cloud (then upload them)
    const cloudIds = new Set(cloudEntries.map(e => e.id));
    const toUpload = localEntries.filter(e => !cloudIds.has(e.id));
    const merged = [...cloudEntries, ...toUpload];

    localStorage.setItem(`sms_prod_${standardId}`, JSON.stringify(merged));

    // Upload local-only entries in the background
    if (toUpload.length > 0) {
      const payload = toUpload.map(e => ({
        id: e.id,
        standard_id: standardId,
        date: e.date,
        size: e.size,
        data: e
      }));
      supabase.from("sms_production").upsert(payload).then(res => {
        if (res.error) console.error("Error uploading local production entries:", res.error);
      });
    }

    return merged;
  } catch (err) {
    console.error("Failed to sync production from cloud:", err);
    return getLocalProduction(standardId);
  }
}

export function getLocalProduction(standardId: string): ProductionEntry[] {
  try {
    const raw = localStorage.getItem(`sms_prod_${standardId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveProductionEntry(standardId: string, entry: ProductionEntry): Promise<void> {
  const all = getLocalProduction(standardId);
  const idx = all.findIndex(e => e.id === entry.id || (e.date === entry.date && e.size === entry.size));
  if (idx >= 0) {
    all[idx] = entry;
  } else {
    all.unshift(entry);
  }
  localStorage.setItem(`sms_prod_${standardId}`, JSON.stringify(all));

  if (isCloudEnabled()) {
    try {
      const { error } = await supabase
        .from("sms_production")
        .upsert({
          id: entry.id,
          standard_id: standardId,
          date: entry.date,
          size: entry.size,
          data: entry,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });
      if (error) console.error("Cloud Save Error (Production):", error);
    } catch (err) {
      console.error("Cloud Save Error (Production):", err);
    }
  }
}

export async function deleteProductionEntry(standardId: string, entryId: string): Promise<void> {
  const all = getLocalProduction(standardId).filter(e => e.id !== entryId);
  localStorage.setItem(`sms_prod_${standardId}`, JSON.stringify(all));

  if (isCloudEnabled()) {
    try {
      const { error } = await supabase
        .from("sms_production")
        .delete()
        .eq("id", entryId);
      if (error) console.error("Cloud Delete Error (Production):", error);
    } catch (err) {
      console.error("Cloud Delete Error (Production):", err);
    }
  }
}

// ----- SMS DISPATCH -----
export async function syncDispatchFromCloud(standardId: string): Promise<DispatchEntry[]> {
  if (!isCloudEnabled()) return getLocalDispatch(standardId);

  try {
    const { data, error } = await supabase
      .from("sms_dispatch")
      .select("*")
      .eq("standard_id", standardId);

    if (error) throw error;

    const cloudEntries: DispatchEntry[] = (data || []).map(row => ({
      ...row.data,
      id: row.id,
      date: row.date,
      size: row.size,
      partyName: row.party_name,
      billNo: row.bill_no,
      batchNo: row.batch_no
    }));

    const localEntries = getLocalDispatch(standardId);
    const cloudIds = new Set(cloudEntries.map(e => e.id));
    const toUpload = localEntries.filter(e => !cloudIds.has(e.id));
    const merged = [...cloudEntries, ...toUpload];

    localStorage.setItem(`sms_disp_${standardId}`, JSON.stringify(merged));

    if (toUpload.length > 0) {
      const payload = toUpload.map(e => ({
        id: e.id,
        standard_id: standardId,
        date: e.date,
        size: e.size,
        party_name: e.partyName,
        bill_no: e.billNo,
        batch_no: e.batchNo,
        data: e
      }));
      supabase.from("sms_dispatch").upsert(payload).then(res => {
        if (res.error) console.error("Error uploading local dispatch entries:", res.error);
      });
    }

    return merged;
  } catch (err) {
    console.error("Failed to sync dispatch from cloud:", err);
    return getLocalDispatch(standardId);
  }
}

export function getLocalDispatch(standardId: string): DispatchEntry[] {
  try {
    const raw = localStorage.getItem(`sms_disp_${standardId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveDispatchEntry(standardId: string, entry: DispatchEntry): Promise<void> {
  const all = getLocalDispatch(standardId);
  const idx = all.findIndex(e => e.id === entry.id);
  if (idx >= 0) {
    all[idx] = entry;
  } else {
    all.unshift(entry);
  }
  localStorage.setItem(`sms_disp_${standardId}`, JSON.stringify(all));

  if (isCloudEnabled()) {
    try {
      const { error } = await supabase
        .from("sms_dispatch")
        .upsert({
          id: entry.id,
          standard_id: standardId,
          date: entry.date,
          size: entry.size,
          party_name: entry.partyName,
          bill_no: entry.billNo,
          batch_no: entry.batchNo,
          data: entry,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });
      if (error) console.error("Cloud Save Error (Dispatch):", error);
    } catch (err) {
      console.error("Cloud Save Error (Dispatch):", err);
    }
  }
}

export async function deleteDispatchEntry(standardId: string, entryId: string): Promise<void> {
  const all = getLocalDispatch(standardId).filter(e => e.id !== entryId);
  localStorage.setItem(`sms_disp_${standardId}`, JSON.stringify(all));

  if (isCloudEnabled()) {
    try {
      const { error } = await supabase
        .from("sms_dispatch")
        .delete()
        .eq("id", entryId);
      if (error) console.error("Cloud Delete Error (Dispatch):", error);
    } catch (err) {
      console.error("Cloud Delete Error (Dispatch):", err);
    }
  }
}

// ----- SMS CONSIGNEES -----
export async function syncConsigneesFromCloud(): Promise<Consignee[]> {
  if (!isCloudEnabled()) return getLocalConsignees();

  try {
    const { data, error } = await supabase
      .from("sms_consignees")
      .select("*");

    if (error) throw error;

    const cloudConsignees: Consignee[] = (data || []).map(row => ({
      ...row.data,
      id: row.id,
      name: row.name
    }));

    const localConsignees = getLocalConsignees();
    const cloudNames = new Set(cloudConsignees.map(c => c.name.toLowerCase()));
    
    // Add local-only consignees to upload
    const toUpload = localConsignees.filter(c => !cloudNames.has(c.name.toLowerCase()));
    const merged = [...cloudConsignees, ...toUpload];

    localStorage.setItem("sms_consignees", JSON.stringify(merged));

    if (toUpload.length > 0) {
      const payload = toUpload.map(c => ({
        id: c.id || Math.random().toString(36).substring(2, 9),
        name: c.name,
        data: c
      }));
      supabase.from("sms_consignees").upsert(payload, { onConflict: "name" }).then(res => {
        if (res.error) console.error("Error uploading local consignees:", res.error);
      });
    }

    return merged;
  } catch (err) {
    console.error("Failed to sync consignees from cloud:", err);
    return getLocalConsignees();
  }
}

export function getLocalConsignees(): Consignee[] {
  try {
    const raw = localStorage.getItem("sms_consignees");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveConsignee(consignee: Consignee): Promise<void> {
  const all = getLocalConsignees();
  const idx = all.findIndex(c => c.id === consignee.id || c.name.toLowerCase() === consignee.name.toLowerCase());
  if (idx >= 0) {
    all[idx] = consignee;
  } else {
    all.push(consignee);
  }
  localStorage.setItem("sms_consignees", JSON.stringify(all));

  if (isCloudEnabled()) {
    try {
      const { error } = await supabase
        .from("sms_consignees")
        .upsert({
          id: consignee.id || Math.random().toString(36).substring(2, 9),
          name: consignee.name,
          data: consignee
        }, { onConflict: "name" });
      if (error) console.error("Cloud Save Error (Consignee):", error);
    } catch (err) {
      console.error("Cloud Save Error (Consignee):", err);
    }
  }
}

export async function deleteConsignee(id: string, name: string): Promise<void> {
  const all = getLocalConsignees().filter(c => c.id !== id && c.name.toLowerCase() !== name.toLowerCase());
  localStorage.setItem("sms_consignees", JSON.stringify(all));

  if (isCloudEnabled()) {
    try {
      const { error } = await supabase
        .from("sms_consignees")
        .delete()
        .eq("name", name);
      if (error) console.error("Cloud Delete Error (Consignee):", error);
    } catch (err) {
      console.error("Cloud Delete Error (Consignee):", err);
    }
  }
}

// ----- CONVERSION SETTINGS -----
export async function syncConversionSettingsFromCloud(): Promise<Record<string, string>> {
  const localSettings: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("sms_conv_")) {
      localSettings[key] = localStorage.getItem(key) || "";
    }
  }

  if (!isCloudEnabled()) return localSettings;

  try {
    const { data, error } = await supabase
      .from("sms_conversion_settings")
      .select("*");

    if (error) throw error;

    const cloudSettings: Record<string, string> = {};
    (data || []).forEach(row => {
      cloudSettings[row.id] = row.val;
      localStorage.setItem(row.id, row.val);
    });

    // Upload local settings not in cloud
    const cloudKeys = new Set((data || []).map(row => row.id));
    const toUpload: { id: string; standard_id: string; key: string; val: string }[] = [];

    Object.keys(localSettings).forEach(k => {
      if (!cloudKeys.has(k)) {
        // Parse standardId out of key (e.g. sms_conv_value_is14483_V-2" -> is14483)
        const parts = k.split("_");
        const stdId = parts.length >= 4 ? parts[3] : "unknown";
        toUpload.push({
          id: k,
          standard_id: stdId,
          key: k,
          val: localSettings[k]
        });
      }
    });

    if (toUpload.length > 0) {
      supabase.from("sms_conversion_settings").upsert(toUpload).then(res => {
        if (res.error) console.error("Error uploading local conversion settings:", res.error);
      });
    }

    return { ...localSettings, ...cloudSettings };
  } catch (err) {
    console.error("Failed to sync conversion settings from cloud:", err);
    return localSettings;
  }
}

export async function saveConversionSetting(standardId: string, key: string, val: string): Promise<void> {
  localStorage.setItem(key, val);

  if (isCloudEnabled()) {
    try {
      const { error } = await supabase
        .from("sms_conversion_settings")
        .upsert({
          id: key,
          standard_id: standardId,
          key: key,
          val: val,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });
      if (error) console.error("Cloud Save Error (Conversion Setting):", error);
    } catch (err) {
      console.error("Cloud Save Error (Conversion Setting):", err);
    }
  }
}

// ----- STARTING STOCKS -----
export async function syncStartingStocksFromCloud(standardId: string): Promise<void> {
  if (!isCloudEnabled()) return;

  try {
    const { data, error } = await supabase
      .from("sms_starting_stocks")
      .select("*")
      .eq("standard_id", standardId);

    if (error) throw error;

    (data || []).forEach(row => {
      localStorage.setItem(row.id, row.val.toString());
    });

    // Scan local storage for starting stocks matching this standardId to upload
    const toUpload: { id: string; standard_id: string; size: string; year: number; month: string; val: number }[] = [];
    const prefix = `sms_last_stock_${standardId}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const valStr = localStorage.getItem(key);
        if (valStr !== null) {
          const parts = key.split("_");
          // Format is: sms_last_stock_{standardId}_{size}_{year}_{month}
          // e.g. ["sms", "last", "stock", "is14483", "V-2\" (50mm)", "2026", "January"]
          if (parts.length >= 7) {
            const month = parts[parts.length - 1];
            const year = Number(parts[parts.length - 2]);
            const size = parts.slice(4, parts.length - 2).join("_");
            toUpload.push({
              id: key,
              standard_id: standardId,
              size: size,
              year: isNaN(year) ? 2026 : year,
              month: month,
              val: Number(valStr) || 0
            });
          }
        }
      }
    }

    if (toUpload.length > 0) {
      supabase.from("sms_starting_stocks").upsert(toUpload).then(res => {
        if (res.error) console.error("Error uploading local starting stocks:", res.error);
      });
    }
  } catch (err) {
    console.error("Failed to sync starting stocks from cloud:", err);
  }
}

export async function saveStartingStock(standardId: string, sizeName: string, year: number, month: string, val: number): Promise<void> {
  const key = `sms_last_stock_${standardId}_${sizeName}_${year}_${month}`;
  localStorage.setItem(key, val.toString());

  if (isCloudEnabled()) {
    try {
      const { error } = await supabase
        .from("sms_starting_stocks")
        .upsert({
          id: key,
          standard_id: standardId,
          size: sizeName,
          year: year,
          month: month,
          val: val,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });
      if (error) console.error("Cloud Save Error (Starting Stock):", error);
    } catch (err) {
      console.error("Cloud Save Error (Starting Stock):", err);
    }
  }
}
