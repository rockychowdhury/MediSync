import React, { useEffect, useRef } from "react";
import { Search, Filter, ArrowUpDown, BellOff, CalendarCheck, Loader2, Plus, Users, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PatientCard } from "./PatientCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PatientListProps {
  patients: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filters: any;
  onFilterChange: (newFilters: any) => void;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  totalCountCount: number;
  onNewPatient: () => void;
  onEdit: (patient: any) => void;
  onBook: (p: any) => void;
  onDeactivate: (p: any) => void;
}

export function PatientList({
  patients,
  selectedId,
  onSelect,
  filters,
  onFilterChange,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  totalCountCount,
  onNewPatient,
  onEdit,
  onBook,
  onDeactivate
}: PatientListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current || !hasMore || loadingMore) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      onLoadMore();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Search & Header */}
      <div className="p-4 border-b border-slate-100 bg-white/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Registry 
                <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] lowercase font-black border border-blue-100">
                    {totalCountCount} total
                </span>
            </h3>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onNewPatient}
            className="w-8 h-8 rounded-xl bg-blue-600 text-white hover:bg-blue-700 hover:text-white transition-all active:scale-95 shadow-md shadow-blue-100"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search name, phone, email..." 
            className="pl-9 h-11 bg-white border-slate-100 rounded-xl text-xs focus-visible:ring-blue-500/20"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 rounded-lg border-slate-100 text-[10px] font-bold text-slate-600 gap-1.5")}>
                <Filter className="w-3 h-3" />
                {filters.status.toUpperCase()}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-xl border-slate-100 p-2">
              <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Record Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={filters.status} onValueChange={(val: any) => onFilterChange({ status: val })}>
                <DropdownMenuRadioItem value="active" className="rounded-lg">Active Only</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="inactive" className="rounded-lg">Inactive Only</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="all" className="rounded-lg">All Records</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 rounded-lg border-slate-100 text-[10px] font-bold text-slate-600 gap-1.5")}>
                <ArrowUpDown className="w-3 h-3" />
                SORT
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-xl border-slate-100 p-2">
              <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Order By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={filters.sort} onValueChange={(val: any) => onFilterChange({ sort: val })}>
                <DropdownMenuRadioItem value="name_asc" className="rounded-lg text-xs">Name A-Z</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="name_desc" className="rounded-lg text-xs">Name Z-A</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="newest" className="rounded-lg text-xs">Newest Created</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest" className="rounded-lg text-xs">Oldest Created</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="last_visit" className="rounded-lg text-xs">Recent Visit</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex gap-1.5">
              <Badge 
                onClick={() => onFilterChange({ notificationOptOut: !filters.notificationOptOut })}
                variant={filters.notificationOptOut ? "default" : "outline"} 
                className={cn(
                  "cursor-pointer transition-all border-slate-100 h-8 font-black text-[9px] uppercase tracking-widest gap-1 px-3 rounded-lg active:scale-95",
                  filters.notificationOptOut ? "bg-amber-600 text-white border-amber-600" : "bg-white text-slate-500"
                )}
              >
                <BellOff className="w-3 h-3" />
                Opt-out
              </Badge>

              <Badge 
                onClick={() => onFilterChange({ hasUpcoming: !filters.hasUpcoming })}
                variant={filters.hasUpcoming ? "default" : "outline"} 
                className={cn(
                  "cursor-pointer transition-all border-slate-100 h-8 font-black text-[9px] uppercase tracking-widest gap-1 px-3 rounded-lg active:scale-95",
                  filters.hasUpcoming ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-white text-slate-500"
                )}
              >
                <CalendarCheck className="w-3 h-3" />
                Upcoming
              </Badge>
          </div>
        </div>
      </div>

      {/* List Body */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-6 pb-20 no-scrollbar space-y-1"
      >
        {loading && patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 space-y-3 opacity-50">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Registry...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
             <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <Users className="w-8 h-8 text-slate-300" />
             </div>
             <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">No matches found</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed px-4">
                    Try adjusting your criteria or search for a different name, phone, or email.
                </p>
             </div>
             <Button 
                onClick={onNewPatient} 
                variant="outline" 
                className="rounded-xl border-blue-100 text-blue-600 hover:bg-blue-50 text-[10px] font-black uppercase tracking-widest h-10 px-6 mt-4 transition-all active:scale-95"
             >
                <UserPlus className="w-4 h-4 mr-2" />
                Register New Patient
             </Button>
          </div>
        ) : (
          <>
            {patients.map((patient) => (
              <PatientCard 
                key={patient.id} 
                patient={patient} 
                isSelected={selectedId === patient.id}
                onSelect={onSelect}
                onEdit={onEdit}
                onBook={onBook}
                onDeactivate={onDeactivate}
              />
            ))}
            
            {loadingMore && (
              <div className="flex justify-center p-4">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              </div>
            )}
            
            {!hasMore && patients.length > 0 && (
              <div className="text-center p-8 opacity-40">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mx-auto mb-2" />
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">End of Registry</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action (Optional) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)]">
         <Button 
          onClick={onNewPatient}
          className="w-full h-12 bg-white/80 backdrop-blur-md hover:bg-white text-blue-600 border border-blue-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/10 transition-all hover:translate-y-[-2px] active:translate-y-0 group"
         >
            <Plus className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
            New Patient Record
         </Button>
      </div>
    </div>
  );
}
