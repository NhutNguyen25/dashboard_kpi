// components/KpiCard.tsx
import React from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  percentage: string;
  progress: number;
  footer: string;
}

export default function KpiCard({ title, value, percentage, progress, footer }: KpiCardProps) {
  return (
    <div className="bg-[#121318] p-4 rounded-xl border border-zinc-800/60 flex flex-col justify-between">
      <div>
        <p className="text-[11px] font-medium text-zinc-500">{title}</p>
        <div className="flex items-baseline justify-between mt-2.5">
          <span className="text-lg font-bold text-zinc-100 tracking-tight">{value}</span>
          <span className="text-[10px] font-semibold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
            {percentage}
          </span>
        </div>
      </div>
      <div className="mt-3">
        <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[9px] text-zinc-600 mt-2">{footer}</p>
      </div>
    </div>
  );
}