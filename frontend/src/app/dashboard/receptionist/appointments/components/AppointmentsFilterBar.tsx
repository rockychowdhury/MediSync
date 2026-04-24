"use client";

import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { Search, Calendar as CalendarIcon, List, FilterX } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export interface AppointmentFilters {
  date_from: string;
  date_to: string;
  provider_id: string;
  service_id: string;
  status: string[];
  search: string;
}

interface AppointmentsFilterBarProps {
  filters: AppointmentFilters;
  onChange: (filters: AppointmentFilters) => void;
  view: "calendar" | "list";
  onViewChange: (view: "calendar" | "list") => void;
  providers: any[];
  services: any[];
}

const STATUS_OPTIONS = [
  { id: "scheduled", label: "Scheduled" },
  { id: "checked_in", label: "Checked In" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "no_show", label: "No-Show" },
];

export function AppointmentsFilterBar({
  filters,
  onChange,
  view,
  onViewChange,
  providers,
  services,
}: AppointmentsFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch, filters, onChange]);

  const toggleStatus = (statusId: string) => {
    const newStatuses = filters.status.includes(statusId)
      ? filters.status.filter((s) => s !== statusId)
      : [...filters.status, statusId];
    onChange({ ...filters, status: newStatuses });
  };

  const handleDatePreset = (preset: "today" | "week" | "month") => {
    const today = new Date();
    let from = today;
    let to = today;

    if (preset === "week") {
      from = subDays(today, 7);
    } else if (preset === "month") {
      from = subDays(today, 30);
    }

    onChange({
      ...filters,
      date_from: format(from, "yyyy-MM-dd"),
      date_to: format(to, "yyyy-MM-dd"),
    });
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-4 flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="Search patient name or apt #..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={filters.provider_id}
            onChange={(e) => onChange({ ...filters, provider_id: e.target.value })}
          >
            <option value="">All Providers</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={filters.service_id}
            onChange={(e) => onChange({ ...filters, service_id: e.target.value })}
          >
            <option value="">All Services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => handleDatePreset("today")}
              className="px-3 py-1.5 text-[11px] font-bold rounded-lg hover:bg-white/50 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => handleDatePreset("week")}
              className="px-3 py-1.5 text-[11px] font-bold rounded-lg hover:bg-white/50 transition-colors"
            >
              7d
            </button>
            <button
              onClick={() => handleDatePreset("month")}
              className="px-3 py-1.5 text-[11px] font-bold rounded-lg hover:bg-white/50 transition-colors"
            >
              30d
            </button>
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => onViewChange("list")}
              className={`p-1.5 rounded-lg transition-colors ${view === "list" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewChange("calendar")}
              className={`p-1.5 rounded-lg transition-colors ${view === "calendar" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2">Status</span>
        {STATUS_OPTIONS.map((status) => {
          const isActive = filters.status.includes(status.id);
          return (
            <button
              key={status.id}
              onClick={() => toggleStatus(status.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                isActive 
                  ? "bg-slate-800 text-white border-slate-800" 
                  : "bg-slate-50 text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {status.label}
            </button>
          );
        })}
        {filters.status.length > 0 && (
          <button 
            onClick={() => onChange({ ...filters, status: [] })}
            className="p-1 text-slate-400 hover:text-slate-600 ml-auto"
            title="Clear statuses"
          >
            <FilterX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
