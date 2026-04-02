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
import { Loader2, UserCog, Mail, User as UserIcon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role_id: number;
    role_name?: string;
    is_active: boolean;
  } | null;
  roles: { id: number; name: string }[];
  onSuccess: () => void;
}

export function EditUserModal({
  isOpen,
  onClose,
  user,
  roles,
  onSuccess,
}: EditUserModalProps) {
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
        toast.success("Identity updated", {
          description: `${formData.name}'s profile has been committed to the registry.`,
        });
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || "Failed to update user");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Update conflict — please verify the changes."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl border-slate-200 p-0 overflow-hidden bg-white shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-10 bg-slate-50/80 border-b border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.04] pointer-events-none">
            <UserCog className="w-24 h-24 -rotate-12" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
              <UserCog className="w-6 h-6" />
            </div>
            Modify Identity
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 ml-1">
            Update personnel record for&nbsp;
            <span className="text-slate-600">{user.name}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-10 space-y-7">
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Full Name
            </Label>
            <div className="relative group">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full professional name"
                className="h-12 pl-11 rounded-xl border-slate-200 bg-white font-semibold text-slate-700 focus:shadow-md transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Institutional Email
            </Label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="staff@medisync.local"
                className="h-12 pl-11 rounded-xl border-slate-200 bg-white font-semibold text-slate-700 focus:shadow-md transition-all"
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Security Role
            </Label>
            <Select
              value={formData.role_id}
              onValueChange={(val) => setFormData((p) => ({ ...p, role_id: val }))}
            >
              <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-700 text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-300" />
                  <SelectValue placeholder="Assign a role" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 shadow-2xl p-2 bg-white">
                {roles.map((role) => (
                  <SelectItem
                    key={role.id}
                    value={role.id.toString()}
                    className="font-bold text-xs uppercase tracking-tight py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Change indicator */}
          {hasChanges && (
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 animate-in fade-in duration-300">
              ⚠ Unsaved changes detected
            </p>
          )}
        </form>

        {/* Footer */}
        <DialogFooter className="px-10 pb-10 pt-0 flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px] bg-white border border-slate-200 shadow-sm"
          >
            Discard Changes
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !hasChanges}
            className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-blue-100 text-xs uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              "Commit Identity Update"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
