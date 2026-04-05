import React, { useState, useEffect } from "react";
import { 
  MoreVertical, 
  User, 
  Clock, 
  ChevronRight,
  ShieldAlert,
  Zap,
  MoreHorizontal
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface WaitlistCardProps {
  entry: any;
  onAssign?: (entry: any) => void;
  onViewDetails?: (entry: any) => void;
  onAction?: (action: string, entry: any) => void;
}

export function WaitlistCard({ entry, onAssign, onViewDetails, onAction }: WaitlistCardProps) {
  const [timeWaiting, setTimeWaiting] = useState("");

  useEffect(() => {
    const updateTime = () => {
      if (entry.created_at) {
        setTimeWaiting(formatDistanceToNow(new Date(entry.created_at)));
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [entry.created_at]);

  const isEmergency = entry.priority === 'emergency';
  const isUrgent = entry.priority === 'urgent';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "group relative bg-white p-5 rounded-3xl border transition-all duration-300 hover:shadow-2xl active:scale-[0.98]",
        isEmergency ? "border-red-200 shadow-red-500/5 ring-1 ring-red-100" : "border-slate-100 shadow-sm",
        isUrgent && "border-amber-200"
      )}
    >
      {/* Priority Indicator */}
      <div className={cn(
        "absolute top-0 left-6 -mt-3 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
        isEmergency ? "bg-red-600 text-white border-red-500" : 
        isUrgent ? "bg-amber-500 text-white border-amber-400" : 
        "bg-white text-slate-400 border-slate-100"
      )}>
        {isEmergency ? "⚡ Emergency" : isUrgent ? "🔶 Urgent" : "Standard"}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
             <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-xs uppercase group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:border-blue-100 transition-all">
                {entry.patient?.name?.[0] || "P"}
             </div>
             <div>
                <h4 className="text-[14px] font-black text-slate-800 leading-none group-hover:text-blue-600 transition-colors">
                  {entry.patient?.name || "Unknown Patient"}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                   <Clock className="w-3 h-3 text-slate-300" />
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{timeWaiting} waiting</span>
                </div>
             </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 p-0 rounded-xl hover:bg-slate-50")}>
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-2xl p-2">
              <DropdownMenuItem 
                onClick={() => onAction?.('edit', entry)}
                className="rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-600"
              >
                Edit Entry
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onAction?.('escalate', entry)}
                className="rounded-xl text-[11px] font-black uppercase tracking-widest text-amber-600"
              >
                Escalate Priority
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onAction?.('cancel', entry)}
                className="rounded-xl text-[11px] font-black uppercase tracking-widest text-red-600"
              >
                Cancel Entry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preference</span>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                {entry.provider_name || entry.provider?.name || "Any Available"}
              </span>
           </div>
           {entry.notes && (
             <div className="text-[11px] text-slate-500 font-medium italic border-t border-slate-100 pt-2 mt-1 line-clamp-1">
               "{entry.notes}"
             </div>
           )}
        </div>

        <div className="flex gap-2">
           <Button 
             onClick={() => onAssign?.(entry)}
             className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 gap-2"
           >
              Assign Now <ChevronRight className="w-3 h-3" />
           </Button>
           <Button 
             variant="ghost"
             onClick={() => onViewDetails?.(entry)}
             className="h-10 px-4 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50"
           >
              Details
           </Button>
        </div>
      </div>
    </motion.div>
  );
}
