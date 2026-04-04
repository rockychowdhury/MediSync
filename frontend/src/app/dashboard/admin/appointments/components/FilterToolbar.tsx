import React from "react";
import { 
  Search, 
  Filter, 
  Calendar, 
  List, 
  LayoutGrid, 
  Download, 
  Plus,
  ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FilterToolbarProps {
  onSearch: (val: string) => void;
  onFilterChange: (key: string, val: any) => void;
  onViewChange: (view: "list" | "calendar" | "queue") => void;
  onNewAppointment: () => void;
  onExport: () => void;
  currentView: string;
  filters: any;
  providers: any[];
  services: any[];
}

export const FilterToolbar = ({
  onSearch,
  onFilterChange,
  onViewChange,
  onNewAppointment,
  onExport,
  currentView,
  filters,
  providers,
  services
}: FilterToolbarProps) => {
  const [searchTerm, setSearchTerm] = React.useState(filters.search || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const statuses = [
    { label: "Scheduled", value: "scheduled" },
    { label: "Checked In", value: "checked_in" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
    { label: "No Show", value: "no_show" }
  ];

  const priorities = [
    { label: "Emergency", value: "emergency" },
    { label: "Urgent", value: "urgent" },
    { label: "Standard", value: "standard" }
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-1 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 mb-4">
      <div className="flex items-center gap-3 flex-1 min-w-[300px]">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input 
            placeholder="Search patient, phone or ID..." 
            className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 gap-2 font-medium")}>
            <Filter className="w-4 h-4" />
            Advanced Filters
            <ChevronDown className="w-3 h-3 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-2 rounded-2xl shadow-xl border-slate-100">
            <div className="p-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Clinical Status</span>
              <div className="mt-2 space-y-1">
                {statuses.map(s => (
                  <DropdownMenuCheckboxItem 
                    key={s.value}
                    checked={filters.status?.includes(s.value)}
                    onCheckedChange={(checked) => {
                      const current = filters.status || [];
                      const next = checked 
                        ? [...current, s.value] 
                        : current.filter((v: string) => v !== s.value);
                      onFilterChange("status", next.length ? next.join(",") : undefined);
                    }}
                    className="rounded-lg py-2"
                  >
                    {s.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="p-2">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Priority Level</span>
               <div className="mt-2 space-y-1">
                {priorities.map(p => (
                  <DropdownMenuCheckboxItem 
                    key={p.value}
                    checked={filters.priority?.includes(p.value)}
                    onCheckedChange={(checked) => {
                       const current = filters.priority || [];
                       const next = checked 
                        ? [...current, p.value] 
                        : current.filter((v: string) => v !== p.value);
                      onFilterChange("priority", next.length ? next.join(",") : undefined);
                    }}
                    className="rounded-lg py-2"
                  >
                    {p.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 gap-2 font-medium")}>
            <Plus className="w-4 h-4" />
            Provider
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto p-1 rounded-xl shadow-xl border-slate-100">
            <DropdownMenuItem 
               onClick={() => onFilterChange("provider_id", undefined)}
               className={cn("rounded-lg", !filters.provider_id && "bg-slate-50 font-bold")}
            >
              All Providers
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {providers.map(p => (
              <DropdownMenuItem 
                key={p.id} 
                onClick={() => onFilterChange("provider_id", p.id)}
                className={cn("rounded-lg", filters.provider_id === p.id && "bg-blue-50 text-blue-600 font-bold")}
              >
                {p.user.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
        <Button 
          variant={currentView === "list" ? "secondary" : "ghost"} 
          size="sm" 
          className={cn("h-8 px-3 rounded-xl gap-2 font-bold text-[11px]", currentView === "list" ? "bg-white shadow-sm text-blue-600" : "text-slate-500")}
          onClick={() => onViewChange("list")}
        >
          <List className="w-3.5 h-3.5" />
          LIST
        </Button>
        <Button 
          variant={currentView === "calendar" ? "secondary" : "ghost"} 
          size="sm" 
          className={cn("h-8 px-3 rounded-xl gap-2 font-bold text-[11px]", currentView === "calendar" ? "bg-white shadow-sm text-blue-600" : "text-slate-500")}
          onClick={() => onViewChange("calendar")}
        >
          <Calendar className="w-3.5 h-3.5" />
          PLANNER
        </Button>
        <Button 
          variant={currentView === "queue" ? "secondary" : "ghost"} 
          size="sm" 
          className={cn("h-8 px-3 rounded-xl gap-2 font-bold text-[11px]", currentView === "queue" ? "bg-white shadow-sm text-blue-600" : "text-slate-500")}
          onClick={() => onViewChange("queue")}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          QUEUE
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all font-medium gap-2 px-4"
          onClick={onExport}
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
        <Button 
          size="sm" 
          className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-200/50 transition-all font-bold gap-2 px-5 px-6"
          onClick={onNewAppointment}
        >
          <Plus className="w-4 h-4" />
          BOOK APPOINTMENT
        </Button>
      </div>
    </div>
  );
};
