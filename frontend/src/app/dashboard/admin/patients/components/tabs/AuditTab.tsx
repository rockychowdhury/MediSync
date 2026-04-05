import React from "react";
import { History, User, Clock, FileText, ArrowRight, ShieldCheck, Info } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AuditTabProps {
  logs: any[];
}

export function AuditTab({ logs }: AuditTabProps) {
  const LogEntry = ({ log }: { log: any }) => {
    const hasDiff = log.old_values || log.new_values;
    const diff = {
      old: log.old_values ? (typeof log.old_values === 'string' ? JSON.parse(log.old_values) : log.old_values) : {},
      new: log.new_values ? (typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values) : {}
    };

    const changedKeys = Object.keys({ ...diff.old, ...diff.new });

    return (
      <div className="relative pl-12 pb-12 group last:pb-0">
        <div className="absolute left-0 top-0 w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all z-10">
           <History className="w-4 h-4" />
        </div>
        
        {/* Connection Line */}
        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-100 group-last:hidden" />

        <div className="space-y-4">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest">{log.action || "Update"}</p>
                <div className="flex items-center gap-3 mt-1">
                   <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {format(new Date(log.created_at), "dd MMM yyyy, hh:mm a")}</p>
                   <span className="text-slate-200">•</span>
                   <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {log.user?.name || "System Process"} ({log.user?.role || "System"})</p>
                </div>
              </div>
              <Badge variant="outline" className="h-6 px-2.5 rounded-lg bg-blue-50/50 text-blue-600 border-blue-100 text-[9px] font-black uppercase tracking-widest gap-2">
                 <ShieldCheck className="w-3 h-3" />
                 Verified Log
              </Badge>
           </div>

           <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-md transition-all">
              <p className="text-xs text-slate-600 font-bold mb-4 flex items-center gap-2">
                 <FileText className="w-3.5 h-3.5" />
                 {log.description || "Administrative change across registry record."}
              </p>
              
              {changedKeys.length > 0 && (
                <div className="space-y-3">
                   <div className="grid grid-cols-3 gap-4 pb-2 border-b border-slate-100">
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Field Attribute</p>
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Historical Value</p>
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Modified Value</p>
                   </div>
                   {changedKeys.map(key => (
                     <div key={key} className="grid grid-cols-3 gap-4 items-center">
                        <p className="text-[10px] font-mono font-bold text-slate-500 truncate">{key}</p>
                        <p className="text-[10px] font-bold text-slate-400 line-through truncate">{String(diff.old[key] ?? "—")}</p>
                        <div className="flex items-center gap-3">
                           <ArrowRight className="w-3 h-3 text-emerald-500" />
                           <p className="text-[10px] font-bold text-emerald-600 truncate">{String(diff.new[key] ?? "—")}</p>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full space-y-0">
       <div className="px-8 pt-8 pb-4 flex items-center justify-between bg-white border-b border-slate-50 sticky top-0 z-20">
         <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-3">
               <History className="w-6 h-6 text-slate-600" />
               Immutable Activity Registry
            </h2>
            <p className="text-xs text-slate-500 mt-1">Full cryptographic audit trail of all record modifications</p>
         </div>
      </div>

      <div className="p-12 pb-24">
         {logs.map((log) => <LogEntry key={log.id} log={log} />)}
         
         {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
               <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <History className="w-12 h-12 text-slate-200" />
               </div>
               <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-800">Historical logs are being synced</h4>
                  <p className="text-sm text-slate-500 leading-relaxed px-4 max-w-sm mx-auto">
                     No recorded activity found for this patient across the clinical registry yet.
                  </p>
               </div>
            </div>
         )}
      </div>
    </div>
  );
}
