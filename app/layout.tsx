// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // Đảm bảo đường dẫn này đúng với file globals.css của bạn

export const metadata: Metadata = {
  title: "Pulse - KPI Dashboard",
  description: "Work Dashboard tracking system",
};

// BẮT BUỘC PHẢI CÓ "export default" Ở ĐÂY
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#0d0e12]">
      <body className="h-full antialiased m-0 p-0 text-zinc-100 bg-[#0d0e12]">
        {children}
      </body>
    </html>
  );
}