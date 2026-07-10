import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const filePath = "C:/Users/jadav/Downloads/IS 4985 PRODUCTION DATA.xlsx";

try {
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets["DAILY PRODUCTION"];
  
  // Convert worksheet to raw 2D array
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:Z100");
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
  
  console.log("\n--- FIRST 15 RAW ROWS ---");
  for (let i = 0; i < Math.min(15, rawRows.length); i++) {
    console.log(`Row ${i}:`, JSON.stringify(rawRows[i]));
  }

  console.log("\n--- UNIQUE VALUES IN COLUMN C (Size & Class, index 2) ---");
  const colCValues = new Set<string>();
  for (let i = 2; i < rawRows.length; i++) {
    const val = rawRows[i][2];
    if (val && typeof val === "string") {
      colCValues.add(val.trim());
    }
  }
  console.log(Array.from(colCValues));

  // Inspect the sidebar conversion values
  console.log("\n--- INSPECTING SIDEBAR COLUMNS (Columns I to L, index 8 to 11) ---");
  const sidebarRows: any[][] = [];
  for (let i = 0; i < Math.min(30, rawRows.length); i++) {
    const sidebarRow = rawRows[i].slice(8, 12);
    if (sidebarRow.some(cell => cell !== "")) {
      sidebarRows.push([i, ...sidebarRow]);
    }
  }
  console.log("Sidebar Rows (RowIndex, ColI, ColJ, ColK, ColL):");
  sidebarRows.forEach(row => {
    console.log(`Row ${row[0]}:`, JSON.stringify(row.slice(1)));
  });

} catch (error) {
  console.error("Error reading file:", error);
}
