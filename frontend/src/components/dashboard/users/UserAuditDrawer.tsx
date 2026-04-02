"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { usersApi } from "@/lib/api";
import { 
  Loader2, 
  History, 
  Clock, 
  Activity, 
  Database, 
  ShieldAlert, 
  X,
  Globe,
  FileType
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface UserAuditDrawerProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserAuditDrawer({
  userId,
  isOpen,
  onClose,
}: UserAuditDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const loadLogs = useCallback(async () => {
    if (!userId || !isOpen) return;
    setLoading(true);
    try {
      const res = await usersApi.getUserAudit(userId, { limit: 50 });
      if (res.success) {
        setLogs(res.data || []);
        setTotal(res.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Failed to load user audit trail", error);
    } finally {
      setLoading(false);
    }
  }, [userId, isOpen]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes("create") || a.includes("activate")) return "text-green-600 bg-green-50 border-green-100";
    if (a.includes("delete") || a.includes("deactivate") || a.includes("revoke")) return "text-red-500 bg-red-50 border-red-100";
    if (a.includes("update") || a.includes("modify")) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-blue-600 bg-blue-50 border-blue-100";
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DrawerContent className="sm:max-w-xl border-l border-slate-200 shadow-2xl flex flex-col bg-white">
        <div className="flex-1 flex flex-col min-h-0">
          <DrawerHeader className="p-8 bg-slate-50/50 border-b border-slate-100 flex-shrink-0 relative">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-100">
                     <History className="w-6 h-6" />
                   </div>
                   <div>
                      <DrawerTitle className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">
                        Security Audit Ledger
                      </DrawerTitle>
                      <DrawerDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-none">
                        Historical Record of Personnel Actions
                      </DrawerDescription>
                   </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>
             
             <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                   <Activity className="w-3.5 h-3.5 text-blue-500" />
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{total} Total Events Indexed</span>
                </div>
                <div className="flex items-center gap-2">
                   <Database className="w-3.5 h-3.5 text-amber-500" />
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">High-Durable Log Chain</span>
                </div>
             </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-white">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Cryptographic Audit Chain...</p>
               </div>
            ) : (
               <div className="relative pl-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                  {/* Timeline Rail */}
                  <div className="absolute left-3.5 top-2 bottom-4 w-px bg-slate-100" />

                  {logs.map((log, idx) => (
                    <div key={log.id} className="relative">
                       {/* Timeline Marker */}
                       <div className="absolute -left-8 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center ring-4 ring-white shadow-sm transition-transform hover:scale-125 duration-300">
                          <div className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-amber-500 animate-ping" : "bg-slate-300"}`} />
                       </div>

                       <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 group hover:bg-white hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300">
                          <div className="flex items-center justify-between mb-3">
                             <Badge variant="outline" className={`rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border ${getActionColor(log.action_type)}`}>
                                {log.action_type.replace(/_/g, ' ')}
                             </Badge>
                             <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest gap-2">
                                <Clock className="w-3.5 h-3.5 opacity-50" />
                                {format(new Date(log.created_at), "MMM d, h:mm a")}
                             </div>
                          </div>
                          
                          <p className="text-[13px] font-bold text-slate-700 leading-relaxed mb-4">
                             {log.description || `Performed ${log.action_type} on ${log.entity_type} unit.`}
                          </p>

                          <div className="flex items-center gap-4 pt-3 border-t border-slate-100/50">
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Globe className="w-3 h-3 opacity-40 text-blue-500" />
                                {log.ip_address || "Internal Core"}
                             </div>
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <FileType className="w-3 h-3 opacity-40 text-amber-500" />
                                {log.entity_type}
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}

                  {logs.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-24 text-center">
                        <ShieldAlert className="w-10 h-10 text-slate-200 mb-4" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">No Audit Events Indexed for this Identity</p>
                     </div>
                  )}
               </div>
            )}
          </div>
        </div>

        <DrawerFooter className="p-8 bg-slate-50/50 border-t border-slate-100 flex-shrink-0">
           <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex items-center gap-4 group">
              <ShieldAlert className="w-8 h-8 text-amber-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              <div>
                 <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-none mb-1">Administrative Transparency</div>
                 <div className="text-[11px] font-black text-slate-700 tracking-tight leading-none italic">
                   ALL ACTIONS ARE CRYPTOGRAPHICALLY LOGGED & ACCOUNTABLE.
                 </div>
              </div>
           </div>
           <Button variant="ghost" onClick={onClose} className="mt-4 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px] bg-white border border-slate-200 shadow-sm">
             Exit Audit Insight
           </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
