"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { User, ShieldCheck, Mail, Calendar, Clock, Activity, Key, Fingerprint } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface UserDetailsDialogProps {
  user: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailsDialog({ user, isOpen, onClose }: UserDetailsDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-[32px] border-slate-200 p-0 overflow-hidden bg-white shadow-2xl">
        <DialogHeader className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
           <div className="flex flex-col">
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 text-indigo-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              Identity Insight
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-1">
               Verified Credentials & Operational Status
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
           {/* Profile Section */}
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[28px] bg-indigo-50 flex items-center justify-center border-2 border-white shadow-xl shadow-indigo-100/50">
                 <User className="w-10 h-10 text-indigo-500" />
              </div>
              <div className="flex flex-col">
                 <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-2">{user.name}</h3>
                 <Badge className={`w-fit rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] border-none ${user.is_active ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                    {user.is_active ? "Operational" : "Suspended"}
                 </Badge>
              </div>
           </div>

           {/* Metadata Grid */}
           <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-300" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Email Identity</span>
                 </div>
                 <span className="text-[12px] font-bold text-slate-700">{user.email}</span>
              </div>

              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-slate-300" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Governance Role</span>
                 </div>
                 <Badge variant="outline" className="rounded-xl px-3 py-1 bg-white border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                    {user.role_name || "Staff"}
                 </Badge>
              </div>

              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-300" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Last Authentication</span>
                 </div>
                 <span className="text-[11px] font-bold text-slate-700">
                    {user.last_login_at ? format(new Date(user.last_login_at), "MMM d, yyyy · HH:mm") : "NEVER"}
                 </span>
              </div>

              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-300" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Registry Enroll</span>
                 </div>
                 <span className="text-[11px] font-bold text-slate-700">
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                 </span>
              </div>

              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Fingerprint className="w-4 h-4 text-slate-300" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Identity Hash</span>
                 </div>
                 <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    {user.id.slice(0, 16)}...
                 </span>
              </div>
           </div>

           <div className="pt-2">
              <div className="bg-indigo-600/5 rounded-2xl p-4 flex items-start gap-4">
                 <Activity className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                 <div>
                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.15em] mb-1">Governance Insight</h4>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                       This identity is fully synchronized across the RBAC governance matrix. All clinical operations performed by this staff member are recorded in the institutional audit trail.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
