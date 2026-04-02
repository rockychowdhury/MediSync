"use client";

import React from "react";
import { Search, Calendar as CalendarIcon, Filter, LayoutGrid, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface AppointmentToolbarProps {
  onSearch: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onViewChange: (view: "calendar" | "list") => void;
  onNewAppointment: () => void;
  currentView: "calendar" | "list";
  providers: any[];
  services: any[];
}

export function AppointmentToolbar({
  onSearch,
  onFilterChange,
  onViewChange,
  onNewAppointment,
  currentView,
  providers,
  services,
}: AppointmentToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm mb-6 sticky top-0 z-20">
      <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search patient or ID..." 
            className="pl-10 h-10 border-slate-200 focus:ring-blue-500 rounded-xl text-sm"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          <Select onValueChange={(val: string) => onFilterChange("provider_id", val)}>
            <SelectTrigger className="w-[180px] h-10 border-slate-200 rounded-xl">
              <SelectValue placeholder="All Providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.user?.full_name || p.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(val: string) => onFilterChange("service_id", val)}>
            <SelectTrigger className="w-[160px] h-10 border-slate-200 rounded-xl">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select onValueChange={(val: string) => onFilterChange("status", val)}>
            <SelectTrigger className="w-[140px] h-10 border-slate-200 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="checked-in">Checked In</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <Button
            variant={currentView === "calendar" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange("calendar")}
            className={`h-8 px-3 rounded-lg text-xs font-bold ${currentView === "calendar" ? "bg-white text-blue-600 shadow-sm border-slate-200 hover:bg-white" : "text-slate-500"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
            Calendar
          </Button>
          <Button
            variant={currentView === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange("list")}
            className={`h-8 px-3 rounded-lg text-xs font-bold ${currentView === "list" ? "bg-white text-blue-600 shadow-sm border-slate-200 hover:bg-white" : "text-slate-500"}`}
          >
            <List className="w-3.5 h-3.5 mr-1.5" />
            List
          </Button>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

        <Button 
          onClick={onNewAppointment}
          className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
      </div>
    </div>
  );
}
