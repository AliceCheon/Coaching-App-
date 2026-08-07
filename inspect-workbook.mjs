import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const source = "C:/Users/AliceClemente/OneDrive/PALESTRA/Schede mie.xlsx";
const outDir = "C:/Users/AliceClemente/Documents/Codex/2026-07-30/cody-ho-un-problema-enorme-ieri/work/excel-inspection";
await fs.mkdir(outDir, { recursive: true });

const input = await FileBlob.load(source);
const workbook = await SpreadsheetFile.importXlsx(input);
const summary = await workbook.inspect({ kind: "workbook,sheet,table", maxChars: 12000, tableMaxRows: 8, tableMaxCols: 12, tableMaxCellChars: 120 });
await fs.writeFile(`${outDir}/summary.ndjson`, summary.ndjson, "utf8");

const sheetNames = workbook.worksheets.items.map((sheet) => sheet.name);
for (const sheetName of sheetNames) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const used = sheet.getUsedRange();
  const inspect = await workbook.inspect({ kind: "region", sheetId: sheetName, range: used.address || undefined, maxChars: 30000, tableMaxRows: 100, tableMaxCols: 30, tableMaxCellChars: 160 });
  await fs.writeFile(`${outDir}/${sheetName.replace(/[^a-z0-9_-]+/gi, "_")}.ndjson`, inspect.ndjson, "utf8");
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${outDir}/${sheetName.replace(/[^a-z0-9_-]+/gi, "_")}.png`, new Uint8Array(await preview.arrayBuffer()));
}

console.log(JSON.stringify({ sheetNames, outDir }, null, 2));
