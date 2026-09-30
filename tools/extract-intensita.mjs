import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const source = "C:/Users/AliceClemente/OneDrive/PALESTRA/Schede mie.xlsx";
const outDir = "C:/Users/AliceClemente/Documents/Codex/2026-07-30/cody-ho-un-problema-enorme-ieri/work/excel-inspection";
const input = await FileBlob.load(source);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("Intensità agosto ottobre");
const values = sheet.getRange("A1:AH97").values;
const nonEmptyRows = values.map((row, index) => ({ row:index + 1, values:row })).filter((item) => item.values.some((value) => value !== null && value !== undefined && String(value).trim() !== ""));
await fs.writeFile(`${outDir}/intensita-values.json`, JSON.stringify(nonEmptyRows, null, 2), "utf8");
const preview = await workbook.render({ sheetName:"Intensità agosto ottobre", range:"A1:AH97", scale:1, format:"png" });
await fs.writeFile(`${outDir}/Intensita.png`, new Uint8Array(await preview.arrayBuffer()));
console.log(JSON.stringify({ rows:nonEmptyRows.length, first:nonEmptyRows.slice(0, 12), output:`${outDir}/intensita-values.json` }, null, 2));
