"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  Clock, 
  Activity, 
  Key, 
  Fingerprint,
  Copy,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { usersApi } from "@/lib/api";
import { toast } from "sonner";

interface UserDetailsDialogProps {
  user: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailsDialog({ user: initialUser, isOpen, onClose }: UserDetailsDialogProps) {
  const [user, setUser] = useState<any>(initialUser);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && initialUser?.id) {
      fetchUserDetails();
    }
  }, [isOpen, initialUser?.id]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getUserById(initialUser.id);
      if (res.success) {
        setUser(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch user details", error);
    } finally {
      setLoading(false);
    }
  };

  const copyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    toast.success("Identity UUID Copied", {
      description: "Unique identifier has been copied to your secure clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user && !loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] rounded-[32px] border-slate-200 p-0 overflow-hidden bg-white shadow-2xl transition-all duration-500">
        <DialogHeader className="p-6 bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-500 shrink-0">
               {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div className="flex flex-col min-w-0">
               <DialogTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 truncate">
                 {user?.name || "Staff Identity"}
                 <Badge variant="outline" className="rounded-lg px-2 py-0 bg-indigo-50/50 border-indigo-100 text-indigo-600 text-[8px] font-black uppercase tracking-widest leading-normal">
                   {user?.role_name || "Staff"}
                 </Badge>
               </DialogTitle>
               <div className="flex items-center gap-2 mt-1">
                 <button 
                  onClick={copyId}
                  className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 transition-colors rounded-md group"
                 >
                   <p className="text-[9px] font-mono font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-tight">
                     {user?.id || "N/A"}
                   </p>
                   {copied ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 text-slate-300 group-hover:text-slate-500" />}
                 </button>
               </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
           {/* Technical Parameters */}
           <div className="grid grid-cols-1 gap-2.5">
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-3.5 flex items-center justify-between">
                 <div className="flex items-center gap-2.5">
                    <Mail className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Endpoint</span>
                 </div>
                 <span className="text-[11px] font-bold text-slate-700">{user?.email}</span>
              </div>

              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-3.5 flex items-center justify-between">
                 <div className="flex items-center gap-2.5">
                    <Activity className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Status</span>
                 </div>
                 <Badge className={`rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border-none ${user?.is_active ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                    {user?.is_active ? "Verified Operational" : "Suspended"}
                 </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-3.5 flex flex-col gap-2">
                   <div className="flex items-center gap-2.5">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Auth</span>
                   </div>
                   <span className="text-[10px] font-black text-slate-700 uppercase">
                      {user?.last_login_at ? format(new Date(user.last_login_at), "MMM d, HH:mm") : "NEVER"}
                   </span>
                </div>
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-3.5 flex flex-col gap-2">
                   <div className="flex items-center gap-2.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enrollment</span>
                   </div>
                   <span className="text-[10px] font-black text-slate-700 uppercase">
                      {user?.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "N/A"}
                   </span>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-3.5 flex items-center justify-between">
                 <div className="flex items-center gap-2.5">
                    <Fingerprint className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity Salt</span>
                 </div>
                 <span className="text-[10px] font-mono font-bold text-slate-300 truncate max-w-[150px]">
                    PROTECTED_HASH_#{user?.id?.split("-")[0]}
                 </span>
              </div>
           </div>

           <div className="bg-indigo-600/5 rounded-2xl p-4 flex items-start gap-3">
              <Key className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                 All operational logs for this identity are signed and synchronized across the governance matrix.
              </p>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
