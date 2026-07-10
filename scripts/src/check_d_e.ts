import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const filePath = "C:/Users/jadav/Downloads/IS 14483 PRODUCTION DATA.xlsx";

try {
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets["production Data"];
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:E1000");
  
  let nonEmtpyDOrE = 0;
  for (let r = range.s.r; r <= range.e.r; r++) {
    const dVal = worksheet[XLSX.utils.encode_cell({ r, c: 3 })]?.v;
    const eVal = worksheet[XLSX.utils.encode_cell({ r, c: 4 })]?.v;
    if (dVal || eVal) {
      nonEmtpyDOrE++;
      if (nonEmtpyDOrE < 10) {
        console.log(`Row ${r}: D = ${dVal}, E = ${eVal}`);
      }
    }
  }
  console.log(`Total non-empty D or E cells: ${nonEmtpyDOrE}`);
} catch (error) {
  console.error("Error reading file:", error);
}
