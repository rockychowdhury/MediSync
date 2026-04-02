import React from "react";
import { Search, Filter, X, User as UserIcon, Calendar } from "lucide-react";
import type { User } from "@/types/user";

interface AuditFilterBarProps {
  onSearch: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
  activeFilters: Record<string, string>;
  onClear: () => void;
  users: User[];
}

export function AuditFilterBar({ onSearch, onFilterChange, activeFilters, onClear, users }: AuditFilterBarProps) {
  
  const hasFilters = Object.keys(activeFilters).some(k => activeFilters[k] !== "");

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm flex flex-col lg:flex-row gap-3 items-center shrink-0">
      
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text"
          placeholder="Search entity ID or description..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100 border-none outline-none focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-colors text-slate-800 placeholder:text-slate-400 font-medium"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="h-6 w-px bg-slate-200 hidden lg:block"></div>

      {/* Select Filters Group */}
      <div className="flex flex-wrap w-full lg:w-auto gap-2">
        
        {/* Actor Filter */}
        <div className="relative min-w-[140px] flex-1 lg:flex-none">
          <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-9 pr-8 py-2 outline-none font-medium appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
            onChange={(e) => onFilterChange('user_id', e.target.value)}
            value={activeFilters.user_id || ""}
          >
            <option value="">All Actors</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </div>

        {/* Action Type */}
        <div className="relative min-w-[140px] flex-1 lg:flex-none">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-9 pr-8 py-2 outline-none font-medium appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
            onChange={(e) => onFilterChange('action_type', e.target.value)}
            value={activeFilters.action_type || ""}
          >
            <option value="">All Actions</option>
            <option value="login_success">Logins</option>
            <option value="login_failed">Failed Logins</option>
            <option value="appointment_created">Create Appt</option>
            <option value="patient_created">Create Patient</option>
            <option value="user_updated">Update User</option>
          </select>
        </div>

        {/* Entity Type */}
        <select 
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none font-medium appearance-none cursor-pointer hover:bg-slate-100 transition-colors flex-1 lg:flex-none"
          onChange={(e) => onFilterChange('entity_type', e.target.value)}
          value={activeFilters.entity_type || ""}
        >
          <option value="">All Entities</option>
          <option value="appointment">Appointments</option>
          <option value="patient">Patients</option>
          <option value="user">Users</option>
          <option value="provider">Providers</option>
        </select>

        {/* Date Presets */}
        <div className="relative flex-1 lg:flex-none">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-9 pr-8 py-2 outline-none font-medium appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
            onChange={(e) => {
              const days = e.target.value;
              if (!days) return onFilterChange('start_date', '');
              const date = new Date();
              date.setDate(date.getDate() - parseInt(days));
              onFilterChange('start_date', date.toISOString());
            }}
          >
            <option value="">Any Time</option>
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>

        {hasFilters && (
          <button 
            onClick={onClear}
            className="flex items-center justify-center w-9 h-9 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shrink-0 px-2 ml-1"
            title="Clear filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
}
