import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const filePath = "C:/Users/jadav/Downloads/IS 14483 PRODUCTION DATA.xlsx";

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
    return `${yr}-${matchDmy[2].padStart(2, "0")}-${matchDmy[1].padStart(2, "0")}`;
  }
  return s;
}

const mockValueRates: Record<string, number> = {
  "V-1\" (25mm)": 850,
  "V-2\" (50mm)": 1650
};

try {
  console.log(`Running dry run parse on: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets["production Data"];
  
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
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
    console.error("Failed to find headers");
    process.exit(1);
  }

  console.log("Found Header Row Index:", headerRowIdx);
  const headers = data[headerRowIdx].map(h => String(h || "").trim().toUpperCase());
  const dateColIdx = headers.findIndex(h => h.includes("DATE"));
  const sizeColIdx = headers.findIndex(h => h.includes("SIZE"));
  const nosColIdx = headers.findIndex(h => h.includes("PRODUCTION") || h.includes("NOS") || h.includes("QTY"));
  const valColIdx = headers.findIndex(h => h.includes("VALUE") || h.includes("RS"));

  console.log(`Column indices - Date: ${dateColIdx}, Size: ${sizeColIdx}, Nos: ${nosColIdx}, Value: ${valColIdx}`);

  const grouped: Record<string, any> = {};
  const errorMessages: string[] = [];

  for (let r = headerRowIdx + 1; r < data.length; r++) {
    const row = data[r];
    if (!row || row.length === 0 || row[dateColIdx] === undefined || row[dateColIdx] === null || String(row[dateColIdx]).trim() === "") continue;

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
      normalizedSize = rawSize;
    }

    const nosVal = nosColIdx !== -1 ? (Number(row[nosColIdx]) || 0) : 0;
    
    // Value check
    let valVal = valColIdx !== -1 ? (Number(row[valColIdx]) || 0) : 0;
    if (valVal === 0 && nosVal > 0) {
      const rate = mockValueRates[normalizedSize] || 0;
      valVal = Math.round(nosVal * rate);
    }

    const key = `${dateVal}_${normalizedSize}`;
    if (!grouped[key]) {
      grouped[key] = {
        date: dateVal,
        size: normalizedSize,
        nos: 0,
        pipe: 0,
        value: 0,
        rowCount: 0
      };
    }

    grouped[key].nos += nosVal;
    grouped[key].pipe += nosVal;
    grouped[key].value += Math.round(valVal);
    grouped[key].rowCount += 1;
  }

  const parsed = Object.values(grouped);
  console.log(`\nSuccessfully parsed and grouped into ${parsed.length} entries.`);
  console.log("Total errors/warnings:", errorMessages.length);

  console.log("\nFirst 10 grouped entries:");
  parsed.slice(0, 10).forEach(e => console.log(JSON.stringify(e)));

} catch (error) {
  console.error("Error during dry run:", error);
}
