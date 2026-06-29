import { getSheetsClient } from "@/lib/db";
import { NextResponse } from "next/server";

const SPREADSHEET_ID = "1IwHmlrjM51-wsQi8oz3OSWImKaEuWEZws63oyP6iy9M";
const SHEET_NAME = "Plan Link2";
const PROJECT_ID_COL_INDEX = 2; // Cột C (PROJECTID)

async function getSheetId(sheets: any, spreadsheetId: string, sheetName: string): Promise<number | null> {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = spreadsheet.data.sheets?.find((s: any) => s.properties?.title === sheetName);
    return sheet?.properties?.sheetId ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ success: false, error: "Thiếu ID dự án." }, { status: 400 });
    }

    const sheets = await getSheetsClient();

    // 1. Lấy sheetId (cần cho việc xóa)
    const sheetId = await getSheetId(sheets, SPREADSHEET_ID, SHEET_NAME);
    if (sheetId === null) {
        return NextResponse.json({ success: false, error: `Không tìm thấy Sheet với tên "${SHEET_NAME}"` }, { status: 404 });
    }

    // 2. Đọc dữ liệu để tìm ra chỉ số dòng (row index) cần xóa
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:C`, // Chỉ cần đọc đến cột C để tìm projectId
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Sheet rỗng." }, { status: 404 });
    }

    const rowIndex = rows.findIndex(row => row[PROJECT_ID_COL_INDEX] === projectId);

    if (rowIndex === -1) {
      return NextResponse.json({ success: false, error: `Không tìm thấy dự án "${projectId}" trong Sheet.` }, { status: 404 });
    }

    // 3. Tạo yêu cầu xóa dòng
    const deleteRequest = {
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        }],
      },
    };

    await sheets.spreadsheets.batchUpdate(deleteRequest);

    return NextResponse.json({ success: true, message: "Dự án đã được xóa thành công." });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("API delete-project error:", err);
    return NextResponse.json({ success: false, error: err.message || "Lỗi không xác định từ server." }, { status: 500 });
  }
}