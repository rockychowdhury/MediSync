"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { auditApi } from "@/lib/api/audit";
import { usersApi } from "@/lib/api/users";
import type { ActivityLog, ActivityLogStats, ActivityLogQueryParams } from "@/types/audit";
import { useWebSocket } from "@/hooks/useWebSocket";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

// shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Calendar as AuditCalendar } from "@/components/ui/calendar";

import {
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  X,
  Activity,
  ShieldAlert,
  UserCheck,
  BarChart3,
  Radio,
  RefreshCw,
  Globe,
  Eye,
  ArrowRight,
  ArrowLeft,
  Shield,
  LogIn,
  LogOut,
  Search,
  Copy,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  Clock,
  MousePointer2,
  Database,
  Calendar as CalendarIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";



// ─── Action‑type color map ──────────────────────────────────────────
const ACTION_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  create: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  update: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  delete: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  login: { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200" },
  logout: { bg: "bg-slate-50", text: "text-slate-600", ring: "ring-slate-200" },
  login_failed: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-300" },
  status_change: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  assign: { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
  revoke: { bg: "bg-pink-50", text: "text-pink-700", ring: "ring-pink-200" },
};

function getActionStyle(action: string) {
  const normalizedAction = action.toLowerCase();
  const key = Object.keys(ACTION_STYLES).find((k) => normalizedAction === k);
  if (key) return ACTION_STYLES[key];

  // Dynamic color for unknown types
  return { bg: "bg-slate-50", text: "text-slate-600", ring: "ring-slate-200" };
}

// helper: does this action need visual emphasis?
function isHighPriority(action: string) {
  return /delete|login_failed|revoke/i.test(action);
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function AuditLogsPage() {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);

  // Core data
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ActivityLogStats | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role_name?: string }[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [expandedLog, setExpandedLog] = useState<ActivityLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [liveMonitoring, setLiveMonitoring] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Pagination & filters
  const PAGE_SIZE = 25;
  const [filters, setFilters] = useState<ActivityLogQueryParams>({ skip: 0, limit: PAGE_SIZE });

  // ─── Timeline Chart Component (Task 8) ───────────────────────────
  const TimelineChart = useMemo(() => {
    if (!logs.length) return null;

    // Group logs by hour for the last 24 hours
    const hourMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      hourMap[format(d, "HH:00")] = 0;
    }

    logs.forEach(l => {
      const h = format(new Date(l.created_at), "HH:00");
      if (hourMap[h] !== undefined) hourMap[h]++;
    });

    const data = Object.entries(hourMap).map(([time, count]) => ({ time, count }));

    return (
      <div className="h-[60px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              fillOpacity={1}
              fill="url(#colorCount)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }, [logs]);


  // ── Data fetching ───────────────────────────────────────────────
  const fetchLogs = useCallback(
    async (bg = false) => {
      try {
        if (!bg) setLoading(true);
        const res = await auditApi.getLogs(filters);
        if (res.success) {
          setLogs(res.data || []);
          setTotal(res.meta?.pagination?.total ?? 0);
        }
      } catch (err: any) {
        if (err?.response?.status !== 401) console.error(err);
      } finally {
        if (!bg) setLoading(false);
      }
    },
    [filters]
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await auditApi.getStats();
      if (res.success) setStats(res.data);
    } catch {
      // stats endpoint may not exist yet
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await usersApi.getUsers({ limit: 200 });
      if (res.success) setUsers(res.data || []);
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
      fetchStats();
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchLogs, fetchStats, fetchUsers]);

  // ── WebSocket (toggleable) ──────────────────────────────────────
  useWebSocket({
    channel: "dashboard:admin",
    enabled: isAuthenticated && liveMonitoring,
    token: token,
    onMessage: (event) => {
      if (event.event === "audit_log_created" && !filters.skip) {
        fetchLogs(true);
        fetchStats();
      }
    },
  });

  // ── Row detail (Task 9) ─────────────────────────────────────────
  const openLogDetail = async (log: ActivityLog) => {
    setDetailLoading(true);
    setExpandedLog(log); // show immediately with local data
    try {
      const res = await auditApi.getLogDetails(log.id);
      if (res.success) setExpandedLog(res.data);
    } catch {
      toast.error("Failed to fetch log details");
    } finally {
      setDetailLoading(false);
    }
  };

  // ── CSV Export (Task 5) ─────────────────────────────────────────
  const exportCsv = useCallback(async () => {
    try {
      setExporting(true);
      toast.info("Preparing export...", { description: "Fetching full history (up to 1000 records)" });

      // Fetch larger dataset for export (Backend limit: le=500)
      const res = await auditApi.getLogs({ ...filters, skip: 0, limit: 500 });
      const exportData = res.success ? res.data : logs;

      const headers = ["ID", "Date & Time", "Actor", "Action", "Entity Type", "Entity ID", "Description", "IP Address"];
      const rows = exportData.map((l) => [
        l.id,
        l.created_at,
        l.user_name || "System",
        l.action_type,
        l.entity_type,
        l.entity_id || "",
        `"${(l.description || "").replace(/"/g, '""')}"`,
        l.ip_address || "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_full_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Export complete", { description: `${exportData.length} records exported.` });
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }, [filters, logs]);


  // ── Filter helpers ──────────────────────────────────────────────
  const updateFilter = (key: string, value: string) =>
    setFilters((p) => ({ ...p, [key]: value || undefined, skip: 0 }));
  const clearFilters = () => setFilters({ skip: 0, limit: PAGE_SIZE });
  const activeFilterCount = [filters.action_type, filters.entity_type, filters.user_id, filters.start_date, filters.end_date].filter(Boolean).length;

  // ── Pagination ──────────────────────────────────────────────────
  const currentPage = Math.floor((filters.skip || 0) / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const goNewest = () => setFilters((p) => ({ ...p, skip: 0 }));
  const goOldest = () => setFilters((p) => ({ ...p, skip: Math.max(0, total - PAGE_SIZE) }));
  const goNext = () => setFilters((p) => ({ ...p, skip: Math.min((p.skip || 0) + PAGE_SIZE, total - 1) }));
  const goPrev = () => setFilters((p) => ({ ...p, skip: Math.max(0, (p.skip || 0) - PAGE_SIZE) }));

  // ── Derived stat data for cards ─────────────────────────────────
  // Build a mini hourly distribution from current logs (last 7 buckets)
  const hourlyDistribution = useMemo(() => {
    const buckets = new Array(7).fill(0);
    logs.forEach((l) => {
      const h = new Date(l.created_at).getHours();
      buckets[Math.min(Math.floor(h / 4), 6)]++;
    });
    return buckets;
  }, [logs]);

  // Unique entity types from current page for the sparkline card
  const entityBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((l) => {
      map[l.entity_type] = (map[l.entity_type] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [logs]);

  const topUser = stats?.top_active_users_24h?.[0];

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="shrink-0 mb-5">
        <PageHeader
          breadcrumbs={["Home", "Admin", "Audit Trail"]}
          title="System Audit Log"
          actionContent={
            <div className="flex items-center gap-3">
              {/* Live Monitoring toggle (Task 2) */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-sm">
                <Radio className={`w-3.5 h-3.5 ${liveMonitoring ? "text-green-500" : "text-slate-300"}`} />
                <Label htmlFor="live-toggle" className="text-xs font-semibold text-slate-600 select-none cursor-pointer">
                  Live Monitoring
                </Label>
                <Switch
                  id="live-toggle"
                  checked={liveMonitoring}
                  onCheckedChange={setLiveMonitoring}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>
          }
        />
      </div>

      {/* ─── Stats Cards (Task 9 + Task 8) ────────────────────────── */}
      <AnimatePresence>
        {!isMaximized && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-1 -m-1"
          >
            {/* Card 1: Activity Timeline Recharts (Task 8) */}
            <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50/30">
              <CardContent className="p-5 flex flex-col justify-between h-full group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Pulse</span>
                  </div>
                </div>
                {TimelineChart}
                <p className="text-[9px] font-medium text-slate-400 mt-4 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Activity density (last 24h)
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Total Actions 24h */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50/80 rounded-xl">
                      <Activity className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Load</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <div className="text-3xl font-bold text-slate-800 tracking-tight">
                    {stats?.total_actions_24h ?? "—"}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    +12%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-4 font-semibold">
                  {total.toLocaleString()} total audit entries
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Failed Logins (Task 9) */}
            <Card className="border-slate-200 shadow-sm relative">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${(stats?.failed_logins_24h ?? 0) > 0 ? "bg-red-50" : "bg-slate-50"}`}>
                      <ShieldAlert className={`w-4 h-4 ${(stats?.failed_logins_24h ?? 0) > 0 ? "text-red-500" : "text-slate-400"}`} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Alerts</span>
                  </div>
                </div>
                <div className={`text-3xl font-bold tracking-tight mt-2 ${(stats?.failed_logins_24h ?? 0) > 0 ? "text-red-600 animate-pulse" : "text-slate-800"}`}>
                  {stats?.failed_logins_24h ?? "0"}
                </div>
                <p className="text-[11px] text-slate-400 mt-4 font-semibold flex items-center gap-1">
                  {(stats?.failed_logins_24h ?? 0) > 0 ? "Potential threats detected" : "No critical threats"}
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Top Active User */}
            <Card className="border-slate-200/80 shadow-sm">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Operator</span>
                  </div>
                </div>
                {topUser ? (
                  <div className="mt-2">
                    <div className="text-xl font-bold text-slate-800 truncate">
                      {topUser.user_name}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                        {topUser.count} events
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold truncate max-w-[120px] ml-4">
                        {users.find((u) => u.id === topUser.user_id)?.email || topUser.user_id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-slate-300 mt-2">Scanning logs...</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ─── Toolbar: Horizontal Filters (Task 10 + Refinement) ──────── */}
      <div className="shrink-0 flex flex-wrap items-center gap-2.5 mb-2">
        {/* Action Type Select */}
        <Select value={filters.action_type || "all"} onValueChange={(v) => updateFilter("action_type", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-32 rounded-xl border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-slate-400" />
              <SelectValue placeholder="Action" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200">
            <SelectItem value="all" className="text-xs font-bold cursor-pointer">All Actions</SelectItem>
            {["create", "update", "delete", "login", "logout", "login_failed", "status_change", "assign", "revoke"].map((a) => (
              <SelectItem key={a} value={a} className="text-xs font-medium capitalize cursor-pointer">{a.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Entity Type Select */}
        <Select value={filters.entity_type || "all"} onValueChange={(v) => updateFilter("entity_type", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-32 rounded-xl border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3 text-slate-400" />
              <SelectValue placeholder="Entity" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200">
            <SelectItem value="all" className="text-xs font-bold cursor-pointer">All Entities</SelectItem>
            {["user", "patient", "appointment", "provider", "service", "role", "permission", "availability", "waitlist"].map((e) => (
              <SelectItem key={e} value={e} className="text-xs font-medium capitalize cursor-pointer">{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Actor Select */}
        <Select value={filters.user_id || "all"} onValueChange={(v) => updateFilter("user_id", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-40 rounded-xl border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <UserCheck className="w-3 h-3 text-slate-400" />
              <SelectValue placeholder="Actor" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 max-h-48">
            <SelectItem value="all" className="text-xs font-bold cursor-pointer">All Actors</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id} className="text-xs font-medium cursor-pointer">{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ref ID Input */}
        <div className="relative group">
          <Input
            placeholder="Search Entity ID..."
            value={filters.entity_id || ""}
            onChange={(e) => updateFilter("entity_id", e.target.value)}
            className="h-9 w-44 rounded-xl border-slate-200 bg-white text-[11px] font-bold pl-8 focus-visible:ring-1 focus-visible:ring-indigo-400 focus-visible:border-indigo-400 shadow-none hover:border-slate-300 transition-all"
          />
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors" />
        </div>

        {/* Date Range: Start (Shadcn Calendar Integration) */}
        <Popover>
          <PopoverTrigger
            type="button"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 w-44 justify-start text-left rounded-xl border-slate-200 bg-white shadow-none hover:bg-slate-50 hover:border-slate-300 focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-all cursor-pointer group px-3 outline-none",
              !filters.start_date && "text-slate-400"
            )}
          >
            <CalendarIcon className="mr-2.5 h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-widest truncate">
              {filters.start_date ? format(new Date(filters.start_date), "MMM dd, yyyy") : "From Date"}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl border-slate-200 shadow-2xl" align="start">
            <AuditCalendar
              mode="single"
              selected={filters.start_date ? new Date(filters.start_date) : undefined}
              onSelect={(date: Date | undefined) => updateFilter("start_date", date ? format(date, "yyyy-MM-dd") : "")}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Date Range: End (Shadcn Calendar Integration) */}
        <Popover>
          <PopoverTrigger
            type="button"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 w-44 justify-start text-left rounded-xl border-slate-200 bg-white shadow-none hover:bg-slate-50 hover:border-slate-300 focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-all cursor-pointer group px-3 outline-none",
              !filters.end_date && "text-slate-400"
            )}
          >
            <CalendarIcon className="mr-2.5 h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-widest truncate">
              {filters.end_date ? format(new Date(filters.end_date), "MMM dd, yyyy") : "To Date"}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl border-slate-200 shadow-2xl" align="start">
            <AuditCalendar
              mode="single"
              selected={filters.end_date ? new Date(filters.end_date) : undefined}
              onSelect={(date: Date | undefined) => updateFilter("end_date", date ? format(date, "yyyy-MM-dd") : "")}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Clear Filters (Only show if active) */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export CSV (Minimized version) */}
        <Tooltip>
          <TooltipTrigger
            onClick={exportCsv}
            disabled={exporting}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 rounded-xl border-slate-200 bg-white px-3 text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all cursor-pointer group active:scale-95 disabled:opacity-50")}
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
            )}
            {exporting ? "Preparing Dataset..." : "Secure CSV Export"}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px] font-bold">Comprehensive history (up to 500 records)</TooltipContent>
        </Tooltip>

        {/* Refresh (Task 6) */}
        <Tooltip>
          <TooltipTrigger
            onClick={() => { fetchLogs(); fetchStats(); }}
            className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer active:rotate-180 duration-500 flex items-center justify-center p-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px] font-bold">Resync background data</TooltipContent>
        </Tooltip>


      </div>

      {/* ─── Logs Table (Task 5, 6, 7, 8) ───────────────────────── */}
      <Card className="flex-1 min-h-0 flex flex-col border-slate-200 shadow-sm overflow-hidden">
        <div className="flex-1 min-h-0 overflow-auto">
          <Table className="w-full">
            <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur z-20 border-b border-slate-200">
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="w-[180px] text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-8">Date & Time</TableHead>
                <TableHead className="w-[220px] text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actor Identity</TableHead>
                <TableHead className="w-[280px] text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action Details</TableHead>
                <TableHead className="w-[240px] text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resource Link</TableHead>
                <TableHead className="w-[140px] text-[10px] font-bold text-slate-500 uppercase tracking-widest">Access IP</TableHead>
                <TableHead className="w-[100px] text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right pr-8">Inspect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && logs.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`} className="border-slate-50 cursor-wait">
                    <TableCell className="pl-8 py-5"><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-48 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-12 w-56 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28 rounded-sm" /></TableCell>
                    <TableCell className="text-right pr-8"><Skeleton className="h-8 w-8 ml-auto rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-80 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Search className="w-10 h-10 text-slate-200" />
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Zero Analysis Results</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const style = getActionStyle(log.action_type);
                  const hp = isHighPriority(log.action_type);
                  const created = new Date(log.created_at);
                  const userObj = users.find((u) => u.id === log.user_id);

                  const copyToClipboard = (text: string, label: string) => {
                    navigator.clipboard.writeText(text);
                    toast.success(`${label} Copied`, {
                      position: "top-center",
                      description: text,
                      className: "rounded-2xl border-slate-200 shadow-2xl font-sans"
                    });
                  };

                  return (
                    <TableRow
                      key={log.id}
                      className={`border-b border-slate-50 transition-all group relative h-[72px] ${hp
                        ? "bg-red-50/20 hover:bg-red-50/40"
                        : "hover:bg-slate-50/50"
                        } cursor-default`}
                    >
                      {/* Date & Time */}
                      <TableCell className="pl-8 py-4 relative">
                        {hp && <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-red-500 rounded-r-full shadow-[0_0_12px_rgba(239,68,68,0.3)]" />}
                        <div className="text-[13px] font-bold text-slate-800">
                          {format(created, "MMM dd, yyyy")}
                        </div>
                        <div className="text-[11px] text-slate-400 font-bold mt-1">
                          {format(created, "hh:mm:ss a")}
                        </div>
                      </TableCell>

                      {/* Actor Identity */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center text-[12px] font-black uppercase shrink-0 shadow-sm transition-transform group-hover:scale-105">
                            {log.user_name?.[0] || "S"}
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <div className="text-[14px] font-bold text-slate-800 truncate leading-tight flex items-center gap-2">
                              {log.user_name || "System"}
                              {userObj?.role_name && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-black uppercase text-blue-600 bg-blue-50 border-blue-100 rounded-sm">
                                  {userObj.role_name}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 group/id">
                              <span className="text-[11px] text-slate-400 font-semibold truncate max-w-[140px]">
                                {userObj?.email || log.user_id || "system@medisync"}
                              </span>
                              {log.user_id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(log.user_id!, "User ID");
                                  }}
                                  className="opacity-0 group-hover/id:opacity-100 p-1 rounded-md hover:bg-slate-200 transition-all cursor-pointer"
                                  title="Copy User ID"
                                >
                                  <Copy className="w-3 h-3 text-slate-400" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Action Details */}
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-2">
                          <div className={`w-fit rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ring-1 border-0 shadow-sm ${style.bg} ${style.text} ${style.ring}`}>
                            {log.action_type.replace(/_/g, " ")}
                          </div>
                          <p className="text-[12px] text-slate-500 font-semibold truncate max-w-[260px]" title={log.description || ""}>
                            {log.description || "No supplemental details recorded"}
                          </p>
                        </div>
                      </TableCell>

                      {/* Resource Link */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 group/eid min-w-0">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                            {log.entity_type}
                          </span>
                          <span className="text-slate-300 font-black shrink-0">:</span>

                          <div className="relative flex items-center gap-2 min-w-0 group-hover/eid:bg-slate-50 transition-colors rounded-lg px-0.5">
                            <div className="relative overflow-hidden flex items-center bg-slate-100/80 border border-slate-200/50 rounded-md px-2 py-0.5 w-[110px] shrink-0">
                              <span className="text-[12px] font-mono font-bold text-slate-700 whitespace-nowrap">
                                {log.action_type.toLowerCase().includes("login")
                                  ? (log.user_id || "—")
                                  : (log.entity_id || "—")}
                              </span>
                              <div className="absolute top-0 right-0 bottom-0 w-6 bg-gradient-to-l from-slate-100 to-transparent pointer-events-none" />
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(log.entity_id || log.user_id || "", "Entity ID");
                              }}
                              className="opacity-0 group-hover/eid:opacity-100 p-1 rounded-md hover:bg-slate-200 transition-all cursor-pointer shrink-0"
                            >
                              <Copy className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        </div>
                      </TableCell>

                      {/* IP Access */}
                      <TableCell className="py-4">
                        <div className="inline-flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl text-[11px] text-slate-500 font-mono font-bold border border-slate-200/50">
                          <Globe className="w-3.5 h-3.5 text-slate-300" />
                          {log.ip_address || "127.0.0.1"}
                        </div>
                      </TableCell>

                      {/* Detail button */}
                      <TableCell className="text-right pr-8 py-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openLogDetail(log)}
                          className="h-10 w-10 rounded-2xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer shadow-sm border border-transparent hover:border-indigo-100 group/btn"
                        >
                          <Maximize2 className="w-4.5 h-4.5 group-hover/btn:scale-110 transition-transform" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

        </div>

        {/* ─── Footer Controls (Task 7) ────────────────────────────── */}
        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-6">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
              Showing {Math.min((filters.skip || 0) + 1, total)}–{Math.min((filters.skip || 0) + PAGE_SIZE, total)} of {total.toLocaleString()} entries
            </span>

            {/* Maximized Toggle (Task 7) */}
            <Tooltip>
              <TooltipTrigger
                onClick={() => setIsMaximized(!isMaximized)}
                className="h-8 w-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 shadow-sm transition-all cursor-pointer flex items-center justify-center p-0"
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px] font-bold">
                {isMaximized ? "Classic Mode" : "Terminal Mode"}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger
                disabled={!filters.skip}
                onClick={goNewest}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-4 rounded-xl border-slate-200 text-[10px] font-bold uppercase hover:bg-slate-100 disabled:opacity-30 transition-all cursor-pointer")}
              >
                Newest
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px] font-bold">First Page</TooltipContent>
            </Tooltip>

            <Button variant="outline" size="icon" disabled={!filters.skip} onClick={goPrev} className="h-8 w-8 rounded-xl border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center bg-white border border-slate-200 px-4 py-1.5 rounded-2xl shadow-sm">
              <span className="text-[12px] font-semibold text-slate-700 tracking-tight">
                {currentPage} <span className="text-slate-300 mx-2">/</span> {totalPages}
              </span>
            </div>

            <Button variant="outline" size="icon" disabled={(filters.skip || 0) + PAGE_SIZE >= total} onClick={goNext} className="h-8 w-8 rounded-xl border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Tooltip>
              <TooltipTrigger
                disabled={(filters.skip || 0) + PAGE_SIZE >= total}
                onClick={goOldest}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-4 rounded-xl border-slate-200 text-[10px] font-bold uppercase hover:bg-slate-100 disabled:opacity-30 transition-all cursor-pointer")}
              >
                Oldest
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px] font-bold">Last Page</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>

      {/* ─── Detail Dialog (Task 9) ──────────────────────────────── */}
      <Dialog open={!!expandedLog} onOpenChange={(open) => !open && setExpandedLog(null)}>
        <DialogContent className="sm:max-w-[640px] rounded-2xl border-slate-200 p-0 overflow-hidden max-h-[85vh] flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Log Entry #{expandedLog?.id}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              {expandedLog && format(new Date(expandedLog.created_at), "MMMM dd, yyyy 'at' hh:mm:ss a")}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : expandedLog && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Action Type</span>
                  <Badge variant="outline" className={`${getActionStyle(expandedLog.action_type).bg} ${getActionStyle(expandedLog.action_type).text} border-0 ring-1 ${getActionStyle(expandedLog.action_type).ring} font-bold`}>
                    {expandedLog.action_type.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Actor</span>
                  <p className="font-semibold text-slate-800">{expandedLog.user_name || "System"}</p>
                  <p className="text-xs text-slate-400">{expandedLog.user_id}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Entity</span>
                  <p className="font-semibold text-slate-700 capitalize">{expandedLog.entity_type} <span className="text-slate-300">:</span> <span className="font-mono text-xs text-slate-500">{expandedLog.entity_id}</span></p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">IP Address</span>
                  <p className="font-mono text-sm text-slate-600 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-300" />
                    {expandedLog.ip_address || "127.0.0.1"}
                  </p>
                </div>
              </div>

              {/* Description */}
              {expandedLog.description && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Description</span>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">{expandedLog.description}</p>
                </div>
              )}

              {/* JSON diff (old/new values) */}
              {(expandedLog.old_values || expandedLog.new_values) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-1">Old Values</span>
                    <pre className="text-[11px] bg-red-50/50 text-slate-700 rounded-xl p-3 border border-red-100 overflow-x-auto max-h-48 font-mono leading-relaxed">
                      {expandedLog.old_values
                        ? JSON.stringify(expandedLog.old_values, null, 2)
                        : "null"}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-1">New Values</span>
                    <pre className="text-[11px] bg-emerald-50/50 text-slate-700 rounded-xl p-3 border border-emerald-100 overflow-x-auto max-h-48 font-mono leading-relaxed">
                      {expandedLog.new_values
                        ? JSON.stringify(expandedLog.new_values, null, 2)
                        : "null"}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
