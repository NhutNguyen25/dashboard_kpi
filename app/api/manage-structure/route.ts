import { getSheetsClient } from "@/lib/db";
import { NextResponse } from "next/server";

const SPREADSHEET_ID = "1IwHmlrjM51-wsQi8oz3OSWImKaEuWEZws63oyP6iy9M";
const SHEET_NAME = "Plan Link2";

// Chỉ số các cột quan trọng
const CUSTOMER_COL_INDEX = 1; // Cột B
const PROJECT_COL_INDEX = 2;  // Cột C
const YEAR_COL_INDEX = 3;     // Cột D

async function getSheetId(sheets: any, spreadsheetId: string, sheetName: string): Promise<number | null> {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = spreadsheet.data.sheets?.find((s: any) => s.properties?.title === sheetName);
    return sheet?.properties?.sheetId ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entity, action, source, mode, destination, name } = body;

    const sheets = await getSheetsClient();

    // 1. Đọc toàn bộ dữ liệu từ Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`,
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Sheet rỗng." }, { status: 404 });
    }

    const requests = [];
    const sheetId = await getSheetId(sheets, SPREADSHEET_ID, SHEET_NAME);
    if (!sheetId) throw new Error("Không tìm thấy Sheet ID.");

    // Xử lý hành động "add"
    if (action === 'add') {
      if (!name) {
        return NextResponse.json({ success: false, error: "Tên không được để trống." }, { status: 400 });
      }
      let values;
      if (entity === 'year') {
        // Thêm một dòng trống với chỉ có năm
        values = [["", "", "", `${name}_Bid`]];
      } else { // entity === 'customer'
        // Thêm một dòng trống với chỉ có khách hàng
        values = [["", name, "", ""]];
      }
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:D`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });
      return NextResponse.json({ success: true, message: `Đã thêm ${entity} thành công.` });
    }

    // 2. Lặp ngược để xóa không bị lỗi chỉ số
    for (let i = rows.length - 1; i >= 1; i--) {
      const row = rows[i];
      const rowYear = (row[YEAR_COL_INDEX] || '').match(/^(\d{4})/)?.[1];
      const rowCustomer = row[CUSTOMER_COL_INDEX];

      let match = false;
      if (entity === 'year' && rowYear === source) {
        match = true;
      } else if (entity === 'customer' && rowCustomer === source) {
        match = true;
      }

      if (match) {
        if (mode === 'cascade') {
          // Thêm yêu cầu xóa dòng vào batch
          requests.push({
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: i,
                endIndex: i + 1,
              },
            },
          });
        } else if (mode === 'move') {
          // Thêm yêu cầu cập nhật dòng vào batch
          let newValues;
          let range;
          if (entity === 'year') {
            range = `${SHEET_NAME}!D${i + 1}`;
            newValues = [[`${destination}_Bid`]];
          } else { // entity === 'customer'
            range = `${SHEET_NAME}!B${i + 1}`;
            newValues = [[destination]];
          }
          
          requests.push({
            updateCells: {
              rows: [{ values: [{ userEnteredValue: { stringValue: newValues[0][0] } }] }],
              fields: "userEnteredValue",
              start: {
                sheetId: sheetId,
                rowIndex: i,
                columnIndex: entity === 'year' ? YEAR_COL_INDEX : CUSTOMER_COL_INDEX,
              },
            },
          });
        }
      }
    }

    // 3. Thực thi batch update nếu có yêu cầu
    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests },
      });
    }

    return NextResponse.json({ success: true, message: `Đã xử lý ${requests.length} dòng.` });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("API manage-structure error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Lỗi không xác định từ server." },
      { status: 500 }
    );
  }
}