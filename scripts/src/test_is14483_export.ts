import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

// Test that column layout variables are resolved correctly for is14483
const id: string = "is14483";
const isMultiColumnLedger = id === "is13488" || id === "is12786";
const maxCols = isMultiColumnLedger ? 13 : 12;
const sidebarStartCol = isMultiColumnLedger ? 9 : 8;
const mainTableEndCol = isMultiColumnLedger ? 7 : 6;
const monthColLetter = isMultiColumnLedger ? "J" : "I";

console.log("--- COLUMN LAYOUT VARIABLES FOR IS 14483 ---");
console.log(`isMultiColumnLedger: ${isMultiColumnLedger} (Expected: false)`);
console.log(`maxCols: ${maxCols} (Expected: 12)`);
console.log(`sidebarStartCol: ${sidebarStartCol} (Expected: 8)`);
console.log(`mainTableEndCol: ${mainTableEndCol} (Expected: 6)`);
console.log(`monthColLetter: ${monthColLetter} (Expected: I)`);

if (maxCols === 12 && sidebarStartCol === 8 && mainTableEndCol === 6 && monthColLetter === "I") {
  console.log("✅ Column layout variables are correct!");
} else {
  console.error("❌ Column layout variables mismatch!");
}

// Test standard title generation
const sz = "V-2\" (50mm)";
const getIs13488SheetName = (sz: string) => {
  let upper = sz.toUpperCase();
  upper = upper.replace(/CL\s*-\s*3|CL\s*-\s*III|CL\s*3|CL\s*III/g, "CL - III");
  upper = upper.replace(/CL\s*-\s*2|CL\s*-\s*II|CL\s*2|CL\s*II/g, "CL - II");
  upper = upper.replace(/CL\s*-\s*1|CL\s*-\s*I|CL\s*1|CL\s*I/g, "CL - I");
  upper = upper.replace(/(\d+)\s*MM/g, "$1 MM");
  return upper;
};
const formattedSizeName = isMultiColumnLedger ? getIs13488SheetName(sz) : sz.toUpperCase();
const title = id === "is12786"
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

console.log("\n--- TITLE GENERATION FOR IS 14483 ---");
console.log(`Generated Title: "${title}"`);
const expectedTitle = ` IS CODE : 14483 VENTURI INJECTOR (V-2" (50MM))`;
if (title === expectedTitle) {
  console.log("✅ Title matches expected pattern!");
} else {
  console.error(`❌ Title mismatch! Expected: "${expectedTitle}"`);
}

// Test headers
const headers: string[] = [];
headers[0] = "Date";
headers[1] = "Party Name";
headers[2] = "Bill No";
headers[3] = "Batch No";
if (id === "is13488" || id === "is12786") {
  headers[4] = "MFG in Roll";
  headers[5] = " MFG in Meter";
  headers[6] = "Dispatch QTY in Meter";
  headers[7] = "C. S in Meter";
} else if (id === "is4985") {
  headers[4] = "MFG in Pipe";
  headers[5] = "Dispatch Qty in Pipe";
  headers[6] = "C. S in Pipe";
} else {
  headers[4] = "MFG in Nos";
  headers[5] = "Dispatch QTY in Nos";
  headers[6] = "C. S in Nos";
}

console.log("\n--- HEADERS FOR IS 14483 ---");
console.log(`Headers: ${JSON.stringify(headers.filter(h => h !== null))}`);
const expectedHeaders = ["Date", "Party Name", "Bill No", "Batch No", "MFG in Nos", "Dispatch QTY in Nos", "C. S in Nos"];
if (JSON.stringify(headers.slice(0, 7)) === JSON.stringify(expectedHeaders)) {
  console.log("✅ Headers match expected pattern!");
} else {
  console.error(`❌ Headers mismatch! Expected: ${JSON.stringify(expectedHeaders)}`);
}
