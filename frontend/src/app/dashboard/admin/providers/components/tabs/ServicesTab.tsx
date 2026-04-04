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
      <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Clinical Entitlements</h3>
          <p className="text-sm text-slate-500">Manage the clinical services this provider is authorized to perform.</p>
        </div>
        <Button onClick={() => setIsPanelOpen(true)} className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[12px] uppercase tracking-wider shadow-lg shadow-blue-100 transition-all active:scale-95">
          <Plus className="w-4 h-4 mr-2" />
          Assign Services
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-8 space-y-8 max-w-4xl">
           {/* Active Services List */}
           <div className="grid grid-cols-1 gap-3">
             {assignedServices.length > 0 ? (
               assignedServices.map((service: any) => {
                 const isMismatch = service.specialization_id !== provider.specialization_id;
                 
                 return (
                   <div key={service.id} className="group bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-100 p-4 transition-all hover:shadow-md flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMismatch ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                           {isMismatch ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-black text-slate-800 tracking-tight">{service.name}</p>
                            {isMismatch && (
                              <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[9px] uppercase font-bold tracking-widest h-4">Spec. Mismatch</Badge>
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             {service.category}
                             <Separator orientation="vertical" className="h-2.5" />
                             ${service.base_price?.toFixed(2) || "0.00"} Base Price
                          </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeService(service.id)}
                          className="h-9 px-4 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold text-[10px] uppercase tracking-wider"
                        >
                          <MinusCircle className="w-3.5 h-3.5 mr-2" />
                          Revoke
                        </Button>
                     </div>
                   </div>
                 );
               })
             ) : (
               <div className="p-16 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                    <Stethoscope className="w-6 h-6 text-slate-300" />
                  </div>
                  <h4 className="text-sm font-black text-slate-700 mb-1">No Services Assigned</h4>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Assign clinical services to begin scheduling appointments.</p>
               </div>
             )}
          </div>
          
          {/* Legend/Info Section */}
          <div className="pt-8 border-t border-slate-100">
             <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="space-y-1">
                   <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Administrative Tip</p>
                   <p className="text-sm text-slate-600 leading-relaxed">
                      Clinical entitlements allow you to control which specific procedures and consultations a provider can perform. Specialization mismatches indicate services that typically fall outside the provider's primary practice area.
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
