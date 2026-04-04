"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { useProviders } from "./hooks/useProviders";
import { useProviderDetail } from "./hooks/useProviderDetail";
import { ProviderList } from "./components/ProviderList";
import { ProviderDetailPanel } from "./components/ProviderDetailPanel";
import { UserPlus, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromoteUserDialog } from "./components/dialogs/PromoteUserDialog";

export default function ProvidersManagementPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);

  const { providers, loading: listLoading, filters, updateFilters, refresh: refreshList } = useProviders();
  const { provider, loading: detailLoading, updateStatus, refresh: refreshDetail } = useProviderDetail(selectedProviderId);

  if (!isAuthenticated) return null;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-700 overflow-hidden">
      <div className="shrink-0 mb-4 px-1">
        <PageHeader 
          breadcrumbs={["Home", "Admin", "Providers"]} 
          title="Clinical Workforce"
          description="Manage provider profiles, operating hours, and clinical performance."
          actionContent={
            <Button 
              onClick={() => setIsPromoteDialogOpen(true)}
              className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[12px] uppercase tracking-wider shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Promote User
            </Button>
          }
        />
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* MASTER: Provider List */}
        <div className="w-[340px] h-full flex flex-col bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <ProviderList 
            providers={providers}
            selectedId={selectedProviderId}
            onSelect={setSelectedProviderId}
            filters={filters}
            onFilterChange={updateFilters}
            loading={listLoading}
          />
        </div>

        {/* DETAIL: Provider Management Workspace */}
        <div className="flex-1 h-full bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
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
