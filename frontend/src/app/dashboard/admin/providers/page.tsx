"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { useProviders } from "./hooks/useProviders";
import { useProviderDetail } from "./hooks/useProviderDetail";
import { ProviderList } from "./components/ProviderList";
import { ProviderDetailPanel } from "./components/ProviderDetailPanel";
import { ProviderTable } from "./components/ProviderTable";
import {
  UserPlus,
  Loader2,
  Users,
  Search,
  RefreshCw,
  XCircle,
  LayoutGrid,
  Table2,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromoteUserDialog } from "./components/dialogs/PromoteUserDialog";
import { providersApi } from "@/lib/api/providers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ViewMode = "registry" | "workspace";

export default function ProvidersManagementPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("registry");

  const { providers, loading: listLoading, filters, updateFilters, refresh: refreshList } = useProviders();
  const { provider, loading: detailLoading, updateStatus, refresh: refreshDetail } = useProviderDetail(selectedProviderId);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await providersApi.updateProviderStatus(id, status);
      toast.success("Status Updated", {
        description: `Provider status has been changed to ${status}.`,
      });
      refreshList();
    } catch (error) {
      toast.error("Failed to update provider status");
    }
  };

  const handleSelectFromTable = (id: string) => {
    setSelectedProviderId(id);
    setViewMode("workspace");
  };

  const hasFilters = filters.search !== "" || filters.status !== "all";

  const clearFilters = () => {
    updateFilters({ search: "", status: "all", specialization_id: null });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="h-full flex flex-col gap-4 py-5 animate-in fade-in duration-700 bg-slate-50/30">
      <PageHeader
        breadcrumbs={["Admin", "Governance", "Clinical Workforce"]}
        title="Clinical Workforce"
      />

      {/* ─── Control Toolbar ────────────────────────────────────── */}
      <div className="px-0 shrink-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4 w-full">
            <div className="relative flex-1 group/search max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within/search:text-indigo-500 transition-all" />
              <Input
                placeholder="Lookup clinician by name..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="h-9 pl-9 border-slate-200/60 bg-white/80 focus-visible:ring-2 focus-visible:ring-indigo-500/10 focus-visible:bg-white rounded-xl font-bold text-[11px] text-slate-700 w-full transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={filters.status}
                onValueChange={(v) => updateFilters({ status: v })}
              >
                <SelectTrigger className="h-9 w-36 rounded-xl border-slate-200/60 bg-white/80 text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-white transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-slate-400" />
                    <SelectValue placeholder="All Status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Status</SelectItem>
                  <SelectItem value="available" className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Available</SelectItem>
                  <SelectItem value="on_leave" className="text-[10px] font-black uppercase tracking-widest text-amber-600">On Leave</SelectItem>
                  <SelectItem value="busy" className="text-[10px] font-black uppercase tracking-widest text-blue-600">Busy</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="h-9 px-3 rounded-xl border-rose-100 bg-rose-50/50 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center gap-2 shadow-sm"
                >
                  <XCircle className="w-3 h-3" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("registry")}
                className={cn(
                  "h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer",
                  viewMode === "registry"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Table2 className="w-3 h-3 mr-1.5" />
                Registry
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("workspace")}
                className={cn(
                  "h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer",
                  viewMode === "workspace"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid className="w-3 h-3 mr-1.5" />
                Workspace
              </Button>
            </div>

            <Button
              onClick={() => setIsPromoteDialogOpen(true)}
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all active:scale-95 shadow-md shadow-indigo-100 flex items-center gap-2 group text-[10px] uppercase tracking-widest cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              Promote User
            </Button>
            <Button
              variant="outline"
              onClick={refreshList}
              className="h-9 w-9 p-0 rounded-xl border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-black shadow-sm cursor-pointer"
            >
              <RefreshCw className={cn("w-4 h-4", listLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Content Area ─────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {viewMode === "registry" ? (
          /* ─── Table Registry View ──────────────────────────── */
          listLoading && providers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Workforce Registry...</p>
            </div>
          ) : (
            <ProviderTable
              providers={providers}
              loading={listLoading}
              onSelectProvider={handleSelectFromTable}
              onStatusChange={handleStatusChange}
            />
          )
        ) : (
          /* ─── Master-Detail Workspace View ─────────────────── */
          <div className="flex-1 flex gap-6 min-h-0">
            <div className="w-[340px] h-full flex flex-col bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <ProviderList
                providers={providers}
                selectedId={selectedProviderId}
                onSelect={setSelectedProviderId}
                filters={filters}
                onFilterChange={updateFilters}
                loading={listLoading}
              />
            </div>

            <div className="flex-1 h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              {selectedProviderId ? (
                <ProviderDetailPanel
                  provider={provider}
                  loading={detailLoading}
                  onUpdate={refreshDetail}
                  onStatusChange={updateStatus}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-2 border border-slate-100">
                    <Users className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No Provider Selected</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Select a clinical staff member from the list to manage their profile, availability, and clinical statistics.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <PromoteUserDialog
        isOpen={isPromoteDialogOpen}
        onClose={() => setIsPromoteDialogOpen(false)}
        onSuccess={() => {
          refreshList();
          setIsPromoteDialogOpen(false);
        }}
      />
    </div>
  );
}
