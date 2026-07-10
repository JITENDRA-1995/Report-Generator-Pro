import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const filePath = "C:/Users/jadav/Downloads/IS 14483 PRODUCTION DATA.xlsx";

try {
  const workbook = XLSX.readFile(filePath);
  console.log("Sheet names in IS 14483 PRODUCTION DATA.xlsx:", workbook.SheetNames);
  
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert worksheet to raw 2D array
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:Z100");
    console.log(`\n--- SHEET: ${sheetName} ---`);
    console.log(`Sheet ref: ${worksheet["!ref"]}, columns: ${range.e.c - range.s.c + 1}, rows: ${range.e.r - range.s.r + 1}`);
    
    const rawRows: any[][] = [];
    for (let r = range.s.r; r <= range.e.r; r++) {
      const row: any[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = worksheet[cellRef];
        row.push(cell ? cell.v : "");
      }
      rawRows.push(row);
    }
    
    console.log("--- FIRST 15 RAW ROWS ---");
    for (let i = 0; i < Math.min(15, rawRows.length); i++) {
      console.log(`Row ${i}:`, JSON.stringify(rawRows[i]));
    }

    // Inspect unique sizes if size column is present
    // Let's print out potential size values or anything that looks like size mapping
  }
} catch (error) {
  console.error("Error reading file:", error);
}
