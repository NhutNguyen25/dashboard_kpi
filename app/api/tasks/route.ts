import { NextResponse } from "next/server";
import { appendSheetData } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskName, leader, type, workdays } = body;

    // Thay "YOUR_SPREADSHEET_ID" bằng ID thật của bạn
    // Hoặc ID bạn đã định nghĩa: "1ej1tIq4nsR2xmFPL3Wpm47YjorVNsf4qmrW7uLxyvjo"
    await appendSheetData(
      "1ej1tIq4nsR2xmFPL3Wpm47YjorVNsf4qmrW7uLxyvjo", 
      "Tasks!A:D",
      [[taskName, leader, type, workdays]]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}