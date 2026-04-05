import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  ShieldCheck,
  Loader2,
  ChevronRight,
  Search,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { waitlistApi } from "@/lib/api/waitlist";
import { providersApi } from "@/lib/api/providers";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface ManualAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: any;
  onSuccess: () => void;
}

export function ManualAssignModal({ open, onOpenChange, entry, onSuccess }: ManualAssignModalProps) {
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  useEffect(() => {
    if (open && entry) {
       fetchProviders();
    }
  }, [open, entry]);

  const fetchProviders = async (search = "") => {
    setSearching(true);
    try {
      // Filter by service if the entry has a service_id
      const res = await providersApi.getProviders({ 
        search, 
        service_id: entry?.service_id,
        is_active: true 
      });
      if (res.success) setProviders(res.data || []);
    } catch (err) {
      toast.error("Failed to load providers");
    } finally {
      setSearching(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedProviderId) {
      toast.error("Please select a provider for assignment");
      return;
    }

    setLoading(true);
    try {
      const res = await waitlistApi.manualAssign(entry.id, { 
        provider_id: selectedProviderId,
        appointment_start: new Date().toISOString()
      });
      if (res.success) {
        toast.success(`Successfully assigned to ${providers.find(p => p.id === selectedProviderId)?.name}`);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.message || "Assignment failed");
      }
    } catch (err) {
      toast.error("Internal system error during assignment");
    } finally {
      setLoading(false);
    }
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
        <div className="bg-emerald-600 p-8 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <UserCheck size={120} strokeWidth={3} />
           </div>
           
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <ShieldCheck className="w-5 h-5 text-white" />
                 </div>
                 <div className="px-3 py-1 rounded-full bg-black/10 text-[9px] font-black uppercase tracking-widest border border-white/10">
                    Clinical Assignment
                 </div>
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">Manual Dispatch</DialogTitle>
              <DialogDescription className="text-emerald-100 text-[11px] font-bold uppercase tracking-widest mt-1">
                 Bypass auto-promotion for <span className="text-white underline decoration-2">{entry.patient?.name}</span>
              </DialogDescription>
           </div>
        </div>

        <div className="p-8 bg-white space-y-6">
           <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Available Unit Providers</Label>
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                 <Input 
                   placeholder="Filter by provider name..." 
                   className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-100 text-sm font-bold"
                   value={searchQuery}
                   onChange={(e) => {
                     setSearchQuery(e.target.value);
                     fetchProviders(e.target.value);
                   }}
                 />
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto hidden-scrollbar pr-1">
                 {providers.map(p => (
                   <button 
                     key={p.id}
                     onClick={() => setSelectedProviderId(p.id)}
                     className={cn(
                       "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                       selectedProviderId === p.id 
                        ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/10 shadow-sm" 
                        : "bg-white border-slate-100 hover:border-emerald-100 hover:bg-slate-50"
                     )}
                   >
                      <div className="flex items-center gap-3">
                         <div className={cn(
                           "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-colors",
                           selectedProviderId === p.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                         )}>
                            {p.name[0]}
                         </div>
                         <div>
                            <p className="text-[13px] font-black text-slate-800 leading-tight">{p.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Active Unit • {p.specialization || "General"}</p>
                         </div>
                      </div>
                      {selectedProviderId === p.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in-50" />
                      )}
                   </button>
                 ))}
                 {providers.length === 0 && !searching && (
                   <div className="py-8 text-center opacity-40 italic text-sm">No compatible providers found.</div>
                 )}
              </div>
           </div>

           <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-3 mb-2">
                 <ShieldCheck className="w-4 h-4 text-amber-600" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Assignment Impact</span>
              </div>
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                 Manual assignment will override the current queue order and notify the patient via SMS/Email. This action is audited.
              </p>
           </div>

           <div className="flex gap-4 pt-4">
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="h-12 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest px-8 hover:bg-slate-50"
                disabled={loading}
              >
                 Cancel
              </Button>
              <Button 
                onClick={handleAssign}
                className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 gap-2"
                disabled={loading || !selectedProviderId}
              >
                 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Dispatch"}
                 <ChevronRight className="w-4 h-4" />
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
