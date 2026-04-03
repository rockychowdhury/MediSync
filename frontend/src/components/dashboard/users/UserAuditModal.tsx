"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { usersApi } from "@/lib/api/users";
import { Loader2, History, ShieldCheck as ShieldIcon, Clock, Activity, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface UserAuditModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserAuditModal({ userId, isOpen, onClose }: UserAuditModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchAudit = async () => {
        setLoading(true);
        try {
          const res = await usersApi.getUserAudit(userId);
          if (res.success) {
            setLogs(res.data || []);
          }
        } catch (error) {
          console.error("Failed to fetch user audit", error);
        } finally {
          setLoading(false);
        }
      };
      fetchAudit();
    }
  }, [isOpen, userId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl rounded-[32px] border-slate-200 p-0 overflow-hidden bg-white shadow-2xl">
        <DialogHeader className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100">
                <History className="w-5 h-5 text-indigo-500" />
              </div>
              Security Audit Trail
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-1">
              Historical ledger of administrative & clinical operations
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-0">
          {loading ? (
            <div className="h-[400px] flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Scanning Governance Logs...</p>
            </div>
          ) : logs.length > 0 ? (
            <ScrollArea className="h-[500px] w-full px-8 py-6">
              <div className="space-y-6 relative">
                {/* Visual Timeline Bar */}
                <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-100" />

                {logs.map((log, idx) => (
                  <div key={log.id || idx} className="relative pl-10 group">
                    {/* Timeline Node */}
                    <div className="absolute left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-200 group-hover:border-indigo-400 group-hover:scale-125 transition-all z-10" />
                    
                    <div className="bg-slate-50/40 rounded-2xl border border-slate-100 p-4 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-500">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="rounded-lg px-2 py-0.5 border-slate-100 bg-white text-[9px] font-black uppercase tracking-widest text-slate-500 shrink-0">
                          {log.action?.replace(/_/g, " ") || "EVENT"}
                        </Badge>
                        <div className="flex items-center text-[10px] font-bold text-slate-400">
                          <Clock className="w-3 h-3 mr-1.5 opacity-50" />
                          {format(new Date(log.created_at), "MMM d, h:mm a")}
                        </div>
                      </div>
                      
                      <p className="text-[13px] font-bold text-slate-700 leading-snug">
                        {log.details || log.description || "No granular metadata available for this operation."}
                      </p>

                      <div className="mt-3 flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                         <div className="flex items-center gap-1.5">
                            <Activity className="w-3 h-3" />
                            IP: {log.ip_address || "Internal"}
                         </div>
                         <div className="flex items-center gap-1.5">
                            <ShieldIcon className="w-3 h-3" />
                            {log.status || "Completed"}
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center px-12">
               <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-dashed border-slate-200">
                  <AlertCircle className="w-8 h-8 text-slate-200" />
               </div>
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">Registry Silent</h3>
               <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed"> No historical operations detected for this identity within the current retention window. </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
