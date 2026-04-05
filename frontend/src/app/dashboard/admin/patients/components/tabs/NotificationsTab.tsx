import React from "react";
import { Mail, Smartphone, CheckCircle, XCircle, Clock, RotateCcw, AlertTriangle, ExternalLink, Calendar, Info, BellRing } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NotificationsTabProps {
  notifications: any[];
  onResend: (id: string) => void;
}

export function NotificationsTab({ notifications, onResend }: NotificationsTabProps) {
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "sent": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "failed": return <XCircle className="w-4 h-4 text-rose-500" />;
      case "skipped": return <RotateCcw className="w-4 h-4 text-amber-500" />;
      case "pending": return <Clock className="w-4 h-4 text-slate-400" />;
      default: return <Info className="w-4 h-4 text-slate-300" />;
    }
  };

  const StatusLabel = ({ status }: { status: string }) => {
    const config: any = {
      sent: "Sent Successfully",
      failed: "Delivery Failed",
      skipped: "Skipped (Opt-out)",
      pending: "Delivery Pending",
    };
    return <span className="text-[10px] font-black uppercase tracking-widest">{config[status] || status}</span>;
  };

  return (
    <div className="h-full space-y-0">
      <div className="px-8 pt-8 pb-4 flex items-center justify-between bg-white border-b border-slate-50 sticky top-0 z-20">
         <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-3">
               <BellRing className="w-6 h-6 text-blue-600" />
               Notification Registry
            </h2>
            <p className="text-xs text-slate-500 mt-1">Audit log of all clinical and administrative communications</p>
         </div>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Channel</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Communication Type</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Status</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center">Timestamp</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        {n.channel === "email" ? <Mail className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-800">{n.channel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800">{n.title || n.type || "System Alert"}</p>
                      <p className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">{n.subject || n.content}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50">
                     <div className="flex items-center gap-2">
                        <StatusIcon status={n.status} />
                        <div className="space-y-0.5">
                           <StatusLabel status={n.status} />
                           {n.status === "failed" && n.error_message && (
                              <p className="text-[9px] text-rose-500 font-bold truncate max-w-[140px]">{n.error_message}</p>
                           )}
                           {n.retry_count > 0 && (
                              <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest">Retried {n.retry_count}×</p>
                           )}
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50 text-center">
                    <p className="text-[10px] font-black text-slate-600">{format(new Date(n.created_at), "dd MMM yyyy")}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{format(new Date(n.created_at), "hh:mm a")}</p>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50 text-right pr-10">
                    <div className="flex justify-end gap-2">
                      {n.status === "failed" && (
                         <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onResend(n.id)}
                          className="h-8 rounded-lg text-blue-600 hover:bg-blue-50 text-[9px] font-black uppercase tracking-widest px-3 gap-1.5 transition-all active:scale-95"
                         >
                            <RotateCcw className="w-3.5 h-3.5" />
                            RESEND
                         </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-600"
                      >
                         <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {notifications.length === 0 && (
                <tr>
                   <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center space-y-6">
                         <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                            <Mail className="w-12 h-12 text-slate-200" />
                         </div>
                         <div className="space-y-1">
                            <h4 className="text-lg font-black text-slate-800">No communication logs</h4>
                            <p className="text-sm text-slate-500 leading-relaxed px-4 max-w-sm mx-auto">
                                No messages have been sent to this patient from the registry yet.
                            </p>
                         </div>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
