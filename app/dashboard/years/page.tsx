"use client";
import Link from "next/link";
import styles from "./years.module.css";
import React, { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  ChevronRight,
  TrendingUp,
  Award,
  Clock,
  Briefcase,
  PlusCircle,
  Pencil,
  Trash2,
  File,
  Layers
} from "lucide-react";
import KpiCard from "@/components/KpiCard";
import WeeklyChart from "@/components/WeeklyChart";

const SERVICE_ACCOUNT_EMAIL = "poptech-pm@poptech-pm.iam.gserviceaccount.com";

interface ProjectData {
  year: string;
  customerId: string;
  projectId: string;
}

interface EditingProjectData {
  originalProjectId: string;
  year: string;
  customerId: string;
  projectId: string;
}

interface SummaryData {
  totalTasks: number | string;
  totalMandays: number | string;
  totalCustomers: number | string;
  totalYears: number | string;
  totalKpi: number | string;
  onTimeRate: string;
  qualityScore: string;
}

interface ProjectDetailsData {
  kpiEst: string;
  kpiDone: string;
  status: string;
  process: string;
}


export default function YearsReportsPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400 text-sm gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Đang tải báo cáo...</span></div>}>
      <YearsReportsContent />
    </Suspense>
  );
}

function YearsReportsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedProject = searchParams.get("project");
  const selectedYearParam = searchParams.get("year");
  const selectedCustomerParam = searchParams.get("customer");

  // State for the main project list
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [needsShare, setNeedsShare] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // State for the detailed view of a selected project
  const [projectDetails, setProjectDetails] = useState<ProjectDetailsData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});

  // State for "Add Project" Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ year: "", customerId: "", projectId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // State for "Edit Project" Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<EditingProjectData | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editSubmitMessage, setEditSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // State for Customer Combobox in Add Modal
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerComboboxRef = useRef<HTMLDivElement>(null);

  // State for Structure Management Modal
  const [isStructureMenuOpen, setIsStructureMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<null | 'add-year' | 'delete-year' | 'add-customer' | 'delete-customer'>(null);
  const structureMenuRef = useRef<HTMLDivElement>(null);

  const openModal = (modalName: typeof activeModal) => {
    setActiveModal(modalName);
    setIsStructureMenuOpen(false);
  }

  // Effect to fetch the main list of projects
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
            setProjects([]);
            setSummary(null);
          }
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Lỗi mạng khi tải dữ liệu";
        setError(errorMsg);
        setProjects([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/add-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      const result = await res.json();

      if (result.success) {
        setSubmitMessage({ type: 'success', text: 'Thêm dự án thành công! Đang làm mới dữ liệu...' });
        setTimeout(() => {
          setIsModalOpen(false);
          setIsCustomerDropdownOpen(false);
          setNewProject({ year: "", customerId: "", projectId: "" });
          // Yêu cầu Next.js tải lại dữ liệu mới từ server cho toàn bộ trang
          router.refresh();
        }, 1500);
      } else {
        setSubmitMessage({ type: 'error', text: result.error || 'Có lỗi xảy ra.' });
      }
    } catch (error) {
      const err = error as Error;
      setSubmitMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!selectedProject) return;
    const projectToEdit = projects.find(p => p.projectId === selectedProject);
    if (projectToEdit) {
      setEditingProject({
        originalProjectId: projectToEdit.projectId,
        year: projectToEdit.year,
        customerId: projectToEdit.customerId,
        projectId: projectToEdit.projectId,
      });
      setEditSubmitMessage(null);
      setIsEditModalOpen(true);
    } else {
      alert("Không tìm thấy thông tin dự án để sửa.");
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    setIsSubmittingEdit(true);
    setEditSubmitMessage(null);

    try {
      const res = await fetch('/api/edit-project', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalProjectId: editingProject.originalProjectId,
          newProjectData: { year: editingProject.year, customerId: editingProject.customerId, projectId: editingProject.projectId }
        }),
      });
      const result = await res.json();
      if (result.success) {
        setEditSubmitMessage({ type: 'success', text: 'Cập nhật thành công! Đang làm mới...' });
        setTimeout(() => {
          setIsEditModalOpen(false);
          router.push(`/dashboard/years?project=${encodeURIComponent(editingProject.projectId)}`);
          router.refresh();
        }, 1500);
      } else {
        setEditSubmitMessage({ type: 'error', text: result.error || 'Có lỗi xảy ra.' });
      }
    } catch (error) {
      setEditSubmitMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setIsSubmittingEdit(false);
    }
  };



  // Effect to fetch details when a project is selected
  useEffect(() => {
    if (!selectedProject) {
        setProjectDetails(null);
        setDetailsError(null);
        return;
    }

    async function fetchDetails() {
        setDetailsLoading(true);
        setDetailsError(null);
        try {
            const res = await fetch(`/api/yearly-report?project=${encodeURIComponent(selectedProject || "")}`);
            const json = await res.json();
            if (json.success) {
                setProjectDetails(json.data);
            } else {
                setDetailsError(json.error || "Failed to fetch project details.");
                setProjectDetails(null);
            }
        } catch (err) {
            setDetailsError(err instanceof Error ? err.message : "Network error fetching details.");
            setProjectDetails(null);
        } finally {
            setDetailsLoading(false);
        }
    }

    fetchDetails();
  }, [selectedProject]);

  // Effect to handle clicks outside the customer combobox
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerComboboxRef.current && !customerComboboxRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
      // Handle clicks outside the structure menu
      if (structureMenuRef.current && !structureMenuRef.current.contains(event.target as Node)) {
        setIsStructureMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [customerComboboxRef, structureMenuRef]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group and Filter logic
  const uniqueYears = Array.from(new Set(projects.map((p) => p.year))).filter(
    (year) => year !== "Khác"
  );
  const years = ["All", ...uniqueYears].sort((a, b) =>
    a === "All" ? -1 : b === "All" ? 1 : b.localeCompare(a));

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

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  // Chuẩn bị dữ liệu động cho Form "Thêm mới"
  const uniqueYearsForForm = [...new Set(projects.map(p => p.year))]
    .filter(y => y !== "Khác")
    .sort((a, b) => b.localeCompare(a));
  const uniqueCustomersForForm = [...new Set(projects.map(p => p.customerId))].sort();
  const filteredCustomersForForm = newProject.customerId
    ? uniqueCustomersForForm.filter(c => c.toLowerCase().includes(newProject.customerId.toLowerCase()))
    : uniqueCustomersForForm;


  if (selectedYearParam && selectedCustomerParam) {
    const customerProjects = projects.filter(p => p.year === selectedYearParam && p.customerId === selectedCustomerParam);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/years")}
            className="bg-[#121318] hover:bg-zinc-800 text-zinc-300 text-xs px-3.5 py-2 rounded-lg border border-zinc-800/80 transition-all font-medium cursor-pointer"
          >
            ← Trở lại
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight truncate" title={selectedCustomerParam}>
              Dự án của: {selectedCustomerParam}
            </h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">Năm {selectedYearParam}</p>
          </div>
        </div>

        <div className="bg-[#121318] border border-zinc-800/80 rounded-xl">
          <div className="p-4 border-b border-zinc-800/60">
            <h3 className="text-xs font-semibold text-zinc-300">Danh sách dự án ({customerProjects.length})</h3>
          </div>
          <div className="p-2 space-y-1">
            {customerProjects.length > 0 ? (
              customerProjects.map(project => (
                <Link
                  key={project.projectId}
                  href={`/dashboard/years?project=${encodeURIComponent(project.projectId)}`}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  <File size={14} className="text-blue-500 shrink-0" />
                  <span className="text-sm font-medium text-zinc-200">{project.projectId}</span>
                </Link>
              ))
            ) : (
              <p className="text-center text-xs text-zinc-500 p-8">Không có dự án nào cho khách hàng này trong năm {selectedYearParam}.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="space-y-6">
        {/* Tiêu đề & Back button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/years")}
              className="bg-[#121318] hover:bg-zinc-800 text-zinc-300 text-xs px-3.5 py-2 rounded-lg border border-zinc-800/80 transition-all font-medium cursor-pointer"
            >
              ← Trở lại
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-zinc-100 tracking-tight truncate" title={selectedProject}>{selectedProject}</h1>
              <p className="text-[11px] text-zinc-500 mt-0.5">Chi tiết chỉ số KPI & tiến độ dự án từ Google Sheet</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenEditModal}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] px-3 py-1.5 rounded-lg border border-zinc-700/80 transition-all font-medium"
            >
              <Pencil size={12} /> Sửa
            </button>
            <button
              onClick={async () => {
                if (confirm(`Bạn có chắc chắn muốn xóa dự án "${selectedProject}" không?`)) {
                  const res = await fetch('/api/delete-project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: selectedProject }) });
                  const result = await res.json();
                  if (result.success) {
                    alert('Xóa thành công!');
                    router.push('/dashboard/years');
                    router.refresh();
                  } else { alert(`Lỗi khi xóa: ${result.error}`); }
                }
              }}
              className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-950/80 text-red-400 text-[11px] px-3 py-1.5 rounded-lg border border-red-900/50 transition-all font-medium"
            >
              <Trash2 size={12} /> Xóa
            </button>
          </div>
        </div>

        {/* Conditional rendering for details */}
        {detailsLoading && (
            <div className="flex justify-center items-center h-40 border border-dashed border-zinc-800 rounded-xl">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                <span className="text-zinc-400">Đang tải chi tiết dự án...</span>
            </div>
        )}
        {detailsError && (
            <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-4 text-red-400">
                <h4 className="font-semibold text-red-200">Lỗi tải chi tiết dự án</h4>
                <p className="text-xs mt-1">{detailsError}</p>
            </div>
        )}
{projectDetails && !detailsLoading && (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
            title="PROCESS" 
            value={projectDetails.process} 
            percentage="Progress"
            progress={parseFloat(projectDetails.process) || 0}
            footer="Dữ liệu từ cột G" 
        />
        <KpiCard 
            title="KPI DONE" 
            value={projectDetails.kpiDone} 
            percentage="Done"
            progress={100}
            footer="Dữ liệu từ cột J" 
        />
        <KpiCard 
            title="KPI EST" 
            value={projectDetails.kpiEst} 
            percentage="Estimate"
            progress={100}
            footer="Dữ liệu từ cột K" 
        />
        <KpiCard 
            title="STATUS" 
            value={projectDetails.status} 
            percentage="State"
            progress={100}
            footer="Dữ liệu từ cột L" 
        />
    </div>
)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Project Manager</h1>
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
                Không thể tải danh sách dự án. Để lấy dữ liệu thực tế, hãy chia sẻ quyền xem (Viewer) cho email Service Account bên dưới:
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
            title="Tổng số Khách hàng"
            value={summary.totalCustomers?.toString() || '0'}
            percentage="Unique"
            progress={100}
            footer="Tổng từ cột B (CUSTOMID)"
          />
          <KpiCard
            title="Tổng số Dự án"
            value={summary.totalTasks.toString()}
            percentage="Live"
            progress={100}
            footer="Tổng từ cột C (PROJECTID)"
          />
          <KpiCard
            title="Tổng số Năm"
            value={summary.totalYears?.toString() || '0'}
            percentage="Unique"
            progress={100}
            footer="Tổng từ cột D (YEAR_BID)"
          />
        </div>
      )}

{/* ==================== ĐOẠN CODE ĐÃ SỬA Ô TÌM KIẾM KÉO DÀI ==================== */}
<div className={`${styles.actionBar} flex-col lg:flex-row`}>
  
  {/* 1. Ô Tìm kiếm (Sử dụng md:flex-1 để tự động kéo dãn chiếm khoảng trống) */}
  <div className={`${styles.searchWrapper} w-full lg:flex-1`}>
    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
      <Search size={14} />
    </span>
    <input
      type="text"
      placeholder="Tìm kiếm khách hàng, dự án..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className={styles.searchInput}
    />
  </div>

  {/* Khối gom nhóm Nút và Dropdown cố định kích thước ở bên phải */}
  <div className={`${styles.actionsContainer} flex-col sm:flex-row w-full lg:w-auto`}>
    
    {/* 2. Nút Thêm dự án mới */}
    <button
      onClick={() => setIsModalOpen(true)}
      className={`${styles.actionButton} ${styles.primaryButton}`}
    >
      <PlusCircle size={13} /> Thêm dự án
    </button>

    {/* Nút Quản lý cấu trúc với Dropdown Menu */}
    <div className="relative w-full sm:w-auto" ref={structureMenuRef}>
      <button
        onClick={() => setIsStructureMenuOpen(prev => !prev)}
        className={`${styles.actionButton} ${styles.secondaryButton}`}
      >
        <Layers size={13} /> Chỉnh sửa
      </button>
      {isStructureMenuOpen && (
        <div className={styles.dropdownMenu}>
          <button onClick={() => openModal('add-year')} className={styles.dropdownMenuItem}>
            ➕ Thêm năm mới
          </button>
          <button onClick={() => openModal('delete-year')} className={styles.dropdownMenuItem}>
            ❌ Xóa năm hiện tại
          </button>
          <div className={styles.dropdownDivider}></div>
          <button onClick={() => openModal('add-customer')} className={styles.dropdownMenuItem}>
            👤 Thêm khách hàng mới
          </button>
          <button onClick={() => openModal('delete-customer')} className={styles.dropdownMenuItem}>
            🗑️ Xóa khách hàng hiện tại
          </button>
        </div>
      )}
    </div>

    {/* 3. Dropdown chọn năm */}
    <div className="relative w-full sm:w-36 shrink-0">
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
        className="w-full bg-[#0d0e12] border border-zinc-800/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60 transition-colors appearance-none cursor-pointer font-medium"
      >
        {years.map((year) => (
          <option key={year} value={year} className="bg-[#121318] text-zinc-300">
            {year === "All" ? "Tất cả các năm" : `Năm ${year}`}
          </option>
        ))}
      </select>
      {/* Biểu tượng mũi tên nhỏ chỉ xuống */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500 border-l border-zinc-800/40 ml-2">
        <ChevronDown size={14} />
      </div>
    </div>

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
        <div className="bg-[#121318]/90 border border-zinc-800/80 backdrop-blur-md rounded-xl p-6 shadow-2xl font-mono text-xs text-zinc-300 overflow-x-auto selection:bg-blue-500/30">
          <div className="space-y-4">
            {Object.keys(groupedData)
              .sort((a, b) => b.localeCompare(a)) // Hiển thị năm gần nhất trước
              .map((year) => {
                const customers = Object.keys(groupedData[year]).sort((a, b) => a.localeCompare(b));
                const totalProjectsOfYear = Object.values(groupedData[year]).reduce((acc, curr) => acc + curr.length, 0);
                const isYearExpanded = searchQuery ? true : (expandedYears[year] !== false);

                return (
                  <div key={year} className="space-y-1">
                    {/* Year Folder Node */}
                    <div
                      onClick={() => !searchQuery && toggleYear(year)}
                      className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-zinc-800/40 transition-colors select-none ${
                        searchQuery ? "" : "cursor-pointer"
                      }`}
                    >
                      <span className="text-base select-none">🗂️</span>
                      <span className="font-bold text-zinc-100 tracking-wider">
                        YEAR {year}
                      </span>
                      <span className="text-zinc-500 text-[10px]">
                        ({totalProjectsOfYear} project{totalProjectsOfYear !== 1 ? "s" : ""})
                      </span>
                    </div>

                    {/* Year Children */}
                    {isYearExpanded && (
                      <div className="space-y-1">
                        {customers.map((customer, custIdx) => {
                          const customerKey = `${year}-${customer}`;
                          const projectCount = groupedData[year][customer].length;
                          const isCustomerExpanded = searchQuery ? true : (expandedCustomers[customerKey] !== false);
                          const isLastCustomer = custIdx === customers.length - 1;
                          const customerPrefix = isLastCustomer ? "  " : " ";

                          return (
                            <div key={customer} className="space-y-1">
                              {/* Customer Node */}
                              <div
                                onClick={() => !searchQuery && toggleCustomer(customerKey)}
                                className={`flex items-center py-1 px-2 rounded hover:bg-zinc-800/30 transition-colors select-none ${
                                  searchQuery ? "" : "cursor-pointer"
                                }`}
                              >
                                <span className="text-zinc-500 font-bold select-none tracking-tight mr-1 whitespace-pre">
                                  {customerPrefix}
                                </span>
                                <span className="mr-1.5 select-none text-[13px]">👤</span>
                                <span className="font-semibold text-zinc-200">
                                  {customer}
                                </span>
                                <span className="text-zinc-500 text-[10px] ml-1.5">
                                  ({projectCount} project{projectCount !== 1 ? "s" : ""})
                                </span>
                              </div>

                              {/* Customer Children (Projects) */}
                              {isCustomerExpanded && (
                                <div className="space-y-1">
                                  {groupedData[year][customer].map((project, projIdx) => {
                                    const isLastProject = projIdx === groupedData[year][customer].length - 1;
                                    const pathPrefix = isLastCustomer ? "        " : "     ";
                                    const projectPrefix = isLastProject ? " " : " ";

                                    return (
                                      <div
                                        key={projIdx}
                                        className="flex items-center py-0.5 px-2 rounded hover:bg-zinc-800/20 transition-colors group"
                                      >
                                        <span className="text-zinc-600 font-bold select-none tracking-tight whitespace-pre">
                                          {pathPrefix}
                                          {projectPrefix}
                                        </span>
                                        <span className="mr-1.5 select-none text-[13px] group-hover:scale-110 transition-transform">📄</span>
                                        <span className="text-zinc-300 group-hover:text-zinc-100 transition-colors font-medium">
                                          {project}
                                        </span>
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
              })}
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-[#16171d] border border-zinc-800/80 rounded-xl shadow-2xl w-full max-w-lg m-4">
            <div className="p-5 border-b border-zinc-800/60 flex justify-between items-center">
              <h2 className="text-base font-semibold text-zinc-100">Thêm dự án mới vào Google Sheet</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-200">&times;</button>
            </div>
            <form onSubmit={handleAddNewProject}>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="year" className="text-xs font-medium text-zinc-400 block mb-1.5">Năm <span className="text-red-500">*</span></label>
                  <select
                    id="year"
                    value={newProject.year}
                    onChange={(e) => setNewProject({ ...newProject, year: e.target.value })}
                    className="w-full bg-[#0d0e12] border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 transition-colors appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>-- Chọn năm --</option>
                    {uniqueYearsForForm.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="customerId" className="text-xs font-medium text-zinc-400 block mb-1.5">Khách hàng <span className="text-red-500">*</span></label>
                  <div className={styles.comboboxWrapper} ref={customerComboboxRef}>
                    <input
                      id="customerId"
                      type="text"
                      placeholder="Gõ để tìm hoặc chọn khách hàng"
                      value={newProject.customerId}
                      onChange={(e) => {
                        setNewProject({ ...newProject, customerId: e.target.value });
                        setIsCustomerDropdownOpen(true);
                      }}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                      className={styles.comboboxInput}
                      required
                      autoComplete="off"
                    />
                    {isCustomerDropdownOpen && (
                      <div className={styles.suggestionList}>
                        {filteredCustomersForForm.length > 0 ? (
                          filteredCustomersForForm.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setNewProject({ ...newProject, customerId: c });
                                setIsCustomerDropdownOpen(false);
                              }}
                              className={styles.suggestionItem}
                            >{c}</button>
                          ))
                        ) : (<p className={styles.suggestionEmpty}>Không tìm thấy khách hàng.</p>)}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="projectId" className="text-xs font-medium text-zinc-400 block mb-1.5">Tên dự án <span className="text-red-500">*</span></label>
                  <input
                    id="projectId"
                    type="text"
                    placeholder="[NĂM] Tên dự án/ Tên gói thầu"
                    value={newProject.projectId}
                    onChange={(e) => setNewProject({ ...newProject, projectId: e.target.value })}
                    className="w-full bg-[#0d0e12] border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="p-4 bg-[#121318] border-t border-zinc-800/60 rounded-b-xl flex justify-between items-center">
                <div className="h-4">
                  {submitMessage && (
                    <p className={`text-xs ${submitMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {submitMessage.text}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-xs text-zinc-400 hover:text-zinc-100 px-3">Hủy</button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                    {isSubmitting ? 'Đang lưu...' : 'Lưu vào Sheet'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && editingProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-[#16171d] border border-zinc-800/80 rounded-xl shadow-2xl w-full max-w-lg m-4">
            <div className="p-5 border-b border-zinc-800/60 flex justify-between items-center">
              <h2 className="text-base font-semibold text-zinc-100">Chỉnh sửa dự án</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-500 hover:text-zinc-200">&times;</button>
            </div>
            <form onSubmit={handleEditProject}>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="edit-year" className="text-xs font-medium text-zinc-400 block mb-1.5">Năm <span className="text-red-500">*</span></label>
                  <input
                    id="edit-year"
                    type="number"
                    value={editingProject.year}
                    onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value })}
                    className="w-full bg-[#0d0e12] border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-customerId" className="text-xs font-medium text-zinc-400 block mb-1.5">Khách hàng <span className="text-red-500">*</span></label>
                  <input
                    id="edit-customerId"
                    type="text"
                    value={editingProject.customerId}
                    onChange={(e) => setEditingProject({ ...editingProject, customerId: e.target.value })}
                    className="w-full bg-[#0d0e12] border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-projectId" className="text-xs font-medium text-zinc-400 block mb-1.5">Tên dự án <span className="text-red-500">*</span></label>
                  <input
                    id="edit-projectId"
                    type="text"
                    value={editingProject.projectId}
                    onChange={(e) => setEditingProject({ ...editingProject, projectId: e.target.value })}
                    className="w-full bg-[#0d0e12] border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="p-4 bg-[#121318] border-t border-zinc-800/60 rounded-b-xl flex justify-between items-center">
                <div className="h-4">
                  {editSubmitMessage && (
                    <p className={`text-xs ${editSubmitMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {editSubmitMessage.text}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-xs text-zinc-400 hover:text-zinc-100 px-3">Hủy</button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmittingEdit && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                    {isSubmittingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Structure Management Modal */}
      {activeModal && (
        <StructureModals
          activeModal={activeModal}
          onClose={() => setActiveModal(null)}
          years={uniqueYearsForForm}
          customers={uniqueCustomersForForm}
          router={router}
        />
      )}

    </div>
  );
}

function StructureModals({ activeModal, onClose, years, customers, router }: { activeModal: string | null, onClose: () => void, years: string[], customers: string[], router: any }) {
  const [yearToDelete, setYearToDelete] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState('');
  const [deleteStep, setDeleteStep] = useState(0); // 0: initial, 1: confirm, 2: options
  const [targetYear, setTargetYear] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // States and Refs for Comboboxes
  const [isDeleteYearOpen, setIsDeleteYearOpen] = useState(false);
  const [isDeleteCustomerOpen, setIsDeleteCustomerOpen] = useState(false);
  const deleteYearRef = useRef<HTMLDivElement>(null);
  const deleteCustomerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deleteYearRef.current && !deleteYearRef.current.contains(event.target as Node)) {
        setIsDeleteYearOpen(false);
      }
      if (deleteCustomerRef.current && !deleteCustomerRef.current.contains(event.target as Node)) {
        setIsDeleteCustomerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredYearsForDelete = yearToDelete
    ? years.filter(y => y.toLowerCase().includes(yearToDelete.toLowerCase()))
    : years;

  const filteredCustomersForDelete = customerToDelete
    ? customers.filter(c => c.toLowerCase().includes(customerToDelete.toLowerCase()))
    : customers;

  const handleApiCall = async (payload: any) => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/manage-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Thao tác thành công! Đang làm mới...' });
        if (payload.action === 'add') {
          setNewYearName('');
          setNewCustomerName('');
        }
        setTimeout(() => {
          if (payload.action === 'delete') onClose();
          router.refresh();
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Có lỗi xảy ra.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'add-year':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700/50 pb-2">Thêm năm mới</h3>
            <div className={styles.formGroup}>
              <div className="flex-1">
                <label className={styles.formLabel}>Nhập năm mới</label>
                <input type="text" placeholder="VD: 2028" value={newYearName} onChange={e => setNewYearName(e.target.value)} className={styles.comboboxInput} />
              </div>
              <button onClick={() => handleApiCall({ entity: 'year', action: 'add', name: newYearName.trim() })} disabled={!newYearName || !/^\d{4}$/.test(newYearName)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">Thêm</button>
            </div>
          </div>
        );
      case 'add-customer':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700/50 pb-2">Thêm khách hàng mới</h3>
            <div className={styles.formGroup}>
              <div className="flex-1">
                <label className={styles.formLabel}>Nhập tên khách hàng</label>
                <input type="text" placeholder="VD: Công ty ABC" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className={styles.comboboxInput} />
              </div>
              <button onClick={() => handleApiCall({ entity: 'customer', action: 'add', name: newCustomerName.trim() })} disabled={!newCustomerName} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">Thêm</button>
            </div>
          </div>
        );
      case 'delete-year':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700/50 pb-2">Xóa năm hiện tại</h3>
            {deleteStep === 0 && (
              <div className={styles.formGroup}>
                <div className={`${styles.comboboxWrapper} flex-1`} ref={deleteYearRef}>
                  <label className={styles.formLabel}>Chọn năm cần xóa</label>
                  <input type="text" placeholder="Gõ để tìm năm..." value={yearToDelete} onChange={e => { setYearToDelete(e.target.value); setIsDeleteYearOpen(true); }} onFocus={() => setIsDeleteYearOpen(true)} className={styles.comboboxInput} autoComplete="off" />
                  {isDeleteYearOpen && (
                    <div className={styles.suggestionList}>
                      {filteredYearsForDelete.length > 0 ? (
                        filteredYearsForDelete.map(y => (
                          <button key={y} type="button" onClick={() => { setYearToDelete(y); setIsDeleteYearOpen(false); }} className={styles.suggestionItem}>{y}</button>
                        ))
                      ) : <p className={styles.suggestionEmpty}>Không tìm thấy năm.</p>}
                    </div>
                  )}
                </div>
                <button onClick={() => yearToDelete && setDeleteStep(1)} disabled={!yearToDelete} className="bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-medium px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">Xóa</button>
              </div>
            )}
            {deleteStep === 1 && (
              <div className="bg-zinc-800/50 p-4 rounded-lg text-center">
                <p className="text-sm text-zinc-200">Bạn có chắc chắn muốn xóa năm <strong>{yearToDelete}</strong>?</p>
                <div className="flex justify-center gap-4 mt-4">
                  <button onClick={() => setDeleteStep(0)} className="text-xs text-zinc-400">Hủy</button>
                  <button onClick={() => setDeleteStep(2)} className="bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg">Xác nhận xóa</button>
                </div>
              </div>
            )}
            {deleteStep === 2 && (
              <div className="bg-zinc-800/50 p-4 rounded-lg space-y-4">
                <h4 className="text-sm font-semibold text-amber-300">Xử lý dữ liệu con của năm {yearToDelete}:</h4>
                <div className="space-y-3">
                  <button onClick={() => handleApiCall({ entity: 'year', action: 'delete', source: yearToDelete, mode: 'cascade' })} className="w-full text-left p-3 bg-red-950/50 hover:bg-red-900/70 rounded-lg text-red-300 text-xs">Xóa vĩnh viễn tất cả khách hàng và dự án trong năm này.</button>
                  <div className="bg-zinc-700/50 p-3 rounded-lg space-y-2">
                    <p className="text-xs text-zinc-300">Hoặc di chuyển tất cả sang năm khác:</p>
                    <div className="flex items-center gap-2">
                      <select value={targetYear} onChange={e => setTargetYear(e.target.value)} className="flex-1 bg-[#0d0e12] border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100">
                        <option value="" disabled>-- Chọn năm đích --</option>
                        {years.filter(y => y !== yearToDelete).map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <button onClick={() => handleApiCall({ entity: 'year', action: 'delete', source: yearToDelete, mode: 'move', destination: targetYear })} disabled={!targetYear} className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50">Di chuyển</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'delete-customer':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700/50 pb-2">Xóa khách hàng hiện tại</h3>
            {deleteStep === 0 && (
              <div className={styles.formGroup}>
                <div className={`${styles.comboboxWrapper} flex-1`} ref={deleteCustomerRef}>
                  <label className={styles.formLabel}>Chọn khách hàng cần xóa</label>
                  <input type="text" placeholder="Gõ để tìm khách hàng..." value={customerToDelete} onChange={e => { setCustomerToDelete(e.target.value); setIsDeleteCustomerOpen(true); }} onFocus={() => setIsDeleteCustomerOpen(true)} className={styles.comboboxInput} autoComplete="off" />
                  {isDeleteCustomerOpen && (
                    <div className={styles.suggestionList}>
                      {filteredCustomersForDelete.length > 0 ? (
                        filteredCustomersForDelete.map(c => (
                          <button key={c} type="button" onClick={() => { setCustomerToDelete(c); setIsDeleteCustomerOpen(false); }} className={styles.suggestionItem}>{c}</button>
                        ))
                      ) : <p className={styles.suggestionEmpty}>Không tìm thấy khách hàng.</p>}
                    </div>
                  )}
                </div>
                <button onClick={() => customerToDelete && setDeleteStep(1)} disabled={!customerToDelete} className="bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-medium px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">Xóa</button>
              </div>
            )}
            {deleteStep === 1 && (
              <div className="bg-zinc-800/50 p-4 rounded-lg text-center">
                <p className="text-sm text-zinc-200">Bạn có chắc chắn muốn xóa khách hàng <strong>{customerToDelete}</strong>?</p>
                <div className="flex justify-center gap-4 mt-4">
                  <button onClick={() => setDeleteStep(0)} className="text-xs text-zinc-400">Hủy</button>
                  <button onClick={() => setDeleteStep(2)} className="bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg">Xác nhận xóa</button>
                </div>
              </div>
            )}
            {deleteStep === 2 && (
              <div className="bg-zinc-800/50 p-4 rounded-lg space-y-4">
                <h4 className="text-sm font-semibold text-amber-300">Xử lý các dự án của khách hàng {customerToDelete}:</h4>
                <div className="space-y-3">
                  <button onClick={() => handleApiCall({ entity: 'customer', action: 'delete', source: customerToDelete, mode: 'cascade' })} className="w-full text-left p-3 bg-red-950/50 hover:bg-red-900/70 rounded-lg text-red-300 text-xs">Xóa vĩnh viễn tất cả dự án của khách hàng này.</button>
                  <div className="bg-zinc-700/50 p-3 rounded-lg space-y-2">
                    <p className="text-xs text-zinc-300">Hoặc di chuyển tất cả sang khách hàng khác:</p>
                    <div className="flex items-center gap-2">
                      <select value={targetCustomer} onChange={e => setTargetCustomer(e.target.value)} className="flex-1 bg-[#0d0e12] border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100">
                        <option value="" disabled>-- Chọn khách hàng đích --</option>
                        {customers.filter(c => c !== customerToDelete).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button onClick={() => handleApiCall({ entity: 'customer', action: 'delete', source: customerToDelete, mode: 'move', destination: targetCustomer })} disabled={!targetCustomer} className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50">Di chuyển</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (activeModal) {
      case 'add-year': return 'Thêm Năm Mới';
      case 'delete-year': return 'Xóa Năm';
      case 'add-customer': return 'Thêm Khách Hàng Mới';
      case 'delete-customer': return 'Xóa Khách Hàng';
      default: return 'Quản lý Cấu trúc';
    }
  };

  if (!activeModal) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContent} max-w-lg`}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{getModalTitle()}</h2>
          <button onClick={onClose} className={styles.modalCloseButton}>&times;</button>
        </div>
        <div className={styles.modalBody}>
          {renderModalContent()}
        </div>
        <div className={styles.modalFooter}>
          {message && <p className={`${styles.modalMessage} ${message.type === 'success' ? styles.modalMessageSuccess : styles.modalMessageError}`}>{message.text}</p>}
          {isProcessing && <div className="flex items-center gap-2 text-xs text-zinc-400"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Đang xử lý...</div>}
        </div>
      </div>
    </div>
  );
}
