"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { providersApi, usersApi } from "@/lib/api";
import { 
  Loader2, 
  UserPlus, 
  Search, 
  BadgeCheck,
  Stethoscope,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PromoteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  specializations: any[];
  onSuccess: () => void;
}

export function PromoteUserModal({
  isOpen,
  onClose,
  specializations,
  onSuccess,
}: PromoteUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    specialization_id: "",
    consultation_fee: "100",
    max_daily_appointments: "10",
  });

  const searchUsers = useCallback(async () => {
    if (searchTerm.length < 2) return;
    setSearching(true);
    try {
      const res = await usersApi.getUsers({ search: searchTerm });
      if (res.success) {
        // Filter out users who are already providers if possible, 
        // or just show all and let the backend handle duplication error.
        setUsers(res.data || []);
      }
    } catch (error) {
      console.error("Failed to search users", error);
    } finally {
      setSearching(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(searchUsers, 500);
    return () => clearTimeout(timer);
  }, [searchUsers]);

  const handlePromote = async () => {
    if (!selectedUser || !formData.specialization_id) return;
    setLoading(true);
    try {
      const res = await providersApi.promoteToProvider({
        id: selectedUser.id,
        specialization_id: parseInt(formData.specialization_id),
        consultation_fee: parseFloat(formData.consultation_fee),
        max_daily_appointments: parseInt(formData.max_daily_appointments),
        status: "available"
      });
      if (res.success) {
        onSuccess();
        onClose();
        setSelectedUser(null);
        setSearchTerm("");
      }
    } catch (error: any) {
      alert(error.response?.data?.detail || "Credential promotion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl border-slate-200 p-0 overflow-hidden bg-white shadow-2xl">
        <DialogHeader className="p-8 bg-slate-50/80 border-b border-slate-100 flex-shrink-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <UserPlus className="w-24 h-24 rotate-12" />
           </div>
           <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                <BadgeCheck className="w-5 h-5" />
              </div>
              Workforce Credentialing
           </DialogTitle>
           <DialogDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 ml-1">
             Promote Existing User to Clinical Staff
           </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
           {/* Step 1: Search */}
           {!selectedUser ? (
             <div className="space-y-4 animate-in fade-in duration-300">
                <div className="relative group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                   <Input 
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 pl-10 rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white focus:shadow-md transition-all font-semibold"
                   />
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                   {searching ? (
                     <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                     </div>
                   ) : (
                     users.map((u) => (
                       <button 
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-blue-200 transition-all group"
                       >
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs uppercase">
                               {u.full_name?.[0] || u.name?.[0] || "U"}
                             </div>
                             <div className="text-left">
                                <div className="text-xs font-black text-slate-800 tracking-tight">{u.full_name || u.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold tracking-tight">{u.email}</div>
                             </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-500 transition-colors" />
                       </button>
                     ))
                   )}
                   {searchTerm.length >= 2 && users.length === 0 && !searching && (
                     <div className="py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Not Found in Registry</div>
                   )}
                </div>
             </div>
           ) : (
             /* Step 2: Form */
             <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100 group transition-all">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-sm font-black text-xs uppercase border border-blue-50">
                        {selectedUser.full_name?.[0] || selectedUser.name?.[0] || "U"}
                      </div>
                      <div>
                         <div className="text-[11px] font-black text-slate-900 leading-tight uppercase tracking-tight">{selectedUser.full_name || selectedUser.name}</div>
                         <div className="text-[10px] text-blue-500 font-bold leading-tight">{selectedUser.email}</div>
                      </div>
                   </div>
                   <button 
                    onClick={() => setSelectedUser(null)}
                    className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-[0.15em] transition-colors"
                   >
                     Reset Select
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Clinical Title</Label>
                      <Select 
                        value={formData.specialization_id}
                        onValueChange={(val) => setFormData(p => ({ ...p, specialization_id: val }))}
                      >
                        <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-white focus:ring-blue-500 font-bold text-slate-700">
                          <SelectValue placeholder="Identify Role" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                           {specializations.map(spec => (
                             <SelectItem key={spec.id} value={spec.id.toString()} className="font-bold text-xs uppercase tracking-tight">{spec.name}</SelectItem>
                           ))}
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Consultation Yield</Label>
                      <Input 
                        type="number"
                        value={formData.consultation_yield}
                        onChange={(e) => setFormData(p => ({ ...p, consultation_yield: e.target.value }))}
                        className="h-11 rounded-2xl border-slate-200 bg-white font-bold text-slate-700"
                      />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Maximum Daily Throughput</Label>
                   <Input 
                     type="number"
                     value={formData.max_daily_appointments}
                     onChange={(e) => setFormData(p => ({ ...p, max_daily_appointments: e.target.value }))}
                     className="h-11 rounded-2xl border-slate-200 bg-white font-bold text-slate-700"
                   />
                </div>
             </div>
           )}
        </div>

        <DialogFooter className="p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px] transition-all bg-white border border-slate-200 shadow-sm"
          >
            Abort Protocol
          </Button>
          <Button 
            disabled={loading || !selectedUser || !formData.specialization_id}
            onClick={handlePromote}
            className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-blue-100 text-xs uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Verify & Promote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
