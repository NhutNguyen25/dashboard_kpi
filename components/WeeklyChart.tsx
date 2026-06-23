// components/WeeklyChart.tsx
"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ChartDataItem {
  name: string;      // Ví dụ: "Mon", "Tue"
  Completed: number; // Số task hoàn thành
  Planned: number;   // Số task kế hoạch
}


interface WeeklyChartProps {
  chartData: ChartDataItem[];
}

export default function WeeklyChart({ chartData = [] }: WeeklyChartProps) {
  return (
    <div className="bg-[#121318] p-5 rounded-xl border border-zinc-800/60 h-full flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-zinc-200">Weekly task activity</h3>
        <p className="text-[10px] text-zinc-500 mt-0.5">Completed vs planned tasks this week</p>
      </div>
      
      <div className="h-44 w-full">
        {chartData.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-zinc-600 border border-dashed border-zinc-800 rounded-lg">
            No chart data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -45, bottom: -5 }}>
              <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} dy={5} />
              <YAxis stroke="none" tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#121318', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }}
              />
              <Bar dataKey="Completed" fill="#2563eb" radius={[2, 2, 0, 0]} barSize={10} />
              <Bar dataKey="Planned" fill="#06b6d4" radius={[2, 2, 0, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex gap-4 mt-3 pt-2 border-t border-zinc-900">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <div className="w-2 h-2 rounded-[2px] bg-[#2563eb]" />
          Completed
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <div className="w-2 h-2 rounded-[2px] bg-[#06b6d4]" />
          Planned
        </div>
      </div>
    </div>
  );
}