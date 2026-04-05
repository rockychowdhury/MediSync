import React from "react";
import { Loader2, Columns4, Layout, MoreHorizontal } from "lucide-react";
import { WaitlistCard } from "../WaitlistCard";
import { AnimatePresence } from "framer-motion";

interface ServiceColumnsViewProps {
  entriesByService: Record<string, any[]>;
  services: any[];
  loading: boolean;
  onAssign?: (entry: any) => void;
  onViewDetails?: (entry: any) => void;
  onAction?: (action: string, entry: any) => void;
}

export function ServiceColumnsView({ 
  entriesByService, 
  services,
  loading,
  onAssign,
  onViewDetails,
  onAction
}: ServiceColumnsViewProps) {
  if (loading && Object.keys(entriesByService).length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="w-12 h-12 animate-spin text-blue-500 opacity-20" />
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Real-time Queues...</p>
        </div>
      </div>
    );
  }

  // Filter services that have waitlist entries
  const activeServices = services.filter(s => !!entriesByService[s.id]);

  if (activeServices.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100 m-4">
        <div className="w-24 h-24 rounded-full bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
           <Columns4 size={40} className="opacity-10" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-1">Queue is Clear</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic tracking-widest">No patients currently in the live registry.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar select-none">
      <div className="flex gap-8 h-full items-start min-w-max px-2">
        {activeServices.map(service => {
          const entries = entriesByService[service.id];
          const emergencyCount = entries.filter(e => e.priority === 'emergency').length;
          
          return (
            <div 
              key={service.id} 
              className="w-96 shrink-0 flex flex-col h-full bg-slate-100/30 rounded-[40px] border border-slate-100 overflow-hidden shadow-sm transition-all hover:bg-slate-100/50"
            >
              <div className="p-8 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-800">{service.name}</h3>
                    {emergencyCount > 0 && (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-lg shadow-red-500/50"></span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                    {entries.length} Active Patients
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    {service.duration_minutes}m avg
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-xl shadow-blue-500/30 border border-blue-400">
                   {service.name[0]}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
                <AnimatePresence initial={false}>
                  {entries.map((entry) => (
                    <WaitlistCard 
                      key={entry.id} 
                      entry={entry} 
                      onAssign={onAssign}
                      onViewDetails={onViewDetails}
                      onAction={onAction}
                    />
                  ))}
                </AnimatePresence>
                
                {/* Visual End of Column */}
                <div className="py-10 flex flex-col items-center justify-center opacity-30">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mb-1" />
                   <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-slate-300 to-transparent" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
