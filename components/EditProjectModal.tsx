"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from '@/app/dashboard/years/years.module.css';


interface ProjectData {
  year: string;
  customerId: string;
  projectId: string;
  contract: string;
  status: string;
  sale: string;
}

interface EditingProjectData extends ProjectData {
  originalProjectId: string;
}

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData | null;
  customersList: string[];
  onSaveSuccess: () => void;
}

const STATUS_OPTIONS = [
  "Tư vấn và báo giá", "Làm Specs, làm thầu", "Hoàn thành thầu",
  "LAB/PoC", "Đang triển khai", "Đã nghiệm thu", "MA", "Chưa có"
];

export default function EditProjectModal({ isOpen, onClose, project, customersList, onSaveSuccess }: EditProjectModalProps) {
  const [editingProject, setEditingProject] = useState<EditingProjectData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerComboboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && project) {
      setEditingProject({
        ...project,
        originalProjectId: project.projectId,
        status: project.status || "Chưa có",
      });
      setSubmitMessage(null); // Reset message when modal opens
    }
  }, [isOpen, project]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerComboboxRef.current && !customerComboboxRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/yearly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          entityType: 'project',
          projectId: editingProject.originalProjectId,
          rowData: {
            year: editingProject.year,
            customerId: editingProject.customerId,
            projectId: editingProject.projectId,
            contract: editingProject.contract,
            status: editingProject.status,
            sale: editingProject.sale,
          }
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSubmitMessage({ type: 'success', text: 'Cập nhật thành công! Đang làm mới...' });
        setTimeout(() => {
          onSaveSuccess();
          onClose();
        }, 1500);
      } else {
        setSubmitMessage({ type: 'error', text: result.error || 'Có lỗi xảy ra.' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !editingProject) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-[#16171d] border border-zinc-800/80 rounded-xl shadow-2xl w-full max-w-lg m-4">
        <div className="p-5 border-b border-zinc-800/60 flex justify-between items-center">
          <h2 className="text-base font-semibold text-zinc-100">Chỉnh sửa dự án</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200">&times;</button>
        </div>
        <form onSubmit={handleSave}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Các trường input */}
            <div>
              <label htmlFor="edit-year" className="text-xs font-medium text-zinc-400 block mb-1.5">Năm <span className="text-red-500">*</span></label>
              <input id="edit-year" type="text" value={editingProject.year} onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value })} className={styles.comboboxInput} required />
            </div>
            <div>
              <label htmlFor="edit-customerId" className="text-xs font-medium text-zinc-400 block mb-1.5">Khách hàng <span className="text-red-500">*</span></label>
              <div className={styles.comboboxWrapper} ref={customerComboboxRef}>
                <input id="edit-customerId" type="text" placeholder="Gõ để tìm hoặc chọn khách hàng" value={editingProject.customerId} onChange={(e) => { setEditingProject({ ...editingProject, customerId: e.target.value }); setIsCustomerDropdownOpen(true); }} onFocus={() => setIsCustomerDropdownOpen(true)} className={styles.comboboxInput} required autoComplete="off" />
                {isCustomerDropdownOpen && (
                  <div className={styles.suggestionList}>
                    {customersList.filter(c => c.toLowerCase().includes(editingProject.customerId.toLowerCase())).map(c => (
                      <button key={c} type="button" onClick={() => { setEditingProject({ ...editingProject, customerId: c }); setIsCustomerDropdownOpen(false); }} className={styles.suggestionItem}>{c}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="edit-projectId" className="text-xs font-medium text-zinc-400 block mb-1.5">Tên dự án <span className="text-red-500">*</span></label>
              <input id="edit-projectId" type="text" value={editingProject.projectId} onChange={(e) => setEditingProject({ ...editingProject, projectId: e.target.value })} className={styles.comboboxInput} required />
            </div>
            <div>
              <label htmlFor="edit-contract" className="text-xs font-medium text-zinc-400 block mb-1.5">Hợp đồng</label>
              <input id="edit-contract" type="text" value={editingProject.contract} onChange={(e) => setEditingProject({ ...editingProject, contract: e.target.value })} className={styles.comboboxInput} />
            </div>
            <div>
              <label htmlFor="edit-sale" className="text-xs font-medium text-zinc-400 block mb-1.5">Sale</label>
              <input id="edit-sale" type="text" value={editingProject.sale} onChange={(e) => setEditingProject({ ...editingProject, sale: e.target.value })} className={styles.comboboxInput} />
            </div>
            <div>
              <label htmlFor="edit-status" className="text-xs font-medium text-zinc-400 block mb-1.5">Trạng thái</label>
              <select id="edit-status" value={editingProject.status} onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value })} className={`${styles.comboboxInput} appearance-none cursor-pointer`}>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
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
              <button type="button" onClick={onClose} className="text-xs text-zinc-400 hover:text-zinc-100 px-3">Hủy</button>
              <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center gap-2">
                {isSubmitting && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}