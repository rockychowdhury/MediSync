import React from "react";
import { 
  Search, 
  Filter, 
  X, 
  Columns4, 
  List, 
  BarChart3,
  Calendar
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FilterToolbarProps {
  filters: any;
  updateFilters: (filters: any) => void;
  view: 'columns' | 'list' | 'analytics';
  setView: (view: 'columns' | 'list' | 'analytics') => void;
  services: any[];
}

export function FilterToolbar({ 
  filters, 
  updateFilters, 
  view, 
  setView,
  services
}: FilterToolbarProps) {
  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== 'waiting' && v !== '').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 p-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search patient name or phone..." 
              value={filters.search || ""}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-10 h-11 rounded-xl border-slate-50 bg-slate-50/50 focus:bg-white transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-px bg-slate-100 mx-2" />
          
          <Select 
            value={filters.serviceId || "all"} 
            onValueChange={(val) => updateFilters({ serviceId: val === 'all' ? undefined : val })}
          >
            <SelectTrigger className="w-48 h-11 rounded-xl border-slate-50 bg-slate-50/50 text-[11px] font-black uppercase tracking-widest text-slate-600">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
              <SelectItem value="all">All Services</SelectItem>
              {services.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.status || "waiting"} 
            onValueChange={(val) => updateFilters({ status: val })}
          >
            <SelectTrigger className="w-40 h-11 rounded-xl border-slate-50 bg-slate-50/50 text-[11px] font-black uppercase tracking-widest text-slate-600">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
              <SelectItem value="waiting">Live (Waiting)</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="waiting,assigned,cancelled,expired">All History</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-8 w-px bg-slate-100 mx-2" />

          {/* View Toggles */}
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
            <Button
              variant={view === 'columns' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('columns')}
              className={cn(
                "h-9 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                view === 'columns' ? "bg-white shadow-sm shadow-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Columns4 className="w-3.5 h-3.5 mr-2" />
              Columns
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className={cn(
                "h-9 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                view === 'list' ? "bg-white shadow-sm shadow-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <List className="w-3.5 h-3.5 mr-2" />
              List
            </Button>
            <Button
              variant={view === 'analytics' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('analytics')}
              className={cn(
                "h-9 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                view === 'analytics' ? "bg-white shadow-sm shadow-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-2" />
              Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
         <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Active Filters:</div>
            {filters.search && (
              <Badge variant="secondary" className="h-7 rounded-lg bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-bold">
                 Search: {filters.search}
                 <button onClick={() => updateFilters({ search: '' })} className="ml-2 hover:text-blue-800"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.serviceId && (
              <Badge variant="secondary" className="h-7 rounded-lg bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-bold">
                 Service: {services.find(s => s.id === filters.serviceId)?.name}
                 <button onClick={() => updateFilters({ serviceId: undefined })} className="ml-2 hover:text-emerald-800"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => updateFilters({ search: '', serviceId: undefined, status: 'waiting' })}
               className="h-7 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500"
            >
               Clear All
            </Button>
         </div>
      )}
    </div>
  );
}
