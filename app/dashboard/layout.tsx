// app/(dashboard)/layout.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, BarChart3, FileText, Calendar } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();


// Sửa lại mảng menuItems trong file app/(dashboard)/layout.tsx của bạn:
const menuItems = [
  { icon: <LayoutDashboard size={16} />, label: "Dashboard", href: "/dashboard" }, // Đổi từ "/" thành "/dashboard"
  { icon: <FolderKanban size={16} />, label: "Projects", href: "/dashboard/projects" }, // Thêm /dashboard
  { icon: <BarChart3 size={16} />, label: "KPIs", href: "/dashboard/kpis" }, // Thêm /dashboard
  { icon: <FileText size={16} />, label: "Weekly Reports", href: "/dashboard/weekly-reports" }, // Thêm /dashboard
  { icon: <Calendar size={16} />, label: "Yearly Reports", href: "/dashboard/years" }, // Thêm /dashboard
];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0e12] text-zinc-100 antialiased selection:bg-blue-500/30">
      
      {/* SIDEBAR BÊN TRÁI - CỐ ĐỊNH CẤU TRÚC */}
      <aside className="w-56 border-r border-zinc-800/80 bg-[#0d0e12] p-4 flex flex-col justify-between shrink-0 h-full">
        <div>
          {/* Logo khối Pulse */}
          <div className="flex items-center gap-2.5 mb-6 px-1">
            <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm">⚡</div>
            <div>
              <h2 className="font-semibold text-xs leading-tight text-zinc-100">Pulse</h2>
              <span className="text-[10px] text-zinc-500 block">Work Dashboard</span>
            </div>
          </div>

          {/* Danh mục menu điều hướng */}
          <div>
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider block mb-2 px-2">Workspace</span>
            <nav className="space-y-0.5">
              {menuItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={index}
                    href={item.href}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                      isActive 
                        ? "bg-zinc-800/90 text-zinc-100 shadow-sm border border-zinc-700/30" 
                        : "text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-300"
                    }`}
                  >
                    <span className={isActive ? "text-blue-500" : "text-inherit"}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Thông tin cá nhân dưới cùng Sidebar */}
        <div className="flex items-center gap-2.5 pt-3.5 border-t border-zinc-800/80 px-1">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[11px] font-bold text-zinc-300 shrink-0">
            AT
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-zinc-500 truncate">© 2026 SecurityZone Team</p>
          </div>
        </div>
      </aside>

      {/* KHU VỰC CHỨA NỘI DUNG CHÍNH BÊN PHẢI */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        

        {/* Luồng render nội dung của các trang con */}
        <main className="flex-1 p-6 overflow-y-auto bg-[#0d0e12]">
          <div className="max-w-5xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
