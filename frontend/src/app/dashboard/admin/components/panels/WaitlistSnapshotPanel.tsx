"use client";

import React from "react";
import { Users, Clock, Zap, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface WaitlistEntry {
  id: string;
  patient_name: string;
  priority: 'emergency' | 'urgent' | 'standard';
  waiting_since: string;
  service_requested: string;
}

interface WaitlistSnapshotPanelProps {
  data: {
    total_waiting: number;
    emergency_waiting: number;
    urgent_waiting: number;
    standard_waiting: number;
    avg_wait_minutes: number;
    recent_entries?: WaitlistEntry[];
  };
}

export function WaitlistSnapshotPanel({ data }: WaitlistSnapshotPanelProps) {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'emergency': return <Zap className="text-rose-500" size={14} />;
      case 'urgent': return <AlertCircle className="text-amber-500" size={14} />;
      default: return <Clock className="text-blue-500" size={14} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return "bg-rose-50 text-rose-800 border-rose-100";
      case 'urgent': return "bg-amber-50 text-amber-800 border-amber-100";
      default: return "bg-blue-50 text-blue-800 border-blue-100";
    }
  };

  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col h-full min-h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Waitlist Snapshot</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Urgent queue management</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
          <Clock size={12} className="text-slate-400" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Avg: {data.avg_wait_minutes}m</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6 shrink-0">
        {[
          { label: 'Emergency', count: data.emergency_waiting, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Urgent', count: data.urgent_waiting, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Standard', count: data.standard_waiting, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((p) => (
          <div key={p.label} className={cn("p-3 rounded-2xl border border-transparent text-center", p.bg)}>
            <div className={cn("text-xl font-black mb-0.5", p.color)}>{p.count}</div>
            <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 opacity-60 leading-tight">{p.label}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto hidden-scrollbar space-y-3 mb-6">
        {data.recent_entries?.map((entry) => (
          <div key={entry.id} className="p-4 rounded-2xl border border-slate-50 bg-[#fbfbfc] hover:shadow-sm transition-all group">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center border", getPriorityColor(entry.priority))}>
                  {getPriorityIcon(entry.priority)}
                </div>
                <div>
                  <h4 className="text-[12px] font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                    {entry.patient_name}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    {entry.service_requested}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Waiting {entry.waiting_since}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 rounded-lg border border-blue-100"
              >
                Assign Slot →
              </Button>
            </div>
          </div>
        ))}

        {!data.recent_entries?.length && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Users className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Waitlist is empty</p>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-50">
        <a 
          href="/dashboard/admin/waitlist" 
          className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
        >
          View Full Waitlist <ChevronRight size={14} />
        </a>
      </div>
    </div>
  );
}
