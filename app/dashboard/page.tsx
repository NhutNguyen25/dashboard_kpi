"use client";

import React, { useEffect, useState } from "react";
import { Copy, Check, AlertCircle, ExternalLink, Calendar, User, ArrowUpRight } from "lucide-react";
import KpiCard from "@/components/KpiCard";
import WeeklyChart from "@/components/WeeklyChart";

interface ProjectItem {
  name: string;
  client: string;
  status: string;
  color: string;
  progress: number;
  date: string;
}

interface SummaryData {
  totalTasks: number;
  totalMandays: number;
  totalKpi: number;
  lateTasks: number;
  onTimeRate: string;
  qualityScore: string;
}

interface WeeklyActivityItem {
  name: string;
  Completed: number;
  Planned: number;
}

const SERVICE_ACCOUNT_EMAIL = "poptech-pm@poptech-pm.iam.gserviceaccount.com";

// Demo/Fallback data
const MOCK_SUMMARY: SummaryData = {
  totalTasks: 17,
  totalMandays: 204,
  totalKpi: 15,
  lateTasks: 1,
  onTimeRate: "94%",
  qualityScore: "4.8"
};

const MOCK_PROJECTS: ProjectItem[] = [
  { name: "Kakao Business Integration", client: "GoDN Korea", status: "In Progress", color: "bg-blue-500/10 text-blue-400 border border-blue-500/20", progress: 85, date: "2026-06-15" },
  { name: "OTA Research & Development", client: "GoDN Korea", status: "In Progress", color: "bg-purple-500/10 text-purple-400 border border-purple-500/20", progress: 70, date: "2026-06-15" },
  { name: "Security Audit v2", client: "Markee Agency", status: "In Progress", color: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20", progress: 90, date: "2026-06-15" },
  { name: "Global Website Redesign", client: "PopTech Inc", status: "In Progress", color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", progress: 60, date: "2026-06-15" }
];

const MOCK_WEEKLY_ACTIVITY = [
  { name: "W1", Completed: 3, Planned: 4 },
  { name: "W2", Completed: 5, Planned: 5 },
  { name: "W3", Completed: 4, Planned: 6 },
  { name: "W4", Completed: 6, Planned: 7 },
  { name: "W5", Completed: 5, Planned: 5 },
  { name: "W6", Completed: 7, Planned: 8 }
];

export default function YearsReportsPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [needsShare, setNeedsShare] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Cấu trúc danh sách các năm và customer trống (Đã fix hoàn toàn lỗi trùng Key cho Vercel)
  const yearlyStructure = [
    {
      year: "2024",
      customers: [{ id: 1, name: "Customer 1" }, { id: 2, name: "Customer 2" }, { id: 3, name: "Customer 3" }],
    },
    {
      year: "2025",
      customers: [{ id: 1, name: "Customer 1" }, { id: 2, name: "Customer 2" }, { id: 3, name: "Customer 3" }],
    },
    {
      year: "2026",
      customers: [{ id: 1, name: "Customer 1" }, { id: 2, name: "Customer 2" }, { id: 3, name: "Customer 3" }],
    },
    {
      year: "2027",
      customers: [{ id: 1, name: "Customer 1" }, { id: 2, name: "Customer 2" }, { id: 3, name: "Customer 3" }],
    },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/yearly-report");
        const json = await res.json();

        if (json.success && json.data) {
          setSummary(json.data.summary);
          setWeeklyActivity(json.data.weeklyActivity || []);
          setError(null);
          setNeedsShare(false);

          const rawProjects = json.data.projects || [];
          if (rawProjects.length > 0) {
            const mapped = rawProjects.map((p: { projectId: string; customerId: string; year: string }, idx: number) => {
              const colors = [
                "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                "bg-purple-500/10 text-purple-400 border border-purple-500/20",
                "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
                "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              ];
              return {
                name: p.projectId,
                client: p.customerId,
                status: "In Progress",
                color: colors[idx % colors.length],
                progress: 65 + (idx * 9) % 30,
                date: `${p.year}-06-15`
              };
            });
            setProjects(mapped);
          } else {
            setProjects([]);
          }
        } else {
          setError(json.error || "Không thể đồng bộ dữ liệu từ Sheet");
          if (json.needsShare) {
            setNeedsShare(true);
            setSummary(MOCK_SUMMARY);
            setProjects(MOCK_PROJECTS);
            setWeeklyActivity(MOCK_WEEKLY_ACTIVITY);
          }
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Lỗi kết nối mạng";
        setError(errorMsg);
        setNeedsShare(true);
        setSummary(MOCK_SUMMARY);
        setProjects(MOCK_PROJECTS);
        setWeeklyActivity(MOCK_WEEKLY_ACTIVITY);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400 text-sm gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        <span>Connecting to Google Cloud Platform...</span>
      </div>
    );
  }

  if (error && !needsShare) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-900/50 text-red-400 rounded-xl text-sm">
        <p className="font-semibold">API Connection Error:</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Tiêu đề */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, Alex</h1>
          <p className="text-xs text-zinc-400">Here is how your work is tracking this quarter.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-[#121318] border border-zinc-800/60 text-zinc-300 text-[11px] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer">
            <option>2024</option>
            <option>2025</option>
            <option>2026</option>
            <option>2027</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium px-4 py-1.5 rounded-lg transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      {/* Thông báo quyền truy cập Sheet */}
      {needsShare && (
        <div className="mb-6 bg-amber-950/20 border border-amber-900/50 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center animate-fade-in">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-amber-200">Google Sheet Connection Awaiting Access</h4>
              <p className="text-[10px] text-zinc-400 max-w-2xl leading-relaxed">
                Hệ thống đang hiển thị <strong>dữ liệu DEMO mẫu</strong>. Để đồng bộ Dashboard trực tiếp với Sheet của bạn, hãy chia sẻ quyền xem (Viewer) cho email Service Account dưới đây:
              </p>
              <div className="flex items-center gap-1.5 mt-2 bg-black/40 px-2.5 py-1 rounded-md border border-zinc-800 w-fit">
                <span className="text-[10px] font-mono text-zinc-300">{SERVICE_ACCOUNT_EMAIL}</span>
                <button
                  onClick={handleCopyEmail}
                  className="text-zinc-500 hover:text-zinc-300 p-0.5 transition-colors cursor-pointer"
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
            Open Sheet <ExternalLink size={10} />
          </a>
        </div>
      )}

      {/* 4 CARD KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard 
          title="Total Tasks" 
          value={(summary?.totalTasks ?? 0).toString()} 
          percentage={summary?.onTimeRate || "0%"} 
          progress={parseFloat(summary?.onTimeRate || "0")} 
          footer={needsShare ? "Demo data mode" : "From Plan Link2 sheet"} 
        />
        <KpiCard 
          title="Total Mandays" 
          value={(summary?.totalMandays ?? 0).toString()} 
          percentage="100%" 
          progress={100} 
          footer="Estimated" 
        />
        <KpiCard 
          title="Total KPI" 
          value={(summary?.totalKpi ?? 0).toString()} 
          percentage={summary?.onTimeRate || "0%"} 
          progress={parseFloat(summary?.onTimeRate || "0")} 
          footer="Calculated" 
        />
        <KpiCard 
          title="Late Tasks" 
          value={(summary?.lateTasks ?? 0).toString()} 
          percentage="0%" 
          progress={0} 
          footer="Tasks with late days" 
        />
      </div>

      {/* BIỂU ĐỒ & LIST DỰ ÁN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <WeeklyChart chartData={weeklyActivity} />

        <div className="bg-[#121318] p-6 rounded-xl border border-zinc-800/80 flex flex-col justify-between min-h-[280px]">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">Active projects</h3>
              <p className="text-xs text-zinc-400">{projects.length} in progress</p>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12 text-xs text-zinc-600 border border-dashed border-zinc-800/80 rounded-xl flex flex-col items-center justify-center gap-1.5 min-h-[160px]">
                <span>No active projects found</span>
                <span className="text-[10px] text-zinc-700">Data read successfully from Plan Link2</span>
              </div>
            ) : (
              <div className="space-y-4 max-h-[240px] overflow-y-auto pr-1">
                {projects.slice(0, 5).map((p, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-medium text-white hover:underline cursor-pointer truncate">{p.name}</h4>
                        <p className="text-[10px] text-zinc-500 truncate">{p.client}</p>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${p.color} shrink-0`}>• {p.status}</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${p.progress}%` }} />
                    </div>
                    <p className="text-[10px] text-zinc-500 text-right">{p.date}</p>
                  </div>
                ))}
                {projects.length > 5 && (
                  <p className="text-[10px] text-zinc-500 text-center pt-1 font-medium">
                    + {projects.length - 5} more projects in Yearly Reports
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ALL YEARS REPORT BOX BỔ SUNG */}
      <div className="bg-[#121318] rounded-xl border border-zinc-800/80 overflow-hidden">
        <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">ALL YEARS REPORT</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Task completion by years and customers</p>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {yearlyStructure.map((item) => (
            <div 
              key={item.year} 
              className="bg-[#16171d] rounded-xl p-3 border border-zinc-800/80 hover:border-zinc-700/60 transition-all"
            >
              {/* Tiêu đề Năm kèm Icon */}
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-bold text-zinc-200 tracking-wider">YEAR {item.year}</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600" />
              </div>

              {/* Danh sách Khách hàng rỗng theo năm */}
              <div className="space-y-2">
                {item.customers.map((customer) => (
                  <div 
                    key={`${item.year}-customer-${customer.id}`} 
                    className="flex items-center justify-between bg-[#121318] p-2 rounded-lg border border-zinc-800/40"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-zinc-800/50">
                        <User className="w-3 h-3 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-zinc-300">{customer.name}</p>
                        <p className="text-[9px] text-zinc-600">-- tasks</p>
                      </div>
                    </div>

                    <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium bg-zinc-800 text-zinc-500 border border-zinc-700/30">
                      No Data
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}