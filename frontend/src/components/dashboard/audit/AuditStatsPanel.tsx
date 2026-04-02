import React from "react";
import type { ActivityLogStats } from "@/types/audit";
import { Activity, AlertTriangle, Users, TrendingUp } from "lucide-react";

interface AuditStatsPanelProps {
  stats: ActivityLogStats | null;
  loading: boolean;
}

export function AuditStatsPanel({ stats, loading }: AuditStatsPanelProps) {
  return (
    <div className="w-full lg:w-72 flex flex-col gap-4 min-h-0 shrink-0">
      
      {/* Primary KPI Card */}
      <div className="bg-[#1E293B] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex items-center space-x-2 mb-6">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-[14px] text-slate-300 uppercase tracking-widest">24h Volume</h3>
        </div>
        
        <div className="text-[42px] font-bold tracking-tight leading-none mb-2">
          {loading ? "..." : stats?.total_actions_24h || 0}
        </div>
        <p className="text-[13px] font-medium text-slate-400">Total verified system events recorded</p>
      </div>

      <div className="bg-white border text-red-600 border-red-100 p-4 rounded-2xl flex items-center shadow-sm">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-4 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[18px] font-bold leading-none mb-1">
            {loading ? "..." : stats?.failed_logins_24h || 0}
          </div>
          <div className="text-[12px] font-bold text-red-400 uppercase tracking-widest">Failed Logins</div>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 p-5 rounded-2xl overflow-y-auto hidden-scrollbar flex flex-col min-h-0 shadow-sm">
        <div className="flex items-center space-x-2 mb-4 shrink-0">
          <Users className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-[15px] text-slate-800">Most Active Actors</h3>
        </div>

        <div className="space-y-3 pt-2">
          {loading ? (
            <div className="text-sm text-slate-400 font-medium">Loading actors...</div>
          ) : (
            stats?.top_active_users_24h?.map((user, index) => (
              <div key={user.user_id} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                    {index + 1}
                  </div>
                  <span className="text-[13px] font-bold text-slate-700 truncate">{user.user_name}</span>
                </div>
                <div className="text-[12px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">
                  {user.count}
                </div>
              </div>
            ))
          )}
          {!loading && (!stats?.top_active_users_24h || stats.top_active_users_24h.length === 0) && (
            <div className="text-sm text-slate-400 text-center py-4">No recent activity.</div>
          )}
        </div>
      </div>

    </div>
  );
}
