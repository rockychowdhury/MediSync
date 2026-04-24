"use client";

import React from "react";
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  CreditCard, 
  CalendarCheck,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ProfileTabProps {
  provider: any;
}

export function ProfileTab({ provider }: ProfileTabProps) {
  if (!provider) return null;

  return (
    <ScrollArea className="h-full bg-white">
      <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Overview Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="rounded-2xl border-slate-100 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100/50 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Today's Load</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-black text-slate-800 tracking-tighter">6<span className="text-sm text-slate-300">/8</span></p>
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">75% Cap.</p>
                </div>
                <Progress value={75} className="h-1.5 bg-indigo-100/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency</h3>
              </div>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">98.2<span className="text-sm text-slate-300">%</span></p>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1.5">+2.4% trend</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100/50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Tier</h3>
              </div>
              <p className="text-2xl font-black text-slate-800 tracking-tighter text-amber-600">Gold</p>
              <div className="flex items-center gap-2 mt-1.5">
                 <Badge className="h-4 bg-amber-50 text-amber-600 border-amber-100 text-[8px] font-black uppercase tracking-widest">Priority</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details Section */}
        <div className="grid grid-cols-2 gap-8 pt-2">
          <div className="space-y-6">
            <section>
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
                Clinical Domain
              </h4>
              <div className="grid grid-cols-1 gap-4">
                 <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                      <MapPin className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Primary Taxonomy</p>
                      <p className="text-[11px] font-bold text-slate-700">{provider?.specialization?.name || "Consultant Generalist"}</p>
                    </div>
                 </div>
                 
                 <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Billing Protocol</p>
                      <p className="text-[11px] font-bold text-slate-700">${provider?.consultation_fee || "150.00"} Standard</p>
                    </div>
                 </div>
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4 px-1">Registry Data</h4>
              <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal UUID</p>
                  <code className="text-[10px] font-mono text-slate-400">{provider?.id?.substring(0, 8)}...</code>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credential State</p>
                  <Badge variant="outline" className="h-4 bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-black uppercase tracking-widest">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registry Date</p>
                  <p className="text-[10px] font-bold text-slate-700">{new Date(provider?.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Notes/Quick Actions */}
          <div className="space-y-6">
             <section>
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4 px-1">Clinical Observations</h4>
                <div className="h-[220px] rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
                   <p className="text-[11px] text-slate-500 leading-relaxed italic">
                      "Dr. {provider?.user?.name?.split(' ')[1]} exhibits high interactive liquidity and administrative oversight. Consistently maintains positive clinical outcomes in complex {provider?.specialization?.name} cases. Verified for emergency protocol escalation."
                   </p>
                   <div className="pt-4 border-t border-slate-50">
                      <Button variant="ghost" className="w-full justify-start h-8 font-black text-[9px] uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all cursor-pointer">
                        Append Internal Note
                      </Button>
                   </div>
                </div>
             </section>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
