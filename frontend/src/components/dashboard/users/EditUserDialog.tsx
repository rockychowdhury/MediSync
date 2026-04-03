"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersApi } from "@/lib/api/users";
import { Loader2, UserCog, Mail, User as UserIcon, ShieldCheck, Activity } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any | null;
  roles: { id: number; name: string }[];
  onUpdate: () => void;
}

export function EditUserDialog({
  isOpen,
  onClose,
  user,
  roles,
  onUpdate,
}: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role_id: "",
  });

  // Sync form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role_id: user.role_id?.toString() || "",
      });
    }
  }, [user]);

  const hasChanges = user && (
    formData.name !== user.name ||
    formData.email !== user.email ||
    formData.role_id !== user.role_id?.toString()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hasChanges) return;
    setLoading(true);
    try {
      const payload: any = {};
      if (formData.name !== user.name) payload.name = formData.name;
      if (formData.email !== user.email) payload.email = formData.email;
      if (formData.role_id !== user.role_id?.toString()) payload.role_id = parseInt(formData.role_id);

      const res = await usersApi.updateUser(user.id, payload);
      if (res.success) {
        toast.success("Identity Updated", {
          description: "Staff profile has been successfully synchronized with the registry.",
        });
        onUpdate();
        onClose();
      } else {
        toast.error(res.message || "Protocol Error: Failed to update registry.");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Update conflict detected in the workforce registry."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] rounded-[32px] border-slate-200 p-0 overflow-hidden bg-white shadow-2xl">
        <DialogHeader className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
           <div className="flex flex-col">
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 text-indigo-500">
                <UserCog className="w-5 h-5" />
              </div>
              Modify Identity
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-1">
               Refining operational record for <span className="text-slate-600 underline decoration-indigo-200 underline-offset-4">{user.name}</span>
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity Name</Label>
            <div className="relative group">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Professional Full Name"
                className="h-12 pl-11 rounded-2xl border-slate-200 bg-white font-bold text-slate-700 text-xs focus:bg-white focus:shadow-xl transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Email</Label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="staff@medisync.local"
                className="h-12 pl-11 rounded-2xl border-slate-200 bg-white font-bold text-slate-700 text-xs focus:bg-white focus:shadow-xl transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Governance Role</Label>
            <Select
              value={formData.role_id}
              onValueChange={(val) => setFormData((p) => ({ ...p, role_id: val }))}
            >
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-black text-slate-700 text-[10px] uppercase tracking-widest shadow-none">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-300" />
                  <SelectValue placeholder="Assign Security Role" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 shadow-2xl p-2 bg-white">
                {roles.map((role) => (
                  <SelectItem
                    key={role.id}
                    value={role.id.toString()}
                    className="font-black text-[10px] uppercase tracking-widest py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasChanges && (
            <div className="flex items-center gap-3 bg-amber-50/50 border border-amber-100 rounded-2xl px-4 py-3 animate-in slide-in-from-top-2">
               <Activity className="w-4 h-4 text-amber-500" />
               <p className="text-[10px] text-amber-700 font-extrabold uppercase tracking-widest"> Registry desynchronized — Commit changes now </p>
            </div>
          )}
        </form>

        <DialogFooter className="px-8 pb-8 flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px] bg-slate-50/50 border border-slate-100"
          >
            Abort Update
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !hasChanges}
            className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-indigo-100 text-[10px] uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Commit Registry Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
