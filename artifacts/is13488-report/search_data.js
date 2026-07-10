import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const downloadsDir = 'C:\\Users\\jadav\\Downloads';

const files = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.xlsx'));

console.log('Searching in files:', files);

files.forEach(file => {
  try {
    const filePath = path.join(downloadsDir, file);
    const workbook = XLSX.readFile(filePath);
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);
      
      // Let's search for "Om Agrotect" or "17425"
      const matches = rows.filter(row => {
        const text = JSON.stringify(row).toLowerCase();
        return text.includes('om agrotect') || text.includes('17425');
      });

      if (matches.length > 0) {
        console.log(`\n==================================================`);
        console.log(`MATCH FOUND IN FILE: ${file} (Sheet: ${sheetName})`);
        console.log(`==================================================`);
        console.log(JSON.stringify(matches, null, 2));
      }
    });
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});
