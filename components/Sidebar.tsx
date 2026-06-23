"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const [openYear, setOpenYear] = useState("2026");
  const [openCustomer, setOpenCustomer] = useState("GoDN Korea");

  const projects = [
    {
      year: "2026",
      customers: [
        {
          name: "GoDN Korea",
          projects: [
            "Kakao Business",
            "OTA Research",
            "KOC Outreach",
          ],
        },
        {
          name: "Markee Agency",
          projects: [
            "Security Audit",
            "Firewall Upgrade",
          ],
        },
      ],
    },
    {
      year: "2025",
      customers: [
        {
          name: "CG Lab",
          projects: ["PoC Testing"],
        },
      ],
    },
  ];

  return (
    <aside className="w-72 border-r border-zinc-800 bg-[#0d0e12] p-5 flex flex-col justify-between hidden md:flex h-screen sticky top-0">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            ⚡
          </div>

          <div>
            <h2 className="font-semibold text-sm text-white">
              Task Compliance
            </h2>

            <span className="text-xs text-zinc-500">
              SecurityZone v2.1
            </span>
          </div>
        </div>

        {/* Main */}
        <div className="space-y-1 mb-6">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2 px-3">
            Main
          </span>

          <SidebarItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active
          />

          <SidebarItem
            icon={<FolderKanban size={18} />}
            label="Task Review"
          />

          <SidebarItem
            icon={<BarChart3 size={18} />}
            label="Task Library"
          />

          <SidebarItem
            icon={<FileText size={18} />}
            label="Reports"
          />
        </div>

        {/* Projects Tree */}
        <div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-3 px-3">
            Projects
          </span>

          {projects.map((year) => (
            <div key={year.year} className="mb-2">

              <button
                onClick={() =>
                  setOpenYear(
                    openYear === year.year ? "" : year.year
                  )
                }
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-300 hover:bg-zinc-900"
              >
                {openYear === year.year ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}

                <span className="font-medium">
                  {year.year}
                </span>
              </button>

              {openYear === year.year && (
                <div className="ml-5 border-l border-zinc-800">

                  {year.customers.map((customer) => (
                    <div key={customer.name}>

                      <button
                        onClick={() =>
                          setOpenCustomer(
                            openCustomer === customer.name
                              ? ""
                              : customer.name
                          )
                        }
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white"
                      >
                        {openCustomer === customer.name ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronRight size={12} />
                        )}

                        {customer.name}
                      </button>

                      {openCustomer === customer.name && (
                        <div className="ml-6 mb-2">

                          {customer.projects.map((project) => (
                            <button
                              key={project}
                              className="block w-full text-left px-3 py-1.5 text-xs text-zinc-500 hover:text-blue-400"
                            >
                              • {project}
                            </button>
                          ))}

                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
          BT
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-200">
            Ben Tran
          </p>

          <p className="text-[10px] text-zinc-500">
            Administrator
          </p>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
        active
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:bg-zinc-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}