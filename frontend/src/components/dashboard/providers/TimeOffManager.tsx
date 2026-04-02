"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { timeOffApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface TimeOffManagerProps {
  providerId: string;
  onUpdate: () => void;
}

export function TimeOffManager({
  providerId,
  onUpdate,
}: TimeOffManagerProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  
  const [newRequest, setNewRequest] = useState({
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    reason: "",
  });

  const loadRecords = useCallback(async () => {
    setFetching(true);
    try {
      const res = await timeOffApi.getProviderTimeOff(providerId);
      if (res.success) setRecords(res.data || []);
    } catch (error) {
      console.error("Failed to fetch time-off records", error);
    } finally {
      setFetching(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await timeOffApi.createTimeOff({
        provider_id: providerId,
        ...newRequest
      });
      if (res.success) {
        loadRecords();
        onUpdate();
        setNewRequest({
            start_date: format(new Date(), "yyyy-MM-dd"),
            end_date: format(new Date(), "yyyy-MM-dd"),
            reason: "",
        });
      }
    } catch (error) {
      console.error("Failed to create time-off", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setLoading(true);
    try {
      const res = await timeOffApi.approveTimeOff(id);
      if (res.success) {
        loadRecords();
        onUpdate();
      }
    } catch (error) {
      console.error("Failed to approve time-off", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Request Form */}
      <section className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-inner">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
             <Calendar className="w-4 h-4" />
           </div>
           <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">New Leave Request</h4>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Commencement</Label>
                <Input 
                  type="date"
                  value={newRequest.start_date}
                  onChange={(e) => setNewRequest(p => ({ ...p, start_date: e.target.value }))}
                  className="h-10 rounded-xl border-slate-100 bg-white font-bold text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Termination</Label>
                <Input 
                  type="date"
                  value={newRequest.end_date}
                  onChange={(e) => setNewRequest(p => ({ ...p, end_date: e.target.value }))}
                  className="h-10 rounded-xl border-slate-100 bg-white font-bold text-xs"
                />
              </div>
           </div>
           
           <div className="space-y-1.5">
              <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Justification</Label>
              <Input 
                placeholder="e.g., Clinical conference, recurring leave..."
                value={newRequest.reason}
                onChange={(e) => setNewRequest(p => ({ ...p, reason: e.target.value }))}
                className="h-10 rounded-xl border-slate-100 bg-white font-bold text-xs"
              />
           </div>

           <Button 
            disabled={loading}
            className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-100 transition-all active:scale-95"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & File Request"}
           </Button>
        </form>
      </section>

      {/* Structured Ledger View */}
      <section className="space-y-6">
         <div className="flex items-center gap-3 mb-2">
            <div className="h-[1px] flex-1 bg-slate-100"></div>
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Leave Ledger</h3>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
         </div>

         {fetching ? (
            <div className="flex justify-center py-10">
               <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
            </div>
         ) : (
            <div className="space-y-3">
              {records.length > 0 ? (
                records.map((r) => (
                  <div key={r.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-slate-50/50 transition-all duration-300">
                    <div className="flex items-start gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.is_approved ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                          <FileText className="w-5 h-5" />
                       </div>
                       <div>
                          <div className="text-[11px] font-black text-slate-800 tracking-tight leading-none mb-1">
                            {format(new Date(r.start_date), "MMM d, yyyy")} — {format(new Date(r.end_date), "MMM d, yyyy")}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            {r.reason || "Standard Leave Record"}
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                       <Badge variant="outline" className={`rounded-xl px-3 py-1 text-[9px] font-black uppercase border tracking-widest ${r.is_approved ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                          {r.is_approved ? "Clinical Approved" : "Pending Sync"}
                       </Badge>
                       {!r.is_approved && (
                         <Button 
                          size="sm"
                          onClick={() => handleApprove(r.id)}
                          disabled={loading}
                          className="h-8 w-8 p-0 bg-white border border-slate-200 text-green-600 hover:bg-green-50 rounded-lg shadow-sm transition-all active:scale-90"
                         >
                            <CheckCircle className="w-4 h-4" />
                         </Button>
                       )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
                   <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-3" />
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No Active Leave Requests Detected</div>
                </div>
              )}
            </div>
         )}
      </section>

      <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100 flex items-center gap-3">
         <Clock className="w-5 h-5 text-amber-500 shrink-0" />
         <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
           Approved time-off records automatically suspend clinical availability for the specified period across all booking triggers.
         </p>
      </div>
    </div>
  );
}
