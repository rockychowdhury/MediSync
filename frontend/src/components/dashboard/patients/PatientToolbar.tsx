"use client";

import React from "react";
import { Search, UserPlus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface PatientToolbarProps {
  onSearch: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onNewPatient: () => void;
}

export function PatientToolbar({
  onSearch,
  onFilterChange,
  onNewPatient,
}: PatientToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm mb-6 sticky top-0 z-20 transition-all duration-300">
      <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input 
            placeholder="Search by name, email, or phone number..." 
            className="pl-10 h-10 border-slate-200 focus:ring-blue-500 rounded-xl text-sm placeholder:text-slate-400 font-medium bg-slate-50/30 focus:bg-white transition-all shadow-sm focus:shadow-md"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        
        <Select onValueChange={(val: string) => onFilterChange("is_active", val)}>
          <SelectTrigger className="w-[140px] h-10 border-slate-200 rounded-xl bg-slate-50/30 text-xs font-bold text-slate-600 hover:bg-white transition-colors">
            <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden">
            <SelectItem value="all" className="text-xs font-bold">All Status</SelectItem>
            <SelectItem value="true" className="text-xs font-bold text-green-600">Active Only</SelectItem>
            <SelectItem value="false" className="text-xs font-bold text-slate-400">Inactive Records</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={onNewPatient}
        className="w-full md:w-auto h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95 group"
      >
        <UserPlus className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
        Register New Patient
      </Button>
    </div>
  );
}
