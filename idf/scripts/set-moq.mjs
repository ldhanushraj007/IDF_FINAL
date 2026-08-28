import fs from 'fs';
import path from 'path';

const catalogJsonPath = path.resolve('public/catalog.json');
const rawData = fs.readFileSync(catalogJsonPath, 'utf8');
const catalog = JSON.parse(rawData);

let updatedJsonCount = 0;
catalog.items = catalog.items.map((item) => {
  item.minMetres = 0.5;
  if (item.minOrderMetres !== undefined) {
    item.minOrderMetres = 0.5;
  }
  updatedJsonCount++;
  return item;
});

fs.writeFileSync(catalogJsonPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`JSON Catalog: ${updatedJsonCount} of ${catalog.items.length} updated to 0.5 MOQ`);

// Update catalog-for-google-sheets.csv if exists
const csvPath = path.resolve('catalog-for-google-sheets.csv');
if (fs.existsSync(csvPath)) {
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n');
  if (lines.length > 1) {
    const headers = lines[0].split(',');
    const minMetresIdx = headers.findIndex(h => h.trim() === 'minMetres');
    const minOrderMetresIdx = headers.findIndex(h => h.trim() === 'minOrderMetres');
    const minMetresCol = minMetresIdx !== -1 ? minMetresIdx : minOrderMetresIdx;

    if (minMetresCol !== -1) {
      let updatedCsvCount = 0;
      const newLines = lines.map((line, idx) => {
        if (idx === 0 || !line.trim()) return line;
        const cells = line.split(',');
        if (cells[minMetresCol] !== undefined) {
          cells[minMetresCol] = '0.5';
          updatedCsvCount++;
        }
        return cells.join(',');
      });
      fs.writeFileSync(csvPath, newLines.join('\n'), 'utf8');
      console.log(`CSV Catalog: ${updatedCsvCount} rows updated to 0.5 MOQ`);
    }
  }
}

// Update src/data/catalog.ts catalog object
const catalogTsPath = path.resolve('src/data/catalog.ts');
if (fs.existsSync(catalogTsPath)) {
  let tsContent = fs.readFileSync(catalogTsPath, 'utf8');
  // Use regex to replace minMetres values inside the CATALOG array
  tsContent = tsContent.replace(/minMetres:\s*[0-9.]+/g, 'minMetres: 0.5');
  fs.writeFileSync(catalogTsPath, tsContent, 'utf8');
  console.log(`TS Catalog File: updated inline minMetres fields to 0.5`);
}
