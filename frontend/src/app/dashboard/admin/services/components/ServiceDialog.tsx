"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import { Service } from "@/types/service";
import { Specialization } from "@/types/provider";
import { Stethoscope, Clock, ShieldCheck, AlignLeft, Hash, DollarSign, Layers, PencilLine, ListFilter, Check, ChevronsUpDown, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  viewOnly?: boolean;
  specializations: Specialization[];
  categories: string[];
  onSubmit: (data: any) => Promise<void>;
}

export function ServiceDialog({
  open,
  onOpenChange,
  service,
  viewOnly = false,
  specializations,
  categories,
  onSubmit,
}: ServiceDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: categories[0] || "",
    duration_minutes: 30,
    buffer_time_minutes: 0,
    required_specialization_id: specializations[0]?.id?.toString() || "",
    fee: "0",
    billing_code: "",
    is_active: true,
  });
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [openSpec, setOpenSpec] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchSpec, setSearchSpec] = useState("");
  const specDropdownRef = useRef<HTMLDivElement>(null);

  const filteredSpecs = specializations.filter((spec) =>
    spec.name.toLowerCase().includes(searchSpec.toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (specDropdownRef.current && !specDropdownRef.current.contains(e.target as Node)) {
        setOpenSpec(false);
        setSearchSpec("");
      }
    };
    if (openSpec) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openSpec]);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || "",
        category: service.category || "",
        duration_minutes: service.duration_minutes,
        buffer_time_minutes: service.buffer_time_minutes || 0,
        required_specialization_id: service.required_specialization_id,
        fee: service.fee?.toString() || "0",
        billing_code: service.billing_code || "",
        is_active: service.is_active,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        category: categories[0] || "",
        duration_minutes: 30,
        buffer_time_minutes: 0,
        required_specialization_id: specializations[0]?.id?.toString() || "",
        fee: "0",
        billing_code: "",
        is_active: true,
      });
    }
    setIsNewCategory(false);
  }, [service, open, specializations, categories]);

  const handleCategoryChange = (val: string) => {
    if (val === "ADD_NEW_DOMAIN") {
      setIsNewCategory(true);
      setFormData({ ...formData, category: "" });
    } else {
      setFormData({ ...formData, category: val });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewOnly) {
      onOpenChange(false);
      return;
    }
    setLoading(true);

    // Prepare Structural Payload with absolute parity
    const payload: any = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      duration_minutes: Number(formData.duration_minutes),
      buffer_time_minutes: Number(formData.buffer_time_minutes),
      required_specialization_id: Number(formData.required_specialization_id),
      fee: Number(formData.fee),
      billing_code: formData.billing_code,
    };

    // Omit status during initial enrollment (POST)
    if (service) {
      payload.is_active = formData.is_active;
    }

    await onSubmit(payload);
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="max-w-[440px] p-0 overflow-hidden rounded-[24px] border-slate-200 shadow-2xl bg-white outline-none"
      >
        <DialogHeader className="p-6 bg-slate-900 text-white relative flex flex-col items-center justify-center text-center overflow-hidden shrink-0">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Stethoscope size={100} />
          </div>
          
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 backdrop-blur-md flex items-center justify-center border border-indigo-500/30 mb-3 z-10">
            <Stethoscope className="w-5 h-5 text-indigo-400" />
          </div>
          
          <DialogTitle className="text-xl font-black uppercase tracking-tight z-10">
            {viewOnly ? "Asset Insight" : service ? "Update Portfolio" : "Resource Enrollment"}
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1 z-10 leading-none">
            {viewOnly ? "Operational Registry Inspection" : "Institutional Asset Registry Management"}
          </DialogDescription>
        </DialogHeader>
 
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            {/* Primary Identity Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">Asset Nomenclature</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-focus-within:border-indigo-200 transition-colors">
                    <Stethoscope className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <Input
                    required
                    readOnly={viewOnly}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Cardiology"
                    className="pl-13 h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-none placeholder:text-slate-300 placeholder:font-medium text-[11px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Asset Domain</Label>
                  {!viewOnly && (
                    <Button 
                      type="button"
                      variant="ghost" 
                      onClick={() => {
                        setIsNewCategory(!isNewCategory);
                        if (!isNewCategory) setFormData({ ...formData, category: "" });
                        else setFormData({ ...formData, category: categories[0] || "" });
                      }}
                      className="h-4 px-1.5 text-[8px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                    >
                      {isNewCategory ? "Registry List" : "Direct Entry"}
                    </Button>
                  )}
                </div>

                {isNewCategory ? (
                   <div className="relative group">
                     <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 group-focus-within:border-indigo-200 transition-colors">
                        <PencilLine className="w-4 h-4 text-indigo-500" />
                     </div>
                     <Input 
                       required
                       readOnly={viewOnly}
                       value={formData.category}
                       onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                       placeholder="Enter new domain..."
                       className="pl-13 h-11 rounded-xl border-indigo-200 font-bold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-none placeholder:text-slate-300 placeholder:font-medium text-[11px]"
                     />
                   </div>
                ) : (
                  <Select
                    disabled={viewOnly}
                    value={formData.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-none outline-none text-[11px]">
                       <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                            <Layers className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <SelectValue placeholder="Domain" />
                       </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-2xl p-1">
                      {/* Institutional Registry Enrollment */}
                      {[...new Set([...categories, formData.category])].filter(Boolean).map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs font-bold py-2.5 px-3 cursor-pointer rounded-lg focus:bg-indigo-50 focus:text-indigo-600 transition-colors">
                          {cat}
                        </SelectItem>
                      ))}
                      <div className="h-px bg-slate-100 my-1" />
                      {!viewOnly && (
                        <SelectItem value="ADD_NEW_DOMAIN" className="text-xs font-black py-2.5 px-3 cursor-pointer rounded-lg text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 transition-colors uppercase tracking-widest flex items-center gap-2">
                          <div className="flex items-center gap-2">
                             <ListFilter className="w-3.5 h-3.5" />
                             Define New Domain...
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">Institutional Context (Scope)</Label>
              <div className="relative group">
                <div className="absolute left-3 top-3 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-focus-within:border-indigo-200 transition-colors">
                  <AlignLeft className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <Textarea
                  readOnly={viewOnly}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Clinical scope and expertise boundaries..."
                  className="pl-13 min-h-[80px] rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-none placeholder:text-slate-300 placeholder:font-medium text-[11px] leading-relaxed py-3"
                />
              </div>
            </div>

            {/* Operational Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">Tempo (Min)</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-focus-within:border-indigo-200 transition-colors">
                    <Clock className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <Input
                    type="number"
                    required
                    readOnly={viewOnly}
                    min={1}
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="pl-13 h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-none text-[11px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">Buffer (Min)</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-focus-within:border-indigo-200 transition-colors">
                    <Clock className="w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors opacity-50" />
                  </div>
                  <Input
                    type="number"
                    required
                    readOnly={viewOnly}
                    min={0}
                    value={formData.buffer_time_minutes}
                    onChange={(e) => setFormData({ ...formData, buffer_time_minutes: parseInt(e.target.value) })}
                    className="pl-13 h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-none text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Financial Oversight Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">Revenue Oversight (Fee)</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-focus-within:border-indigo-200 transition-colors">
                    <DollarSign className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <Input
                    required
                    readOnly={viewOnly}
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    className="pl-13 h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-none text-[11px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">Claims Index (Code)</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-focus-within:border-indigo-200 transition-colors">
                    <Hash className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <Input
                    required
                    readOnly={viewOnly}
                    value={formData.billing_code}
                    onChange={(e) => setFormData({ ...formData, billing_code: e.target.value })}
                    placeholder="CPT-99213"
                    className="pl-13 h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-none placeholder:text-slate-300 placeholder:font-medium text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">Institutional Alignment</Label>
                <div className="relative" ref={specDropdownRef}>
                  <button
                    type="button"
                    disabled={viewOnly}
                    onClick={() => { setOpenSpec(!openSpec); setSearchSpec(""); }}
                    className={cn(
                      "w-full h-11 rounded-xl border border-slate-200 font-bold text-slate-700 bg-slate-50/30 hover:bg-white/80 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-none flex items-center justify-between text-[11px] px-3",
                      !formData.required_specialization_id && "text-slate-400 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-6 h-6 rounded flex items-center justify-center transition-colors",
                        formData.required_specialization_id ? "bg-indigo-50" : "bg-slate-100"
                      )}>
                        <ShieldCheck className={cn(
                          "w-3.5 h-3.5 transition-colors",
                          formData.required_specialization_id ? "text-indigo-500" : "text-slate-400"
                        )} />
                      </div>
                      {formData.required_specialization_id
                        ? specializations.find(
                            (spec) => String(spec.id) === String(formData.required_specialization_id)
                          )?.name || "Select specialization..."
                        : "Select specialization..."}
                    </div>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </button>

                  {openSpec && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 z-[100] bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          type="text"
                          placeholder="Search specialization..."
                          value={searchSpec}
                          onChange={(e) => setSearchSpec(e.target.value)}
                          className="flex h-10 w-full bg-transparent py-3 text-[11px] font-bold outline-none placeholder:text-slate-300"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-[220px] overflow-y-auto p-1">
                        {filteredSpecs.length === 0 ? (
                          <div className="text-[10px] font-bold text-slate-400 py-6 text-center">No specialization found.</div>
                        ) : (
                          filteredSpecs.map((spec) => (
                            <button
                              key={spec.id}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, required_specialization_id: spec.id.toString() }));
                                setOpenSpec(false);
                                setSearchSpec("");
                              }}
                              className={cn(
                                "w-full text-left text-[11px] font-bold py-2.5 px-3 flex items-center justify-between cursor-pointer rounded-lg transition-colors hover:bg-indigo-50 hover:text-indigo-600",
                                String(formData.required_specialization_id) === String(spec.id) && "bg-indigo-50 text-indigo-600"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <ShieldCheck className={cn(
                                  "w-3.5 h-3.5 mr-1 text-slate-300",
                                  String(formData.required_specialization_id) === String(spec.id) && "text-indigo-500"
                                )} />
                                {spec.name}
                              </div>
                              <Check
                                className={cn(
                                  "h-3.5 w-3.5 text-indigo-600",
                                  String(formData.required_specialization_id) === String(spec.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">Asset Status</Label>
                <div className="flex items-center h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/30 group">
                   <Switch 
                     disabled={viewOnly}
                     checked={formData.is_active}
                     onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                     className="data-[state=checked]:bg-emerald-500"
                   />
                   <span className={`ml-3 text-[10px] font-black uppercase tracking-tight transition-colors ${formData.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                     {formData.is_active ? "In Service" : "Operational Lock"}
                   </span>
                </div>
              </div>
            </div>
          </div>
 
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-[0.15em] shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Synchronizing..." : viewOnly ? "Close Insight" : service ? "Update Resource Identity" : "Commit to Registry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
