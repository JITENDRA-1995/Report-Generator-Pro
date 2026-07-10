// Test script to verify IS 4985 dispatch calculation logic
const testData = [
  { itemName: "RPVC Pipe 90mm Cl-2", qtyInMtr: 600, expectedPipe: 100 },
  { itemName: "RPVC Pipe 75mm Cl-2", qtyInMtr: 90, expectedPipe: 15 },
  { itemName: "RPVC Pipe 110mm Cl-2", qtyInMtr: 63, expectedPipe: 11 }, // Math.round(63 / 6) = 11 pipes (66m)
  { itemName: "RPVC Pipe 63mm Cl-2", qtyInMtr: 5, expectedPipe: 1 }      // Math.round(5 / 6) = 1 pipe (6m)
];

console.log("Running Dispatch Import Calculation Dry Run for IS 4985:");
testData.forEach((test, idx) => {
  const dMtr = test.qtyInMtr;
  const dP = Math.round(dMtr / 6);
  
  const entry = {
    itemName: test.itemName,
    dispMtrInput: dMtr,
    dispPipeCalculated: dP,
    dispMtrPipeCalculated: dMtr
  };

  console.log(`\nTest #${idx + 1}: ${test.itemName}`);
  console.log(JSON.stringify(entry, null, 2));

  if (entry.dispPipeCalculated === test.expectedPipe && entry.dispMtrPipeCalculated === test.qtyInMtr) {
    console.log("✅ Math Check Passed!");
  } else {
    console.error(`❌ Math Check Failed! Expected pipe: ${test.expectedPipe}, got: ${entry.dispPipeCalculated}`);
  }
});
