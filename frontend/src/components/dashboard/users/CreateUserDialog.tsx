"use client";

import React, { useState } from "react";
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
import { usersApi } from "@/lib/api";
import { 
  Loader2, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Lock,
  RefreshCw,
  Plus
} from "lucide-react";
import { toast } from "sonner";

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roles: any[];
  onSuccess: () => void;
}

export function CreateUserDialog({
  isOpen,
  onClose,
  roles,
  onSuccess,
}: CreateUserDialogProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "",
  });

  const generatePassword = () => {
    const words = ["Swift", "Elite", "Prime", "Core", "Global", "Direct", "Nova", "Pulse", "Zenith", "Apex"];
    const clinicalTerms = ["Clinic", "Med", "Care", "Health", "Sync", "Hub", "Node", "Safe", "Trust", "Life"];
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = clinicalTerms[Math.floor(Math.random() * clinicalTerms.length)];
    const num = Math.floor(100 + Math.random() * 899);
    const pass = `${word1}-${word2}-${num}`;
    setFormData(p => ({ ...p, password: pass }));
  };

  const handleClose = () => {
    setFormData({ name: "", email: "", password: "", role_id: "" });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role_id) return;
    setLoading(true);
    try {
      const res = await usersApi.createUser({
        ...formData,
        role_id: parseInt(formData.role_id)
      });
      if (res.success) {
        toast.success("Account Enrolled", {
          description: `User ${formData.name} identity has been successfully registered in the workforce registry.`,
        });
        onSuccess();
        handleClose();
      } else {
        toast.error(res.message || "Protocol Failure: Failed to enrol staff identity.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Credential registration conflict detected in database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-[32px] border-slate-200 p-0 overflow-hidden bg-white shadow-2xl transition-all duration-500">
        <DialogHeader className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
           <div className="flex flex-col">
            <DialogTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-500">
                <UserPlus className="w-5 h-5" />
              </div>
              Staff Induction
            </DialogTitle>
            <DialogDescription className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 ml-1">
              Registering new personnel identity
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Full Name</Label>
              <div className="relative group">
                <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <Input 
                  required
                  placeholder="e.g., Clinical Member Name"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="h-12 pl-11 rounded-2xl border-slate-200 bg-white font-bold text-slate-700 text-xs focus:bg-white focus:shadow-xl transition-all"
                />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Email</Label>
                 <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <Input 
                     required
                     type="email"
                     placeholder="staff@medisync.local"
                     value={formData.email}
                     onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                     className="h-12 pl-11 rounded-2xl border-slate-200 bg-white font-bold text-slate-700 text-xs focus:bg-white focus:shadow-xl transition-all"
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Governance Role</Label>
                 <Select 
                   required
                   value={formData.role_id}
                   onValueChange={(val) => setFormData(p => ({ ...p, role_id: val }))}
                 >
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-black text-slate-700 text-[10px] uppercase tracking-widest shadow-none hover:bg-slate-50 transition-colors">
                      <SelectValue placeholder="Identify Role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-2xl p-2 bg-white">
                       {roles.map(role => (
                        <SelectItem key={role.id} value={role.id.toString()} className="font-black text-[10px] uppercase tracking-widest py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                           {role.name}
                        </SelectItem>
                      ))}
                   </SelectContent>
                 </Select>
              </div>
           </div>

           <div className="space-y-2">
              <div className="flex items-center justify-between ml-1 max-w-[500px]">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authentication Credentials</Label>
                <Button 
                  type="button"
                  onClick={generatePassword}
                  variant="ghost"
                  className="h-6 px-2 text-[8px] font-black text-indigo-500 uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2 group"
                >
                   <RefreshCw className="w-2.5 h-2.5 group-hover:rotate-180 transition-transform duration-700" />
                   Auto-Generate Protocol
                </Button>
              </div>
              <div className="relative group">
                 <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                 <Input 
                  required
                  type="text"
                  placeholder="At least 8 clinical format characters..."
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  className="h-12 pl-11 rounded-2xl border-slate-200 bg-white font-bold text-slate-700 text-xs focus:bg-white focus:shadow-xl transition-all"
                 />
              </div>
              <p className="text-[9px] text-slate-400 font-bold leading-relaxed ml-1 mt-2 uppercase tracking-tight opacity-60">Generate a randomized institutional password for enhanced security policy enforcement.</p>
           </div>
        </form>

        <DialogFooter className="px-8 pb-6 flex items-center justify-between gap-3">
          <Button 
            variant="ghost" 
            onClick={handleClose} 
            className="flex-1 h-11 rounded-xl font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px] bg-slate-50/50 border border-slate-100"
          >
            Abort
          </Button>
          <Button 
            disabled={loading || !formData.role_id}
            onClick={handleSubmit}
            className="flex-[2] h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all active:scale-95 shadow-lg shadow-indigo-100 text-[10px] uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Enroll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
