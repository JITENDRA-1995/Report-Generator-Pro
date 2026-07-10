import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const filePath = "C:/Users/jadav/Downloads/IS 4985 PRODUCTION DATA.xlsx";

// Defined standard sizes for IS 4985
const sizes = [
  "63mm Cl-2", "75mm Cl-2", "75mm Cl-3", "90mm Cl-2", "90mm Cl-3",
  "110mm Cl-2", "110mm Cl-3", "140mm Cl-2", "140mm Cl-3", "160mm Cl-2", "160mm Cl-3"
];

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

try {
  console.log(`Running dry run parse on: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets["DAILY PRODUCTION"];
  
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
  const pipeColIdx = headers.findIndex(h => h.includes("PIPE") || h.includes("QTY"));
  const tonnColIdx = headers.findIndex(h => h.includes("TON") || h.includes("TONN") || h.includes("WEIGHT"));
  const valColIdx = headers.findIndex(h => h.includes("VALUE") || h.includes("RS"));

  const grouped: Record<string, any> = {};
  const errorMessages: string[] = [];

  for (let r = headerRowIdx + 1; r < data.length; r++) {
    const row = data[r];
    if (!row || row.length === 0 || row[dateColIdx] === undefined || row[dateColIdx] === null || String(row[dateColIdx]).trim() === "") continue;

    const dateStr = String(row[dateColIdx]).trim();
    if (dateStr.toLowerCase().startsWith("total") || dateStr.toLowerCase().includes("daily")) {
      continue;
    }

    const dateVal = parseExcelDate(row[dateColIdx]);
    const rawSize = String(row[sizeColIdx] || "").trim();
    if (!rawSize) continue;

    const normalizedSize = sizes.find(s => s.toLowerCase() === rawSize.toLowerCase());
    if (!normalizedSize) {
      errorMessages.push(`Row ${r + 1}: Size "${rawSize}" is not configured.`);
      continue;
    }

    const pipeVal = pipeColIdx !== -1 ? (Number(row[pipeColIdx]) || 0) : 0;
    const tonnVal = tonnColIdx !== -1 ? (Number(row[tonnColIdx]) || 0) : 0;
    let kgVal = tonnVal * 1000;
    
    // Simulate fallback weight if kg is 0
    if (kgVal === 0 && pipeVal > 0) {
      const mockWeights: Record<string, number> = {
        "75mm Cl-2": 3.9,
        "90mm Cl-2": 5.5,
        "110mm Cl-2": 7.8,
        "140mm Cl-2": 13,
        "160mm Cl-2": 17,
        "140mm Cl-3": 18.7
      };
      const weightPerPipe = mockWeights[normalizedSize] || 0;
      kgVal = pipeVal * weightPerPipe;
    }
    const valVal = valColIdx !== -1 ? (Number(row[valColIdx]) || 0) : 0;

    const key = `${dateVal}_${normalizedSize}`;
    if (!grouped[key]) {
      grouped[key] = {
        date: dateVal,
        size: normalizedSize,
        pipe: 0,
        tonn: 0,
        kg: 0,
        value: 0,
        rowCount: 0
      };
    }

    grouped[key].pipe += pipeVal;
    grouped[key].tonn += tonnVal;
    grouped[key].kg += kgVal;
    grouped[key].value += Math.round(valVal);
    grouped[key].rowCount += 1;
  }

  // Format decimal values
  Object.keys(grouped).forEach(k => {
    grouped[k].tonn = Number(grouped[k].tonn.toFixed(3));
    grouped[k].kg = Number(grouped[k].kg.toFixed(2));
  });

  const parsed = Object.values(grouped);
  console.log(`\nSuccessfully parsed and grouped into ${parsed.length} entries.`);
  console.log("Total errors/warnings:", errorMessages.length);

  // Check specific test date (2026-01-27, which was Excel 46049 in row index 9 and 10)
  const testDate = "2026-01-27";
  const testSize = "90mm Cl-2";
  const matched = parsed.find((e: any) => e.date === testDate && e.size === testSize);
  console.log(`\nVerification check for Date: ${testDate}, Size: ${testSize}`);
  if (matched) {
    console.log("Matched Entry:", JSON.stringify(matched, null, 2));
    if (matched.pipe === 725 && matched.tonn === 3.99 && matched.value === 343140) {
      console.log("✅ CHECK PASSED: Values match expected totals!");
    } else {
      console.error("❌ CHECK FAILED: Expected pipe=725, tonn=3.99, value=343140");
    }
  } else {
    console.error("❌ CHECK FAILED: Entry not found!");
  }

} catch (error) {
  console.error("Error during dry run:", error);
}
