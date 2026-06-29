import { google } from "googleapis";
import fs from "fs";
import path from "path";

function getCredentials() {
  const envCreds = process.env.GOOGLE_CREDENTIALS;
  if (envCreds) {
    try {
      return JSON.parse(envCreds);
    } catch {
      throw new Error("GOOGLE_CREDENTIALS is not valid JSON");
    }
  }

  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (email && key) {
    return {
      client_email: email,
      private_key: key.replace(/\\n/g, "\n"),
      type: "service_account",
    };
  }

  try {
    const credPath = path.join(process.cwd(), "lib", "credentials", "service-account.json");
    if (fs.existsSync(credPath)) {
      return JSON.parse(fs.readFileSync(credPath, "utf-8"));
    }
  } catch {
    // ignore
  }

  throw new Error(
    "Missing Google credentials. Set GOOGLE_CREDENTIALS / GOOGLE_CLIENT_EMAIL+GOOGLE_PRIVATE_KEY env var or place service-account.json in lib/credentials/"
  );
}

export async function getSheetsClient() {
  const credentials = getCredentials();
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  await auth.authorize();
  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

export async function listSheetTitles(spreadsheetId: string): Promise<string[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  const titles = (res.data.sheets || []).map((s) => s.properties?.title || "");
  return titles;
}

export async function getSheetData(sheetName: string, spreadsheetId: string): Promise<string[][]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });
  return (res.data.values as string[][]) || [];
}

export async function appendSheetData(
  spreadsheetId: string,
  range: string,
  values: string[][]
) {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
  return response.data;
}

export async function getDashboardData() {
  return { kpis: [], projects: [], weeklyReports: [] };
}

const db = {
  getSheetsClient,
  listSheetTitles,
  getSheetData,
  appendSheetData,
  getDashboardData,
};

export default db;