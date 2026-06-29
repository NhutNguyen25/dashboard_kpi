import { getSheetsClient } from "@/lib/db";
import { NextResponse } from "next/server";

const SPREADSHEET_ID = "1IwHmlrjM51-wsQi8oz3OSWImKaEuWEZws63oyP6iy9M";
const SHEET_NAME = "Plan Link2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { year, customerId, projectId } = body;

    // Validate dữ liệu đầu vào chống truyền rỗng
    if (!year || !customerId || !projectId) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu không hợp lệ. Vui lòng điền đủ thông tin Năm, Khách hàng và Tên dự án." },
        { status: 400 }
      );
    }

    // Kết nối đến Google Sheets thông qua thư viện db gốc
    const sheets = await getSheetsClient();

    // Định dạng dữ liệu ghi nhận vào các cột: A (trống), B (Khách hàng), C (Tên dự án), D (Năm_Bid)
    const values = [
      ["", customerId, projectId, `${year}_Bid`],
    ];

    // Tiến hành append thêm dòng mới vào Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: values,
      },
    });

    return NextResponse.json({ success: true, message: "Dự án đã được thêm vào Google Sheet thành công!" });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("API add-project error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Lỗi không xác định từ server khi kết nối Google Sheets." },
      { status: 500 }
    );
  }
}