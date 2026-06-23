"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Building2,
  FolderKanban,
  Search,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import KpiCard from "@/components/KpiCard";

// Mock/fallback data for demo purposes when Sheet is not shared yet
const MOCK_PROJECTS = [
  // 2026
  { year: "2026", customerId: "GoDN Korea", projectId: "Kakao Business Integration" },
  { year: "2026", customerId: "GoDN Korea", projectId: "OTA Research & Development" },
  { year: "2026", customerId: "GoDN Korea", projectId: "KOC Outreach Campaign" },
  { year: "2026", customerId: "GoDN Korea", projectId: "LINE Mini-App Prototype" },
  { year: "2026", customerId: "Markee Agency", projectId: "Security Audit v2" },
  { year: "2026", customerId: "Markee Agency", projectId: "Cloud Migration Plan" },
  { year: "2026", customerId: "Markee Agency", projectId: "Firewall Upgrade" },
  { year: "2026", customerId: "PopTech Inc", projectId: "Global Website Redesign" },
  { year: "2026", customerId: "PopTech Inc", projectId: "SEO Optimization Campaign" },
  // 2025
  { year: "2025", customerId: "CG Lab", projectId: "PoC Testing Sandbox" },
  { year: "2025", customerId: "CG Lab", projectId: "ML Model Training Dashboard" },
  { year: "2025", customerId: "VinaRetail", projectId: "POS System API Integration" },
  { year: "2025", customerId: "VinaRetail", projectId: "Inventory Sync Service" },
  { year: "2025", customerId: "GoDN Korea", projectId: "Legacy Code Refactoring" },
  // 2024
  { year: "2024", customerId: "TechCorp", projectId: "Database Query Optimization" },
  { year: "2024", customerId: "TechCorp", projectId: "Data Lake Migration Project" },
  { year: "2024", customerId: "Markee Agency", projectId: "Corporate Website Hosting Setup" }
];

const MOCK_SUMMARY = {
  totalTasks: MOCK_PROJECTS.length,
  totalMandays: MOCK_PROJECTS.length * 12,
  totalKpi: Math.round(MOCK_PROJECTS.length * 0.9),
  lateTasks: 1,
  onTimeRate: "94%",
  qualityScore: "4.8"
};

const SERVICE_ACCOUNT_EMAIL = "poptech-pm@poptech-pm.iam.gserviceaccount.com";

interface ProjectData {
  year: string;
  customerId: string;
  projectId: string;
}

interface SummaryData {
  totalTasks: number | string;
  totalMandays: number | string;
  totalKpi: number | string;
  onTimeRate: string;
  qualityScore: string;
}

export default function YearsReportsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [needsShare, setNeedsShare] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/yearly-report");
        const json = await res.json();

        if (json.success && json.data) {
          setProjects(json.data.projects || []);
          setSummary(json.data.summary || null);
          setError(null);
          setNeedsShare(false);
        } else {
          setError(json.error || "Không thể tải dữ liệu từ Google Sheets");
          if (json.needsShare) {
            setNeedsShare(true);
            // Load mock data so user can see visual layouts
            setProjects(MOCK_PROJECTS);
            setSummary(MOCK_SUMMARY);
          }
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Lỗi mạng khi tải dữ liệu";
        setError(errorMsg);
        // Fallback to mock on network failures too for demonstration
        setProjects(MOCK_PROJECTS);
        setSummary(MOCK_SUMMARY);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group and Filter logic
  const years = ["All", ...Array.from(new Set(projects.map((p) => p.year)))].sort(
    (a, b) => (a === "All" ? -1 : b === "All" ? 1 : b.localeCompare(a))
  );

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = selectedYear === "All" || p.year === selectedYear;
    return matchesSearch && matchesYear;
  });

  // Group structure: Year -> Customer -> Project list
  const groupedData: Record<string, Record<string, string[]>> = {};

  filteredProjects.forEach((p) => {
    if (!groupedData[p.year]) {
      groupedData[p.year] = {};
    }
    if (!groupedData[p.year][p.customerId]) {
      groupedData[p.year][p.customerId] = [];
    }
    if (!groupedData[p.year][p.customerId].includes(p.projectId)) {
      groupedData[p.year][p.customerId].push(p.projectId);
    }
  });

  const toggleCustomer = (yearCustomerKey: string) => {
    setExpandedCustomers((prev) => ({
      ...prev,
      [yearCustomerKey]: !prev[yearCustomerKey],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Yearly Reports</h1>
        <p className="text-[11px] text-zinc-500 mt-0.5">Report grouped by Year → Customer → Project from Google Sheets</p>
      </div>

      {/* Lỗi mạng hoặc lỗi kết nối khác (không phải do chưa chia sẻ Sheet) */}
      {error && !needsShare && (
        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-4 flex gap-3 text-red-400 animate-fade-in">
          <AlertCircle className="text-red-500 shrink-0" size={18} />
          <div>
            <h4 className="text-xs font-semibold text-red-200">Lỗi kết nối API</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Thông báo chưa chia sẻ Sheet & Nút copy email */}
      {needsShare && (
        <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center animate-fade-in">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-amber-200">Google Sheet Chưa Được Chia Sẻ Quyền</h4>
              <p className="text-[10px] text-zinc-400 max-w-2xl leading-relaxed">
                Hệ thống đang hiển thị <strong>dữ liệu DEMO mẫu</strong>. Để lấy dữ liệu thực tế từ Sheet của bạn, hãy chia sẻ quyền xem (Viewer) cho email Service Account bên dưới:
              </p>
              <div className="flex items-center gap-1.5 mt-2 bg-black/40 px-2.5 py-1 rounded-md border border-zinc-800 w-fit">
                <span className="text-[10px] font-mono text-zinc-300">{SERVICE_ACCOUNT_EMAIL}</span>
                <button
                  onClick={handleCopyEmail}
                  className="text-zinc-500 hover:text-zinc-300 p-0.5 transition-colors cursor-pointer"
                  title="Sao chép email"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>
          <a
            href="https://docs.google.com/spreadsheets/d/1IwHmlrjM51-wsQi8oz3OSWImKaEuWEZws63oyP6iy9M/edit?gid=1094067039#gid=1094067039"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] bg-amber-600/10 hover:bg-amber-600/25 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/20 font-medium transition-all shrink-0 cursor-pointer"
          >
            Mở Google Sheet <ExternalLink size={10} />
          </a>
        </div>
      )}

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Projects"
            value={summary.totalTasks.toString()}
            percentage="Live"
            progress={100}
            footer={needsShare ? "Demo data mode" : "From Plan Link2 Sheet"}
          />
          <KpiCard
            title="Total Mandays"
            value={summary.totalMandays.toString()}
            percentage="Estimated"
            progress={100}
            footer="Calculated from tasks"
          />
          <KpiCard
            title="Total KPI"
            value={summary.totalKpi.toString()}
            percentage="90%"
            progress={90}
            footer="Tasks delivered"
          />
          <KpiCard
            title="On-time Rate"
            value={summary.onTimeRate}
            percentage="Optimal"
            progress={parseFloat(summary.onTimeRate) || 100}
            footer="Target exceeded"
          />
        </div>
      )}

      {/* Thanh bộ lọc & Tìm kiếm */}
      <div className="bg-[#121318] p-4 rounded-xl border border-zinc-800/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Tìm kiếm */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm khách hàng, dự án..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d0e12] border border-zinc-800/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 transition-colors"
          />
        </div>

        {/* Tabs chọn năm */}
        <div className="flex gap-1 bg-[#0d0e12] p-1 rounded-lg border border-zinc-800/80 w-full sm:w-auto overflow-x-auto scrollbar-none">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedYear === year
                  ? "bg-zinc-800 text-white border border-zinc-700/30"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {year === "All" ? "Tất cả các năm" : `Năm ${year}`}
            </button>
          ))}
        </div>
      </div>

      {/* Hiển thị danh sách phân cấp */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-zinc-400 text-xs gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Đang đồng bộ dữ liệu...</span>
        </div>
      ) : Object.keys(groupedData).length === 0 ? (
        <div className="text-center py-12 text-xs text-zinc-500 border border-dashed border-zinc-800/80 rounded-xl">
          Không tìm thấy dự án hoặc khách hàng nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedData)
            .sort((a, b) => b.localeCompare(a)) // Hiển thị năm gần nhất trước
            .map((year) => (
              <div key={year} className="space-y-3">
                {/* Year Header badge */}
                <div className="flex items-center gap-2 px-1">
                  <Calendar size={14} className="text-blue-400" />
                  <h2 className="text-sm font-bold text-zinc-100">Năm {year}</h2>
                  <span className="text-[10px] text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full border border-zinc-800/40">
                    {Object.values(groupedData[year]).reduce((acc, curr) => acc + curr.length, 0)} dự án
                  </span>
                </div>

                {/* Grid Customers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(groupedData[year])
                    .sort((a, b) => a.localeCompare(b))
                    .map((customer) => {
                      const customerKey = `${year}-${customer}`;
                      const isExpanded = expandedCustomers[customerKey] !== false; // Mặc định là mở rộng
                      const projectCount = groupedData[year][customer].length;

                      return (
                        <div
                          key={customer}
                          className="bg-[#121318] border border-zinc-800/60 rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:border-zinc-700/60"
                        >
                          {/* Customer Header - Clickable */}
                          <div
                            onClick={() => toggleCustomer(customerKey)}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/20 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 shrink-0">
                                <Building2 size={14} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-xs font-semibold text-zinc-100 truncate">{customer}</h3>
                                <p className="text-[10px] text-zinc-500">Khách hàng đối tác</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-zinc-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                                {projectCount} dự án
                              </span>
                              <span className="text-zinc-500">
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </span>
                            </div>
                          </div>

                          {/* Projects List inside Customer - Expandable */}
                          {isExpanded && (
                            <div className="border-t border-zinc-800/50 p-4 bg-[#0d0e12]/40 space-y-2.5 animate-slide-down">
                              {groupedData[year][customer].map((project, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#121318]/60 border border-zinc-800/50 hover:bg-[#121318]/90 hover:border-zinc-700/50 transition-all group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <FolderKanban size={13} className="text-zinc-500 group-hover:text-blue-400 transition-colors shrink-0" />
                                    <span className="text-[11px] font-medium text-zinc-300 group-hover:text-zinc-200 transition-colors truncate">
                                      {project}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                                      Hoàn thành
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
