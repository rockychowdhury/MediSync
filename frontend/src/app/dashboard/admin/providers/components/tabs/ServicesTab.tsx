"use client";

import React, { useState } from "react";
import { 
  Briefcase, 
  Plus, 
  MapPin, 
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  MoreVertical,
  MinusCircle,
  Stethoscope,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProviderServices } from "../../hooks/useProviderServices";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ManageServicesPanel } from "../dialogs/ManageServicesPanel";
import { cn } from "@/lib/utils";

interface ServicesTabProps {
  provider: any;
}

export function ServicesTab({ provider }: ServicesTabProps) {
  const { assignedServices, loading, assignService, removeService, refresh } = useProviderServices(provider?.id);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  if (!provider) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Tab Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/20">
        <div>
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-0.5">Clinical Domain</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Authorization of specialized medical procedures</p>
        </div>
        <Button onClick={() => setIsPanelOpen(true)} className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md shadow-indigo-100 transition-all active:scale-95 cursor-pointer">
          <Plus className="w-3 h-3 mr-1.5" />
          Assign Protocol
        </Button>
      </div>

      <ScrollArea className="flex-1 bg-white">
        <div className="p-5 space-y-6 max-w-4xl">
           {/* Active Services List */}
           <div className="grid grid-cols-1 gap-1.5">
             {assignedServices.length > 0 ? (
               assignedServices.map((service: any) => {
                 const isMismatch = service.specialization_id !== provider.specialization_id;
                 
                 return (
                   <div key={service.id} className="group bg-white hover:bg-slate-50/50 rounded-xl border border-slate-100 p-2.5 transition-all hover:shadow-sm flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          isMismatch ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                        )}>
                           {isMismatch ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[11px] font-black text-slate-800 tracking-tight uppercase leading-none">{service.name}</p>
                            {isMismatch && (
                              <Badge className="h-3.5 bg-amber-50 text-amber-600 border-amber-100 text-[7px] font-black uppercase tracking-widest px-1">Specialty Gap</Badge>
                            )}
                          </div>
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                             <span>{service.category}</span>
                             <div className="w-1 h-1 rounded-full bg-slate-200" />
                             <span>${service.base_price?.toFixed(2) || "0.00"} Billing Base</span>
                          </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeService(service.id)}
                          className="h-7 px-2.5 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-black text-[8px] uppercase tracking-widest transition-all cursor-pointer"
                        >
                          <MinusCircle className="w-3 h-3 mr-1" />
                          Revoke
                        </Button>
                     </div>
                   </div>
                 );
               })
             ) : (
               <div className="py-12 text-center bg-slate-50/30 border border-dashed border-slate-200 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3 border border-slate-200">
                    <Stethoscope className="w-5 h-5 text-slate-300" />
                  </div>
                  <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Authorization Null</h4>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] px-8">Assign protocol templates to enable clinical scheduling sequences.</p>
               </div>
             )}
           </div>
           
           {/* Info Section */}
           <div className="pt-6 border-t border-slate-100">
              <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100 flex items-start gap-3">
                 <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Protocol Oversight</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                       Authorization of medical protocols is managed via administrative entitlement sequences. Discrepancies between specialized domains and assigned services are flagged for clinical audit.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </ScrollArea>

      <ManageServicesPanel 
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSuccess={refresh}
        provider={provider}
        assignedServiceIds={assignedServices.map((s: any) => s.id)}
        assignService={assignService}
        removeService={removeService}
      />
    </div>
  );
}
