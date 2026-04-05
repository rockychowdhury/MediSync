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
import { Loader2, History, ShieldCheck as ShieldIcon, Clock, Activity, AlertCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
        <DialogHeader className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between shrink-0">
          <div className="flex flex-col">
            <DialogTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                <History className="w-5 h-5 text-indigo-500" />
              </div>
              Identity Ledger
            </DialogTitle>
            <DialogDescription className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 ml-1">
              Historical activity synchronization
            </DialogDescription>
          </div>
          <Link href={`/dashboard/admin/audit?user_id=${userId}`} passHref>
             <Button 
                variant="outline" 
                size="sm"
                className="h-9 rounded-xl border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-slate-50 shadow-sm flex items-center gap-2 group transition-all"
             >
                Full Monitoring
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
             </Button>
          </Link>
        </DialogHeader>

        <div className="p-0">
          {loading ? (
            <div className="h-[400px] flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Scanning Governance Logs...</p>
            </div>
          ) : logs.length > 0 ? (
            <ScrollArea className="h-[480px] w-full px-6 py-4">
              <div className="space-y-4 relative">
                {/* Visual Timeline Bar */}
                <div className="absolute left-[17px] top-4 bottom-4 w-px bg-slate-100" />

                {logs.map((log, idx) => (
                  <div key={log.id || idx} className="relative pl-10 group">
                    {/* Timeline Node */}
                    <div className="absolute left-[13px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-200 group-hover:border-indigo-400 group-hover:scale-125 transition-all z-10" />
                    
                    <div className="bg-slate-50/40 rounded-2xl border border-slate-100 p-4 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all duration-500">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="rounded-lg px-2 py-0 border-indigo-100 bg-indigo-50/50 text-[8px] font-black uppercase tracking-widest text-indigo-600 shrink-0">
                            {log.action_type?.replace(/_/g, " ") || "EVENT"}
                          </Badge>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.entity_type}</span>
                        </div>
                        <div className="flex items-center text-[9px] font-bold text-slate-300">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          {format(new Date(log.created_at), "MMM d, h:mm a")}
                        </div>
                      </div>
                      
                      <p className="text-[12px] font-bold text-slate-700 leading-snug">
                        {log.description || "No granular metadata available for this operation."}
                      </p>

                      <div className="mt-2.5 pt-2.5 border-t border-slate-50 flex items-center gap-4 text-[8px] font-black uppercase tracking-widest text-slate-400">
                         <div className="flex items-center gap-1.5">
                            <Activity className="w-2.5 h-2.5 text-slate-300" />
                            IP: {log.ip_address || "LOCAL"}
                         </div>
                         <div className="ml-auto flex items-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ShieldIcon className="w-2.5 h-2.5" />
                            SIGNED_BY_#{log.user_name?.split(" ")[0]}
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
