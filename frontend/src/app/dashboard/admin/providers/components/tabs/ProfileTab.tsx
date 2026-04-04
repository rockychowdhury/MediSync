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

interface ProfileTabProps {
  provider: any;
}

export function ProfileTab({ provider }: ProfileTabProps) {
  if (!provider) return null;

  return (
    <div className="h-full flex flex-col min-h-0 overflow-y-auto p-8 custom-scrollbar space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Today's Capacity</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-slate-800 tracking-tighter">6<span className="text-lg text-slate-400">/8</span></p>
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">75% Utilized</p>
              </div>
              <Progress value={75} className="h-2 bg-blue-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Comp. Rate</h3>
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tighter">98.2<span className="text-lg text-slate-400">%</span></p>
            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mt-2">+2.4% from last week</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Clinical Priority</h3>
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tighter">Gold<span className="text-lg text-slate-400"> Tier</span></p>
            <div className="flex items-center gap-2 mt-2">
               <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100">Emergency Enabled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Details Section */}
      <div className="grid grid-cols-2 gap-12 pt-4">
        <div className="space-y-8">
          <section>
            <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              Clinical Identity
            </h4>
            <div className="grid grid-cols-1 gap-6">
               <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                    <MapPin className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Specialization</p>
                    <p className="text-sm font-bold text-slate-700">{provider?.specialization?.name || "Consultant Generalist"}</p>
                  </div>
               </div>
               
               <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                    <CreditCard className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billing Tier</p>
                    <p className="text-sm font-bold text-slate-700">${provider?.consultation_fee || "150.00"} (Standard Consultation)</p>
                  </div>
               </div>
            </div>
          </section>

          <section>
            <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-6 px-1">System Credentials</h4>
            <div className="rounded-3xl border border-dashed border-slate-200 p-6 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">Provider UUID</p>
                <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-100 text-slate-400">{provider?.id}</code>
              </div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">License Verification</p>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold">Verified</Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Joined Date</p>
                <p className="text-sm font-bold text-slate-700">{new Date(provider?.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Notes/Quick Actions */}
        <div className="space-y-8">
           <section>
              <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-6 px-1">Internal Clinical Notes</h4>
              <div className="h-[280px] rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
                 <p className="text-sm text-slate-500 leading-relaxed italic">
                    "Dr. {provider?.user?.name?.split(' ')[1]} is a senior consultant specializing in complex cases. Has consistently high patient satisfaction ratings. Preferentially assigned to {provider?.specialization?.name} consultations during peak morning hours."
                 </p>
                 <div className="pt-4 border-t border-slate-50">
                    <Button variant="ghost" className="w-full justify-start h-10 font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                      Update Internal Notes
                    </Button>
                 </div>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
