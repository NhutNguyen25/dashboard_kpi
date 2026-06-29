import { getSheetsClient } from "@/lib/db";
import { NextResponse } from "next/server";

const SPREADSHEET_ID = "1IwHmlrjM51-wsQi8oz3OSWImKaEuWEZws63oyP6iy9M";
const SHEET_NAME = "Plan Link2";
const PROJECT_ID_COL_INDEX = 2; // Cột C (PROJECTID)

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { originalProjectId, newProjectData } = body;
    const { year, customerId, projectId } = newProjectData;

    if (!originalProjectId || !year || !customerId || !projectId) {
      return NextResponse.json({ success: false, error: "Dữ liệu không hợp lệ." }, { status: 400 });
    }

    const sheets = await getSheetsClient();

    // 1. Đọc dữ liệu để tìm ra chỉ số dòng (row index) cần sửa
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:C`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Sheet rỗng." }, { status: 404 });
    }

    const rowIndex = rows.findIndex(row => row[PROJECT_ID_COL_INDEX] === originalProjectId);

    if (rowIndex === -1) {
      return NextResponse.json({ success: false, error: `Không tìm thấy dự án gốc "${originalProjectId}".` }, { status: 404 });
    }

    // 2. Cập nhật dòng đã tìm thấy. Row trong API là 1-based.
    const rowNumber = rowIndex + 1;
    const updateRange = `${SHEET_NAME}!B${rowNumber}:D${rowNumber}`;
    const values = [[customerId, projectId, `${year}_Bid`]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: values,
      },
    });

    return NextResponse.json({ success: true, message: "Dự án đã được cập nhật." });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("API edit-project error:", err);
    return NextResponse.json({ success: false, error: err.message || "Lỗi không xác định từ server." }, { status: 500 });
  }
}