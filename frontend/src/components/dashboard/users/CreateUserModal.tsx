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
  Award,
  ShieldCheck as ShieldIcon
} from "lucide-react";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: any[];
  onSuccess: () => void;
}

export function CreateUserModal({
  isOpen,
  onClose,
  roles,
  onSuccess,
}: CreateUserModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "",
  });

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(p => ({ ...p, password: pass }));
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
        onSuccess();
        setFormData({ name: "", email: "", password: "", role_id: "" });
      } else {
         alert(res.message || "Failed to enrol staff identity.");
      }
    } catch (error: any) {
      alert(error.response?.data?.detail || "Credential registration conflict.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl border-slate-200 p-0 overflow-hidden bg-white shadow-2xl">
        <DialogHeader className="p-10 bg-slate-50/80 border-b border-slate-100 flex-shrink-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
             <UserPlus className="w-24 h-24 rotate-12" />
           </div>
           <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                <ShieldIcon className="w-6 h-6" />
              </div>
              Staff Induction
           </DialogTitle>
           <DialogDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 ml-1">
             Register New Personnel Identity in Workforce Registry
           </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
           <div className="space-y-6">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Full Name</Label>
                 <Input 
                   required
                   placeholder="e.g., Clinical Staff Member"
                   value={formData.name}
                   onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                   className="h-12 rounded-xl border-slate-200 bg-white focus:bg-white focus:shadow-md transition-all font-semibold text-slate-700"
                 />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Email</Label>
                    <div className="relative group">
                       <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                       <Input 
                        required
                        type="email"
                        placeholder="staff@medisync.local"
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        className="h-12 pl-11 rounded-xl border-slate-200 bg-white font-semibold text-slate-700"
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Role</Label>
                    <Select 
                      required
                      value={formData.role_id}
                      onValueChange={(val) => setFormData(p => ({ ...p, role_id: val }))}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-700 text-xs">
                        <SelectValue placeholder="Identify Role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 shadow-2xl p-2 bg-white">
                         {roles.map(role => (
                           <SelectItem key={role.id} value={role.id.toString()} className="font-bold text-xs uppercase tracking-tight py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                              {role.name}
                           </SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="space-y-2">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Authentication Credentials</Label>
                 <div className="flex gap-3">
                    <div className="relative flex-1 group">
                       <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                       <Input 
                        required
                        type="text"
                        placeholder="At least 8 characters..."
                        value={formData.password}
                        onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                        className="h-12 pl-11 rounded-xl border-slate-200 bg-white font-semibold text-slate-700"
                       />
                    </div>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                      className="h-12 px-5 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-white transition-all group"
                    >
                       <RefreshCw className="w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform duration-700 group-hover:text-amber-500" />
                    </Button>
                 </div>
                 <p className="text-[9px] text-slate-400 font-bold leading-relaxed ml-1 mt-1.5 uppercase tracking-tight">Generate a randomized institutional password for enhanced security policy enforcement.</p>
              </div>
           </div>
        </form>

        <DialogFooter className="p-10 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px] bg-white border border-slate-200 shadow-sm"
          >
            Abort Inclusion
          </Button>
          <Button 
            disabled={loading || !formData.role_id}
            onClick={handleSubmit}
            className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-blue-100 text-xs uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Verify & Enroll Staff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
