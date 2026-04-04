"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Role, Permission } from "@/lib/api/rbac";

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
  permissions: Permission[];
  onSubmit: (data: { name: string; description: string; initialPermissions?: number[] }) => Promise<void>;
}

export function RoleDialog({
  open,
  onOpenChange,
  role,
  permissions,
  onSubmit,
}: RoleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!role;

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((p) => {
      const resource = p.name.includes(".") ? p.name.split(".")[0] : "general";
      if (!groups[resource]) groups[resource] = [];
      groups[resource].push(p);
    });
    return groups;
  }, [permissions]);

  useEffect(() => {
    if (open) {
      setName(role?.name || "");
      setDescription(role?.description || "");
      setSelectedPermissions(new Set()); // Initial permissions only for NEW role
      setError(null);
    }
  }, [open, role]);

  const validateName = (val: string) => {
    if (!val) return "Name is required";
    if (!/^[a-z_]+$/.test(val)) {
      return "Use lowercase letters and underscores only";
    }
    return null;
  };

  const handleBlur = () => {
    if (!isEdit) {
      const err = validateName(name);
      setError(err);
    }
  };

  const togglePermission = (id: number) => {
    const next = new Set(selectedPermissions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPermissions(next);
  };

  const toggleGroup = (perms: Permission[]) => {
    const allIds = perms.map((p) => p.id);
    const someSelected = allIds.some((id) => selectedPermissions.has(id));
    const next = new Set(selectedPermissions);
    if (someSelected) {
      allIds.forEach((id) => next.delete(id));
    } else {
      allIds.forEach((id) => next.add(id));
    }
    setSelectedPermissions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEdit) {
      const err = validateName(name);
      if (err) {
        setError(err);
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit({
        name,
        description,
        initialPermissions: isEdit ? undefined : Array.from(selectedPermissions),
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update description for this role."
              : "Define a new access role. Use lowercase and underscores."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">Role Name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              onBlur={handleBlur}
              placeholder="e.g. billing_staff"
              disabled={isEdit}
              className={isEdit ? "bg-slate-50 font-mono text-slate-500" : "font-mono"}
              required
            />
            {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}
            {isEdit && (
              <p className="text-[10px] text-slate-400">
                Role names cannot be changed after creation.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="role-desc">Description</Label>
              <span className="text-[10px] text-slate-400">{description.length}/500</span>
            </div>
            <Textarea
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Describe who this role is for and what it covers..."
              className="resize-none h-20"
            />
          </div>

          {!isEdit && (
            <div className="space-y-3">
              <Label>Initial Permissions (Optional)</Label>
              <ScrollArea className="h-60 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {resource}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-6 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => toggleGroup(perms)}
                        >
                          {perms.every((p) => selectedPermissions.has(p.id)) ? "Deselect All" : "Select All"}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {perms.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 group">
                            <Checkbox
                              id={`perm-${p.id}`}
                              checked={selectedPermissions.has(p.id)}
                              onCheckedChange={() => togglePermission(p.id)}
                            />
                            <Label
                              htmlFor={`perm-${p.id}`}
                              className="text-xs font-medium text-slate-600 group-hover:text-slate-900 cursor-pointer transition-colors"
                            >
                              {p.name.split(".")[1] || p.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-[10px] text-slate-400">
                You can also manage these in the matrix after the role is created.
              </p>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
