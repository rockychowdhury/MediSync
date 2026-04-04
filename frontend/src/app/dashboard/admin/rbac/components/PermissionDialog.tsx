"use client";

import React, { useState, useEffect } from "react";
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
import { Permission } from "@/lib/api/rbac";

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission?: Permission | null; // If provided, we are in Edit mode
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
}

export function PermissionDialog({
  open,
  onOpenChange,
  permission,
  onSubmit,
}: PermissionDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!permission;

  useEffect(() => {
    if (open) {
      setName(permission?.name || "");
      setDescription(permission?.description || "");
      setError(null);
    }
  }, [open, permission]);

  const validateName = (val: string) => {
    if (!val) return "Name is required";
    if (!/^[a-z_]+\.[a-z_]+$/.test(val)) {
      return "Use format resource.action (lowercase and underscores only)";
    }
    return null;
  };

  const handleBlur = () => {
    if (!isEdit) {
      const err = validateName(name);
      setError(err);
    }
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
      await onSubmit({ name, description });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resourcePrefix = name.includes(".") ? name.split(".")[0] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Permission" : "Create Permission"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the description for this permission."
              : "Define a new granular capability. Format: resource.action"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Permission Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              onBlur={handleBlur}
              placeholder="appointments.create"
              disabled={isEdit}
              className={isEdit ? "bg-slate-50 font-mono text-slate-500" : "font-mono"}
              required
            />
            {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}
            {resourcePrefix && !error && (
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                Resource: {resourcePrefix}
              </p>
            )}
            {isEdit && (
              <p className="text-[10px] text-slate-400">
                Permission names cannot be changed after creation.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="description">Description</Label>
              <span className="text-[10px] text-slate-400">{description.length}/500</span>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Describe what this permission allows..."
              className="resize-none h-24"
            />
            <p className="text-[10px] text-slate-400 italic">
              Example: "Allows creating new patient appointments"
            </p>
          </div>

          {!isEdit && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preview</p>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <span className="text-blue-600">{resourcePrefix || "resource"}</span>
                <span className="text-slate-300">›</span>
                <span>{name.split(".")[1] || "action"}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {description || "No description provided"}
              </p>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Permission" : "Save Permission"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
