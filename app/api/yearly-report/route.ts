import { getSheetsClient } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";

const SPREADSHEET_ID = "1IwHmlrjM51-wsQi8oz3OSWImKaEuWEZws63oyP6iy9M";
const SHEET_NAME = "Plan Link2";


async function getFullReport(rawData: string[][]) {
    const projects = [];
    let totalMandays = 0;
    let totalKpi = 0;
    const uniqueCustomers = new Set<string>();
    const uniqueYears = new Set<string>();
    const KPI_DONE_COL = 9;     // Cột J
    const KPI_EST_COL = 10;     // Cột K
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        const customerId = row[1];
        const projectId = row[2];
        const year = row[3];

        if (customerId && projectId && year) {
            const yearStr = year.toString().trim();
            const yearMatch = yearStr.match(/^(\d{4})/);
            const parsedYear = yearMatch ? yearMatch[1] : "Khác";

            projects.push({
                year: parsedYear,
                customerId: customerId.toString().trim(),
                projectId: projectId.toString().trim(),
            });

            // Thêm vào Set để đếm số lượng duy nhất
            uniqueCustomers.add(customerId.toString().trim());
            if (parsedYear !== "Khác") {
                uniqueYears.add(parsedYear);
            }
        }

        // Tính tổng KPI DONE (Cột J)
        const kpiDoneValue = parseFloat(row[KPI_DONE_COL]);
        if (!isNaN(kpiDoneValue)) {
            totalMandays += kpiDoneValue;
        }

        // Tính tổng KPI EST (Cột K)
        const kpiEstValue = parseFloat(row[KPI_EST_COL]);
        if (!isNaN(kpiEstValue)) {
            totalKpi += kpiEstValue;
        }
    }

    const summary = {
        totalTasks: projects.length,
        totalCustomers: uniqueCustomers.size,
        totalYears: uniqueYears.size,
        totalMandays: totalMandays,
        totalKpi: totalKpi,
        onTimeRate: "N/A",
        qualityScore: "N/A"
    };

    return NextResponse.json({
        success: true,
        data: {
            projects,
            summary,
            weeklyActivity: []
        }
    });
}

async function getProjectDetails(rawData: string[][], projectName: string) {
    const PROJECT_NAME_COL = 2; // C
    const PROCESS_COL = 6;      // G
    const KPI_DONE_COL = 9;     // J
    const KPI_EST_COL = 10;     // K
    const STATUS_COL = 11;      // L

    const projectRow = rawData.find(row => row[PROJECT_NAME_COL] === projectName);

    if (!projectRow) {
        return NextResponse.json({ success: false, error: `Project "${projectName}" not found` }, { status: 404 });
    }

    const projectDetails = {
        kpiEst: projectRow[KPI_EST_COL] || "N/A",
        kpiDone: projectRow[KPI_DONE_COL] || "N/A",
        status: projectRow[STATUS_COL] || "N/A",
        process: projectRow[PROCESS_COL] || "N/A",
    };

    return NextResponse.json({ success: true, data: projectDetails });
}

export async function GET(request: NextRequest) {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME,
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
    console.error("Yearly report API error:", error);
    
    const isPermissionError = 
      err.message?.includes("permission") || 
      err.message?.includes("403") || 
      err.status === 403 || 
      err.code === 403;

    return NextResponse.json(
      { 
        success: false, 
        needsShare: isPermissionError,
        error: err.message || "Failed to fetch yearly report data" 
      },
      { status: isPermissionError ? 200 : 500 }
    );
  }
}
