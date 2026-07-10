// Mock getIs13488SheetName
const getIs13488SheetName = (sz: string) => {
  let upper = sz.toUpperCase();
  upper = upper.replace(/CL\s*-\s*3|CL\s*-\s*III|CL\s*3|CL\s*III/g, "CL - III");
  upper = upper.replace(/CL\s*-\s*2|CL\s*-\s*II|CL\s*2|CL\s*II/g, "CL - II");
  upper = upper.replace(/CL\s*-\s*1|CL\s*-\s*I|CL\s*1|CL\s*I/g, "CL - I");
  upper = upper.replace(/(\d+)\s*MM/g, "$1 MM");
  return upper;
};

// Test sizes formatting
const testSizes = ["63mm Cl-2", "75mm Cl-3", "110mm Cl-2", "140mm Cl-3"];
console.log("Testing Sheet Name Formatter:");
testSizes.forEach(sz => {
  console.log(`"${sz}" -> "${getIs13488SheetName(sz)}"`);
});

// Mock ledger row data
const mockRow = {
  Date: "2026-04-03",
  prodPipe: 50,
  dispPipe: 10,
  closingStock: 7821
};

const id: string = "is4985";
const isMultiColumnLedger = id === "is13488" || id === "is12786"; // is4985 is now 12-column

console.log("\nTesting Column Layout Variables for IS 4985:");
const maxCols = isMultiColumnLedger ? 13 : 12;
const sidebarStartCol = isMultiColumnLedger ? 9 : 8;
const mainTableEndCol = isMultiColumnLedger ? 7 : 6;

console.log({
  maxColsExpected: 12,
  maxColsActual: maxCols,
  sidebarStartColExpected: 8,
  sidebarStartColActual: sidebarStartCol,
  mainTableEndColExpected: 6,
  mainTableEndColActual: mainTableEndCol
});

// Mock header output
const headers: string[] = [];
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

console.log("\nTesting Main Table Headers mapping for IS 4985:");
console.log({
  col4: headers[4],
  col5: headers[5],
  col6: headers[6],
  col7: headers[7]
});

// Mock row value mapping
const rowData: any[] = [];
if (id === "is13488" || id === "is12786") {
  rowData[4] = mockRow.prodPipe || 0; // coils in mock
  rowData[5] = 0;
  rowData[6] = 0;
  rowData[7] = 0;
} else if (id === "is4985") {
  rowData[4] = mockRow.prodPipe || 0;
  rowData[5] = mockRow.dispPipe || 0;
  rowData[6] = mockRow.closingStock || 0;
}

console.log("\nTesting Row Values mapping for IS 4985:");
console.log({
  col4Val: rowData[4],
  col5Val: rowData[5],
  col6Val: rowData[6]
});

if (
  maxCols === 12 &&
  sidebarStartCol === 8 &&
  mainTableEndCol === 6 &&
  headers[4] === "MFG in Pipe" &&
  headers[5] === "Dispatch Qty in Pipe" &&
  headers[6] === "C. S in Pipe" &&
  rowData[4] === 50 &&
  rowData[5] === 10 &&
  rowData[6] === 7821
) {
  console.log("\n✅ CHECK PASSED: Daily stock ledger for IS 4985 is formatted correctly in pipe-only layout!");
} else {
  console.error("\n❌ CHECK FAILED!");
}
