import { getSheetsClient } from "../lib/db";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load env
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const SPREADSHEET_ID = "1IwHmlrjM51-wsQi8oz3OSWImKaEuWEZws63oyP6iy9M";

async function main() {
  try {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    console.log("All sheets in the spreadsheet:");
    res.data.sheets?.forEach((sheet) => {
      console.log(`- Title: "${sheet.properties?.title}", ID (gid): ${sheet.properties?.sheetId}`);
    });
  } catch (err: any) {
    console.error("Error fetching spreadsheet metadata:", err);
  }
}

main();
