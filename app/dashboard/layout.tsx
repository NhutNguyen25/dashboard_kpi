// app/dashboard/layout.tsx
"use client";

import styles from "./layout.module.css";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  FileText,
  Calendar,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Building2,
  Trash2,
  Menu
} from "lucide-react";

interface ProjectData {
  year: string;
  customerId: string;
  projectId: string;
}

const MOCK_PROJECTS_SIDEBAR: ProjectData[] = [
  { year: "2025", customerId: "59.0. POPTECH_Intern", projectId: "[2025] Plan LAB NGFW Firewall Sophos (Lê Tây)" },
  { year: "2025", customerId: "59.0. POPTECH_Intern", projectId: "[2025] Plan LAB NGFW Firewall PaloAlto (Huy Hiệp)" },
  { year: "2025", customerId: "59.0. POPTECH_Intern", projectId: "5. Intern" },
  { year: "2025", customerId: "59.0. POPTECH_Intern", projectId: "[2025] Plan LAB SD-WAN Sophos v1.2 (Lê Tây)" },
  { year: "2025", customerId: "59.0. POPTECH_Intern", projectId: "[2025] Plan LAB NGFW Firewall Fortinet (Huy Hiệp)" },
  { year: "2025", customerId: "59.0. POPTECH_Intern", projectId: "[2025] Plan LAB Load Balancer F5 (Đức Minh)" },
  { year: "2025", customerId: "59.0. POPTECH_Intern", projectId: "[2025] Intern Security Operations Guide (Minh Quân)" },
  { year: "2025", customerId: "59.0. POPTECH_Intern", projectId: "[2025] Intern Cloud Pentest Laboratory (Bảo Lâm)" },
  { year: "2025", customerId: "43.1. CPCIT", projectId: "[2024] Gia hạn bảo hành G34" },
  { year: "2025", customerId: "43.1. CPCIT", projectId: "[2025] Nâng cấp hệ thống Switch mạng tòa nhà CPCIT" },
  { year: "2025", customerId: "59.35. TrungNguyen", projectId: "[2025] Cafe Trung Nguyên" }
];

const menuItems = [
  { icon: <LayoutDashboard size={16} />, label: "Dashboard", href: "/dashboard" },
  { icon: <FolderKanban size={16} />, label: "Projects", href: "/dashboard/projects" },
  { icon: <BarChart3 size={16} />, label: "KPIs", href: "/dashboard/kpis" },
  { icon: <FileText size={16} />, label: "Weekly Reports", href: "/dashboard/weekly-reports" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchSidebarData() {
      try {
        const res = await fetch("/api/yearly-report");
        const json = await res.json();
        if (json.success && json.data && json.data.projects) {
          setProjects(json.data.projects);
        } else {
          setProjects(MOCK_PROJECTS_SIDEBAR);
        }
      } catch {
        setProjects(MOCK_PROJECTS_SIDEBAR);
      }
    }
    fetchSidebarData();
  }, []);

  return (
    <div className={styles.rootLayout}>
      {/* Lớp phủ (Overlay) cho Sidebar trên di động */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className={styles.sidebarOverlay}
        ></div>
      )}
      
      {/* SIDEBAR BÊN TRÁI */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarHeader}>
            <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm">⚡</div>
            <div>
              <h2 className="font-semibold text-xs leading-tight text-zinc-100">Pulse</h2>
              <span className="text-[10px] text-zinc-500 block">Work Dashboard</span>
            </div>
          </div>

          <div>
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider block mb-2 px-2">Workspace</span>
            <nav className="space-y-0.5">
              {menuItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={index}
                    href={item.href}
                    className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`}
                  >
                    <span className={isActive ? styles.menuItemIconActive : ""}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}

              <div className="pt-1.5 border-t border-zinc-800/50 mt-1.5">
                <Suspense fallback={<div className="text-[10px] text-zinc-600 pl-4 py-2">Đang tải danh sách...</div>}>
                  <YearlyReportsTree projects={projects} />
                </Suspense>
              </div>
            </nav>
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[11px] font-bold text-zinc-300 shrink-0">
            AT
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-zinc-500 truncate">© 2026 SecurityZone Team</p>
          </div>
        </div>
      </aside>

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <div className={styles.mainContentWrapper}>
        {/* Header phụ cho di động */}
        <header className={styles.mobileHeader}>
          <button onClick={() => setIsSidebarOpen(true)} className="p-1 text-zinc-400 hover:text-zinc-100">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs">⚡</div>
            <h2 className="font-semibold text-xs leading-tight text-zinc-100">Project Manager</h2>
          </div>
          <div className="w-8"></div> {/* Spacer */}
        </header>

        <main className={styles.mainContent}>
          <div className={styles.mainContentInner}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function YearlyReportsTree({ projects }: { projects: ProjectData[] }) {
  const searchParams = useSearchParams();
  const activeProjectQuery = searchParams.get("project");
  const activeYearQuery = searchParams.get("year");
  const activeCustomerQuery = searchParams.get("customer");
  const pathname = usePathname();
  const router = useRouter();
  
  const [isYearlyReportsExpanded, setIsYearlyReportsExpanded] = useState<boolean>(false);
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});

  const toggleYear = (year: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleCustomer = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCustomers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const grouped: Record<string, Record<string, string[]>> = {};
  projects
    .filter((p) => p.year !== "Khác")
    .forEach((p) => {
      if (!grouped[p.year]) grouped[p.year] = {};
      if (!grouped[p.year][p.customerId]) grouped[p.year][p.customerId] = [];
      if (!grouped[p.year][p.customerId].includes(p.projectId)) {
        grouped[p.year][p.customerId].push(p.projectId);
      }
    });

  const sortedYears = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className={styles.treeRoot}>
      {/* Level 1: Root Header */}
      <div className={styles.treeNode}>
        <Link
          href="/dashboard/years"
          className={`${styles.treeNodeLink} ${pathname === "/dashboard/years" && !activeProjectQuery ? styles.treeNodeLinkActive : styles.treeNodeLinkInactive}`}
        >
          <Calendar size={16} className={pathname === "/dashboard/years" && !activeProjectQuery ? styles.treeNodeIconActive : styles.treeNodeIcon} />
          <span>Project Manager</span>
        </Link>
        <button
          onClick={() => setIsYearlyReportsExpanded(!isYearlyReportsExpanded)}
          className={styles.treeToggleButton}
        >
          {isYearlyReportsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Level 2: Years */}
      {isYearlyReportsExpanded && (
        <div className={styles.treeLevel2Container}>
          {sortedYears.map((year) => {
            const isYearExpanded = expandedYears[year] === true;
            const customers = Object.keys(grouped[year]).sort((a, b) => a.localeCompare(b));

            return (
              <div key={year} className="space-y-0.5">
                <div className={styles.treeLevel2Node}>
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={(e) => toggleYear(year, e)}
                      className={styles.treeToggleButton}
                    >
                      {isYearExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                    <div className="flex items-center gap-1.5 min-w-0 text-zinc-400">
                      {isYearExpanded ? (
                        <FolderOpen size={13} className="text-blue-500/80 shrink-0" />
                      ) : (
                        <Folder size={13} className="text-blue-500/60 shrink-0" />
                      )}
                      <span>YEAR {year}</span>
                    </div>
                  </div>
                </div>

                {/* Level 3: Customers */}
                {isYearExpanded && (
                  <div className={styles.treeLevel3Container}>
                    {customers.map((customer) => {
                      const customerKey = `${year}-${customer}`;
                      const isCustomerExpanded = expandedCustomers[customerKey] === true;
                      const customerProjects = grouped[year][customer];

                      const isCustomerActive = activeYearQuery === year && activeCustomerQuery === customer;

                      return (
                        <div key={customer} className="space-y-0.5">
                          {/* Level 3: Customer Link */}
                          <Link
                            href={`/dashboard/years?year=${year}&customer=${encodeURIComponent(customer)}`}
                            className={`${styles.treeLevel3Link} ${isCustomerActive ? styles.treeLevel3LinkActive : ""}`}
                          >
                            <Building2 size={12} className={isCustomerActive ? styles.treeLevel3IconActive : styles.treeLevel3Icon} />
                            <span className="truncate">{customer}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}