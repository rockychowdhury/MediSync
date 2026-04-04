"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Search, 
  Plus, 
  Minus, 
  MapPin, 
  Briefcase, 
  ShieldAlert, 
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { servicesApi } from "@/lib/api/services";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface ManageServicesPanelProps {
  provider: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignedServiceIds: string[];
  assignService: (id: string) => Promise<void>;
  removeService: (id: string) => Promise<void>;
}

export function ManageServicesPanel({ 
  provider, 
  isOpen, 
  onClose, 
  onSuccess, 
  assignedServiceIds,
  assignService,
  removeService
}: ManageServicesPanelProps) {
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const [servsRes, catsRes] = await Promise.all([
        servicesApi.getServices(),
        servicesApi.getCategories()
      ]);
      if (servsRes.success) setAllServices(servsRes.data || []);
      if (catsRes.success) setCategories(catsRes.data || []);
    } catch (error) {
      toast.error("Failed to load clinical service catalog");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = allServices.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const toggleService = async (serviceId: string, isAssigned: boolean) => {
    try {
      if (isAssigned) {
        await removeService(serviceId);
      } else {
        await assignService(serviceId);
      }
    } catch (error) {
       // Error handled by hook
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[500px] sm:max-w-[500px] p-0 flex flex-col border-none shadow-2xl">
        <SheetHeader className="p-8 bg-slate-900 text-white shrink-0 rounded-bl-[40px]">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-400" />
             </div>
             <SheetTitle className="text-2xl font-black text-white tracking-tight">Clinical Entitlements</SheetTitle>
          </div>
          <SheetDescription className="text-slate-400 text-sm font-medium">
             Assign authorized clinical services for <span className="text-blue-400 font-bold">Dr. {provider?.user?.name?.split(' ')[1]}</span>.
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 border-b border-slate-100 space-y-4 bg-white sticky top-0 z-10">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input 
                placeholder="Search services or categories..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white text-sm font-semibold transition-all"
              />
           </div>
           
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <Button 
                variant={categoryFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCategoryFilter("all")}
                className={`h-8 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider ${categoryFilter === "all" ? 'bg-blue-600' : 'text-slate-400'}`}
              >
                All
              </Button>
              {categories.map(cat => (
                <Button 
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                  className={`h-8 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider whitespace-nowrap ${categoryFilter === cat ? 'bg-blue-600' : 'text-slate-400'}`}
                >
                  {cat}
                </Button>
              ))}
           </div>
        </div>

        <ScrollArea className="flex-1 bg-slate-50/30">
          <div className="p-6 space-y-3">
             {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                   <Loader2 className="w-8 h-8 animate-spin text-blue-500 opacity-50" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hydrating Catalog...</p>
                </div>
             ) : filteredServices.length > 0 ? (
                filteredServices.map(service => {
                   const isAssigned = assignedServiceIds.includes(service.id);
                   const isMismatch = service.specialization_id !== provider?.specialization_id;
                   
                   return (
                     <div key={service.id} className={`p-4 rounded-3xl border transition-all flex items-center justify-between group ${
                        isAssigned 
                          ? "bg-white border-blue-100 shadow-lg shadow-blue-500/5 ring-1 ring-blue-50" 
                          : "bg-white/50 border-slate-100 hover:border-slate-200"
                     }`}>
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                             isAssigned ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                           }`}>
                              {isAssigned ? <CheckCircle2 className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                           </div>
                           
                           <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                 <p className="text-sm font-black text-slate-800 tracking-tight">{service.name}</p>
                                 {isAssigned && isMismatch && (
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                                 )}
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                 {service.category} • ${service.base_price?.toFixed(2)}
                              </p>
                           </div>
                        </div>

                        <Button
                          variant={isAssigned ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleService(service.id, isAssigned)}
                          className={`h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 ${
                            isAssigned 
                              ? "bg-white text-rose-500 border-rose-100 hover:bg-rose-50 hover:text-rose-600 shadow-none" 
                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100"
                          }`}
                        >
                           {isAssigned ? (
                             <>
                               <Minus className="w-3 h-3 mr-2" />
                               Revoke
                             </>
                           ) : (
                             <>
                               <Plus className="w-3 h-3 mr-2" />
                               Assign
                             </>
                           )}
                        </Button>
                     </div>
                   );
                })
             ) : (
                <div className="py-20 text-center opacity-50">
                   <p className="text-sm font-bold text-slate-400 font-mono">NO SERVICE RECORDS FOUND</p>
                </div>
             )}
          </div>
        </ScrollArea>

        <SheetFooter className="p-8 bg-white border-t border-slate-100">
           <Button 
            onClick={onClose}
            className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all hover:scale-[1.01]"
           >
             Finish Mapping
           </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
