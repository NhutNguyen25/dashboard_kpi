import { getSheetsClient } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";

const SPREADSHEET_ID = "1IwHmlrjM51-wsQi8oz3OSWImKaEuWEZws63oyP6iy9M";
const SHEET_NAME = "Plan Link2";

// ==========================================
// 1. CÁC HÀM XỬ LÝ CHO PHƯƠNG THỨC GET
// ==========================================
async function getFullReport(rawData: string[][]) {
    const projects = [];
    let totalMandays = 0;
    let totalKpi = 0;
    const uniqueCustomers = new Set<string>();
    const uniqueContracts = new Set<string>();
    const uniqueSales = new Set<string>();
    const uniqueYears = new Set<string>();
    
    const CONTRACT_COL = 4;   // Cột E
    const KPI_DONE_COL = 9;   // Cột J
    const KPI_EST_COL = 10;   // Cột K
    const STATUS_COL = 11;    // Cột L
    const SALE_COL = 13;      // Cột N

    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        const customerId = row[1];
        const projectId = row[2];
        const year = row[3];
        const contract = row[CONTRACT_COL];
        const status = row[STATUS_COL];
        const sale = row[SALE_COL];

        if (customerId && projectId && year) {
            const yearStr = year.toString().trim();
            const yearMatch = yearStr.match(/^(\d{4})/);
            const parsedYear = yearMatch ? yearMatch[1] : yearStr;

            projects.push({
                year: parsedYear,
                customerId: customerId.toString().trim(),
                projectId: projectId.toString().trim(),
                contract: contract || '',
                status: status || 'Chưa có',
                sale: sale || '',
            });

            uniqueCustomers.add(customerId.toString().trim());
            if (contract) uniqueContracts.add(contract.toString().trim());
            if (sale) uniqueSales.add(sale.toString().trim());

            uniqueYears.add(parsedYear);
        }

        const kpiDoneValue = parseFloat(row[KPI_DONE_COL]);
        if (!isNaN(kpiDoneValue)) totalMandays += kpiDoneValue;

        const kpiEstValue = parseFloat(row[KPI_EST_COL]);
        if (!isNaN(kpiEstValue)) totalKpi += kpiEstValue;
    }

    const summary = {
        totalTasks: projects.length,
        totalCustomers: uniqueCustomers.size,
        totalYears: uniqueYears.size,
        totalContracts: uniqueContracts.size,
        totalSales: uniqueSales.size,
        totalMandays: totalMandays,
        totalKpi: totalKpi,
        onTimeRate: "N/A",
        qualityScore: "N/A"
    };

    return NextResponse.json({
        success: true,
        data: { projects, summary, weeklyActivity: [] }
    });
}

async function getProjectDetails(rawData: string[][], projectName: string) {
    const PROJECT_NAME_COL = 2; // C
    const PROCESS_COL = 6;      // G
    const KPI_DONE_COL = 9;     // J
    const KPI_EST_COL = 10;     // K
    const STATUS_COL = 11;      // L
    const CONTRACT_COL = 4;     // E
    const SALE_COL = 13;        // N

    const projectRow = rawData.find(row => row[PROJECT_NAME_COL] === projectName);

    if (!projectRow) {
        return NextResponse.json({ success: false, error: `Project "${projectName}" not found` }, { status: 404 });
    }

    const projectDetails = {
        kpiEst: projectRow[KPI_EST_COL] || "N/A",
        kpiDone: projectRow[KPI_DONE_COL] || "N/A",
        status: projectRow[STATUS_COL] || "Chưa có",
        process: projectRow[PROCESS_COL] || "N/A",
        contract: projectRow[CONTRACT_COL] || "N/A",
        sale: projectRow[SALE_COL] || "N/A",
    };

    return NextResponse.json({ success: true, data: projectDetails });
}

export async function GET(request: NextRequest) {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:N`,
    });
    const rawData = response.data.values as string[][] | null | undefined;

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({
        success: true,
        data: { projects: [], summary: { totalTasks: 0 }, weeklyActivity: [] }
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectParam = searchParams.get('project');

    if (projectParam) {
        return await getProjectDetails(rawData, projectParam);
    } else {
        return await getFullReport(rawData);
    }
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; code?: number };
    console.error("Yearly report GET error:", error);
    const isPermissionError = err.message?.includes("permission") || err.status === 403;
    return NextResponse.json(
      { success: false, needsShare: isPermissionError, error: err.message || "Failed to fetch data" },
      { status: isPermissionError ? 200 : 500 }
    );
  }
}

// ==========================================
// 2. CÁC HÀM XỬ LÝ CHO PHƯƠNG THỨC POST (THÊM / SỬA / XÓA)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, entityType, projectId, newStatus, rowData } = body;
    const sheets = await getSheetsClient();

    // Trường hợp 1: Cập nhật nhanh trạng thái từ ô Dropdown trực tiếp tại dòng dự án
    if (projectId && newStatus && !action) {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!C:C`,
      });
      const rows = response.data.values;
      if (!rows) return NextResponse.json({ success: false, error: "Dữ liệu trống." }, { status: 404 });
      
      const rowIndex = rows.findIndex(row => row[0] === projectId);
      if (rowIndex === -1) return NextResponse.json({ success: false, error: "Không tìm thấy dự án." }, { status: 404 });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!L${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[newStatus]] },
      });
      return NextResponse.json({ success: true, message: "Trạng thái đã được cập nhật nhanh." });
    }

    // Trường hợp 2: Thao tác từ Modal Form tổng (Thêm, Chỉnh Sửa, Xóa)
    if (action && entityType) {
      // LUỒNG CHỈNH SỬA CHO THỰC THỂ: DỰ ÁN
      if (entityType === "project") {
        if (action === "create") {
          // Thêm hàng mới vào cuối trang tính
          const newRow = ["", rowData.customerId, rowData.projectId, rowData.year, rowData.contract, "", "", "", "", "", rowData.status, "", rowData.sale];
          await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:N`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [newRow] },
          });
          return NextResponse.json({ success: true, message: "Đã thêm dự án thành công." });
        }

        // Định vị dòng để Sửa hoặc Xóa
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!C:C`,
        });
        const rows = response.data.values;
        if (!rows) return NextResponse.json({ success: false, error: "Dữ liệu trống." }, { status: 404 });
        const rowIndex = rows.findIndex(row => row[0] === projectId);
        if (rowIndex === -1) return NextResponse.json({ success: false, error: "Không tìm thấy thực thể cần xử lý." }, { status: 404 });
        const targetRow = rowIndex + 1;

        if (action === "update") {
          const statusToSave = rowData.status === "Chưa có" ? "" : rowData.status;
          // Cập nhật các ô cụ thể tương ứng B (Client), C (Project), D (Year), E (Contract), L (Status), N (Sale)
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!B${targetRow}:E${targetRow}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [[rowData.customerId, rowData.projectId, rowData.year, rowData.contract]] },
          });
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!L${targetRow}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [[statusToSave]] },
          });
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!N${targetRow}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [[rowData.sale]] },
          });
          return NextResponse.json({ success: true, message: "Đã cập nhật dự án thành công." });
        }

        if (action === "delete") {
          // Xóa hoặc dọn sạch dòng dữ liệu
          await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A${targetRow}:N${targetRow}`,
          });
          return NextResponse.json({ success: true, message: "Đã xóa dòng dữ liệu thành công." });
        }
      }

      // LUỒNG XỬ LÝ CHO KHÁCH HÀNG HOẶC NĂM (Tìm theo cột tương ứng để cập nhật)
      const colLetter = entityType === "customer" ? "B" : "D";
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${colLetter}:${colLetter}`,
      });
      const rows = response.data.values;
      if (!rows) return NextResponse.json({ success: false, error: "Dữ liệu trống." }, { status: 404 });
      
      if (action === "update") {
        // Cập nhật tất cả các dòng có chứa Tên cũ thành Tên mới
        const targetValue = body.oldValue;
        const updatePromises = [];
        for (let i = 0; i < rows.length; i++) {
          if (rows[i][0] === targetValue) {
            updatePromises.push(
              sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!${colLetter}${i + 1}`,
                valueInputOption: "USER_ENTERED",
                requestBody: { values: [[body.newValue]] },
              })
            );
          }
        }
        await Promise.all(updatePromises);
        return NextResponse.json({ success: true, message: `Cập nhật danh sách ${entityType} thành công.` });
      }

      if (action === "delete") {
        // Dọn sạch các dòng thuộc khách hàng hoặc năm được chọn
        const targetValue = body.targetValue;
        const clearPromises = [];
        for (let i = 0; i < rows.length; i++) {
          if (rows[i][0] === targetValue) {
            clearPromises.push(
              sheets.spreadsheets.values.clear({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A${i + 1}:N${i + 1}`,
              })
            );
          }
        }
        await Promise.all(clearPromises);
        return NextResponse.json({ success: true, message: `Đã dọn sạch dữ liệu ${entityType} thành công.` });
      }
    }

    return NextResponse.json({ success: false, error: "Hành động yêu cầu không hợp lệ." }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Yearly report POST error:", err);
    return NextResponse.json({ success: false, error: err.message || "Lỗi xử lý API." }, { status: 500 });
  }
}