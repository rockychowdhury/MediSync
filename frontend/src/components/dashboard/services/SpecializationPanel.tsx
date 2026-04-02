"use client";

import React, { useState } from "react";
import { 
  Award, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { specializationsApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface SpecializationPanelProps {
  specializations: any[];
  onUpdate: () => void;
}

export function SpecializationPanel({
  specializations,
  onUpdate,
}: SpecializationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [newSpec, setNewSpec] = useState({ name: "", description: "" });
  const [editSpec, setEditSpec] = useState({ name: "", description: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpec.name) return;
    setLoading(true);
    try {
      const res = await specializationsApi.createSpecialization(newSpec);
      if (res.success) {
        onUpdate();
        setNewSpec({ name: "", description: "" });
      }
    } catch (error) {
      console.error("Failed to create specialization", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number) => {
    setLoading(true);
    try {
      const res = await specializationsApi.updateSpecialization(id, editSpec);
      if (res.success) {
        onUpdate();
        setEditingId(null);
      }
    } catch (error) {
      console.error("Failed to update specialization", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Decommission this clinical specialization? This action is irreversible.")) return;
    try {
      const res = await specializationsApi.deleteSpecialization(id);
      if (res.success) onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Cannot delete specialization with active links");
    }
  };

  return (
    <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-8 space-y-8 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative shadow-inner">
       <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Award className="w-24 h-24 rotate-12" />
       </div>

       <div className="flex items-center justify-between">
          <div>
             <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Clinical Specialization Registry
             </h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-7">Master Definition of Workforce Roles</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of Specializations */}
          <div className="lg:col-span-2 space-y-3">
             {specializations.map((spec) => (
                <div key={spec.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-100 transition-all group shadow-sm">
                   {editingId === spec.id ? (
                      <div className="flex-1 flex gap-3 mr-4">
                         <Input 
                            value={editSpec.name}
                            onChange={(e) => setEditSpec(p => ({ ...p, name: e.target.value }))}
                            className="h-9 rounded-xl border-slate-200 text-xs font-bold"
                         />
                         <Input 
                            value={editSpec.description}
                            onChange={(e) => setEditSpec(p => ({ ...p, description: e.target.value }))}
                            className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
                         />
                      </div>
                   ) : (
                      <div className="flex items-center gap-4">
                         <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">
                            {spec.name?.[0]}
                         </div>
                         <div>
                            <div className="text-xs font-black text-slate-800 tracking-tight uppercase leading-none">{spec.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold tracking-tight mt-1 truncate max-w-[200px]">{spec.description || "No definition provided"}</div>
                         </div>
                      </div>
                   )}

                   <div className="flex items-center gap-1.5 overflow-hidden">
                      {editingId === spec.id ? (
                        <>
                           <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleUpdate(spec.id)}
                              className="h-8 shadow-sm bg-green-50 text-green-600 hover:bg-green-100 rounded-lg px-2"
                           >
                              <Check className="w-3.5 h-3.5" />
                           </Button>
                           <Button 
                              size="sm"
                               variant="ghost"
                              onClick={() => setEditingId(null)}
                              className="h-8 shadow-sm bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-lg px-2"
                           >
                              <X className="w-3.5 h-3.5" />
                           </Button>
                        </>
                      ) : (
                        <>
                           <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                 setEditingId(spec.id);
                                 setEditSpec({ name: spec.name, description: spec.description || "" });
                              }}
                              className="h-8 opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-2"
                           >
                              <Edit3 className="w-3.5 h-3.5" />
                           </Button>
                           <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDelete(spec.id)}
                              className="h-8 opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg px-2"
                           >
                              <Trash2 className="w-3.5 h-3.5" />
                           </Button>
                        </>
                      )}
                   </div>
                </div>
             ))}
             {specializations.length === 0 && (
                <div className="py-10 text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest italic border border-dashed border-slate-200 rounded-2xl">
                   No clinical roles defined in registry.
                </div>
             )}
          </div>

          {/* Creation Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 h-fit">
             <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Enroll New Role
             </div>
             
             <div className="space-y-4">
                <div className="space-y-1.5">
                   <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Designation</Label>
                   <Input 
                      placeholder="e.g., Clinical Oncologist"
                      value={newSpec.name}
                      onChange={(e) => setNewSpec(p => ({ ...p, name: e.target.value }))}
                      className="h-10 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white font-bold text-xs"
                   />
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Scope</Label>
                   <Input 
                      placeholder="Clinical scope of practice..."
                      value={newSpec.description}
                      onChange={(e) => setNewSpec(p => ({ ...p, description: e.target.value }))}
                      className="h-10 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white font-bold text-xs"
                   />
                </div>
                <Button 
                   disabled={loading || !newSpec.name}
                   onClick={handleCreate}
                   className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Commit"}
                </Button>
             </div>
          </div>
       </div>

       <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
          <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
             Specializations define the clinical taxonomy of the workforce. Modifications may impact service catalog requirements and clinician promotional criteria.
          </p>
       </div>
    </div>
  );
}
