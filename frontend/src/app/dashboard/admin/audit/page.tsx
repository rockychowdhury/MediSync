"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { AuditFilterBar } from "@/components/dashboard/audit/AuditFilterBar";
import { AuditStatsPanel } from "@/components/dashboard/audit/AuditStatsPanel";
import { JsonDiffViewer } from "@/components/dashboard/audit/JsonDiffViewer";
import { auditApi, usersApi } from "@/lib/api";
import type { ActivityLog, ActivityLogStats, ActivityLogQueryParams } from "@/types/audit";
import type { User } from "@/types/user";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function AuditLogsPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityLogStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState<ActivityLogQueryParams>({ skip: 0, limit: 50 });
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const fetchLogs = useCallback(async (isBackground = false) => {
    // 1. Fetch Logs
    try {
      if (!isBackground) setLoading(true);
      const logsRes = await auditApi.getLogs(filters);
      if (logsRes.success) setLogs(logsRes.data || []);
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        console.error("Failed to fetch audit logs", error);
      }
    } finally {
      if (!isBackground) setLoading(false);
    }

    // 2. Fetch Stats independently
    try {
      if (!isBackground) setStatsLoading(true);
      const statsRes = await auditApi.getStats();
      if (statsRes.success) setStats(statsRes.data || null);
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        console.error("Failed to fetch audit stats", error);
      }
    } finally {
      if (!isBackground) setStatsLoading(false);
    }
  }, [filters]);

  // Fetch Users List (One-time dependency)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await usersApi.getUsers();
        if (res.success) {
          setUsers(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch user list for audit filters", error);
      }
    };

    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  // Reactive Log Fetching (Gated by Auth)
  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
    } else {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [fetchLogs, isAuthenticated]);

  // True Real-Time WebSocket Streaming
  useWebSocket({
    channel: "dashboard:admin",
    enabled: isAuthenticated,
    onMessage: (event: { event: string; data?: any }) => {
      if (event.event === "audit_log_created" && event.data) {
        // Only refresh if not deep in history
        if (!filters.skip) {
          // Re-fetch fully so we get all relational data (names, formatted dates) immediately
          // we use fetchLogs(true) which is the background update
          fetchLogs(true);
        }
      }
    }
  });

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, entity_id: value || undefined, skip: 0 }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined, skip: 0 }));
  };

  const clearFilters = () => {
    setFilters({ skip: 0, limit: 50 });
  };

  const toggleRow = (id: number) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pb-2">
      <div className="shrink-0 mb-4">
        <PageHeader 
          breadcrumbs={["Home", "Admin", "Audit Trail"]} 
          title="System Audit Log" 
          actionContent={
            <div className="flex items-center space-x-2 text-[12px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live Streaming
            </div>
          }
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        
        {/* Main Log Console */}
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <AuditFilterBar 
            onSearch={handleSearch} 
            onFilterChange={handleFilterChange}
            activeFilters={{
              action_type: filters.action_type || "",
              entity_type: filters.entity_type || "",
              user_id: filters.user_id || "",
            }}
            onClear={clearFilters}
            users={users}
          />
          
          <DashboardCard className="flex-1 min-h-0 flex flex-col p-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto hidden-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                  <tr>
                    <th className="w-8 px-4 py-3"></th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actor</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Entity</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {loading && logs.length === 0 ? (
                    <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" /></td></tr>
                  ) : logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr 
                        className={`border-b border-slate-100/60 hover:bg-slate-50/50 cursor-pointer transition-colors ${expandedRowId === log.id ? 'bg-slate-50/80' : ''}`}
                        onClick={() => toggleRow(log.id)}
                      >
                        <td className="px-4 py-3 text-slate-400 font-bold">
                          {expandedRowId === log.id ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 flex items-center space-x-2">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] uppercase">
                            {log.user_name?.[0] || '?'}
                          </div>
                          <span>{log.user_name || 'System'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${
                            log.action_type.includes('create') ? 'bg-green-50 text-green-700' :
                            log.action_type.includes('delete') ? 'bg-red-50 text-red-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-600 capitalize">{log.entity_type}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500 break-all max-w-[120px]">{log.entity_id}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400 text-right">{log.ip_address || "127.0.0.1"}</td>
                      </tr>
                      {expandedRowId === log.id && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="text-[13px] font-medium text-slate-600 mb-3 ml-2 border-l-2 border-slate-300 pl-3">
                              {log.description || "No description provided."}
                            </div>
                            <JsonDiffViewer oldValues={log.old_values} newValues={log.new_values} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {!loading && logs.length === 0 && (
                     <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-medium">No activity logs found for your active filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="border-t border-slate-200 p-4 flex justify-between items-center bg-slate-50 shrink-0 rounded-b-2xl">
              <span className="text-[12px] font-bold text-slate-500 tracking-wide uppercase">
                {filters.skip! > 0 && "Viewing History"}
              </span>
              <div className="flex space-x-2">
                <button 
                  disabled={!filters.skip}
                  onClick={() => setFilters(p => ({...p, skip: Math.max(0, (p.skip || 0) - 50)}))}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 text-[13px] font-bold text-slate-600 disabled:opacity-50 hover:bg-white"
                >
                  Newer
                </button>
                <button 
                  disabled={logs.length < 50}
                  onClick={() => setFilters(p => ({...p, skip: (p.skip || 0) + 50}))}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 text-[13px] font-bold text-slate-600 disabled:opacity-50 hover:bg-white"
                >
                  Older
                </button>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Dynamic Activity Stats Side Panel */}
        <AuditStatsPanel stats={stats} loading={statsLoading} />
      </div>
    </div>
  );
}
