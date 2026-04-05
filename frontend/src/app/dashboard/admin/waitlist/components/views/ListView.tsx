import React, { useState } from "react";
import { 
  MoreHorizontal, 
  User, 
  Phone, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  Trash2,
  CheckSquare,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function ListView({ 
  entries, 
  loading,
  onAction
}: { 
  entries: any[]; 
  loading: boolean;
  onAction?: (action: string, entry: any) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === entries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(entries.map(e => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "waiting": return "bg-amber-50 text-amber-700 border-amber-100";
      case "assigned": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "cancelled": return "bg-slate-50 text-slate-500 border-slate-100";
      case "expired": return "bg-red-50 text-red-700 border-red-100";
      default: return "";
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "emergency": return <Badge variant="outline" className="rounded-xl border-red-200 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">⚡ Emergency</Badge>;
      case "urgent": return <Badge variant="outline" className="rounded-xl border-amber-200 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">🔶 Urgent</Badge>;
      default: return <Badge variant="outline" className="rounded-xl border-slate-200 bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">Standard</Badge>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 z-20 flex items-center gap-4 px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">{selectedIds.length} Records Selected</span>
           <div className="w-px h-4 bg-white/20 mx-2" />
           <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-8 rounded-lg hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-emerald-400 gap-2">
                 <CheckSquare className="w-3.5 h-3.5" /> Bulk Assign
              </Button>
              <Button size="sm" variant="ghost" className="h-8 rounded-lg hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-red-400 gap-2">
                 <Trash2 className="w-3.5 h-3.5" /> Remove
              </Button>
           </div>
           <button onClick={() => setSelectedIds([])} className="ml-4 text-white/40 hover:text-white transition-colors">
              <XCircle className="w-4 h-4" />
           </button>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto h-full hidden-scrollbar scroll-smooth">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-6 py-5 w-12">
                       <Checkbox 
                         checked={selectedIds.length === entries.length && entries.length > 0} 
                         onCheckedChange={toggleSelectAll} 
                         className="rounded-md border-slate-300"
                       />
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Added At</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                  {entries.map((entry) => (
                    <tr 
                      key={entry.id} 
                      className={cn(
                        "hover:bg-slate-50/30 transition-colors group",
                        selectedIds.includes(entry.id) && "bg-blue-50/30"
                      )}
                    >
                        <td className="px-6 py-5">
                           <Checkbox 
                             checked={selectedIds.includes(entry.id)} 
                             onCheckedChange={() => toggleSelect(entry.id)} 
                             className="rounded-md border-slate-300"
                           />
                        </td>
                        <td className="px-6 py-5">{priorityBadge(entry.priority)}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center font-black text-xs uppercase border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                {entry.patient?.name?.[0] || 'P'}
                              </div>
                              <div>
                                <div className="text-[14px] font-black text-slate-800 tracking-tight">{entry.patient?.name || "Unknown Patient"}</div>
                                <div className="text-[10px] font-bold text-slate-400">{entry.patient?.phone || "No contact"}</div>
                              </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-[14px] font-bold text-slate-700">{entry.service?.name || "Service Unavailable"}</div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                             {entry.provider_name || entry.provider?.name || "Any Available"}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                             <div className="text-[14px] font-bold text-slate-700 font-mono tracking-tight">
                                {format(new Date(entry.created_at), "HH:mm")}
                             </div>
                             <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                                {format(new Date(entry.created_at), "MMM dd, yyyy")}
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className={cn(
                              "inline-flex items-center px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
                              statusColor(entry.status)
                          )}>
                              {entry.status === 'waiting' && <AlertTriangle className="w-3.5 h-3.5 mr-2 animate-pulse" />}
                              {entry.status === 'assigned' && <CheckCircle2 className="w-3.5 h-3.5 mr-2" />}
                              {entry.status === 'cancelled' && <XCircle className="w-3.5 h-3.5 mr-2" />}
                              {entry.status === 'expired' && <History className="w-3.5 h-3.5 mr-2" />}
                              {entry.status}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-3 transition-all">
                              {entry.status === 'waiting' && (
                                <Button variant="ghost" className="h-10 px-5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                                    Assign Now
                                </Button>
                              )}
                              <button className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-100 text-slate-400 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 active:scale-90">
                                  <MoreHorizontal className="w-5 h-5" />
                              </button>
                          </div>
                        </td>
                    </tr>
                  ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
