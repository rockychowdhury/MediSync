"use client";

import React from "react";
import { 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Award,
  ChevronRight,
  ShieldCheck,
  Stethoscope
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface ProviderGridProps {
  providers: any[];
  onProviderClick: (id: string) => void;
}

export function ProviderGrid({
  providers,
  onProviderClick,
}: ProviderGridProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available": return "bg-green-50 text-green-700 border-green-100";
      case "on_leave": return "bg-amber-50 text-amber-700 border-amber-100";
      case "busy": return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-700">
      {providers.map((p) => (
        <Card 
          key={p.id} 
          onClick={() => onProviderClick(p.id)}
          className="group relative overflow-hidden border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-500 cursor-pointer rounded-3xl bg-white"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <Stethoscope className="w-24 h-24 -rotate-12" />
          </div>

          <CardHeader className="pb-4 pt-6 px-6 relative">
             <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-110 transition-transform duration-500">
                  {p.user?.full_name?.[0] || p.user?.name?.[0] || "D"}
                </div>
                <Badge variant="outline" className={`rounded-xl py-1 px-3 text-[9px] font-black uppercase tracking-widest border transition-all ${getStatusColor(p.status)}`}>
                  {p.status?.replace('_', ' ')}
                </Badge>
             </div>
             <div className="mt-4">
                <h3 className="text-base font-black text-slate-800 tracking-tight line-clamp-1">{p.user?.full_name || p.user?.name || "Dr. Staff Member"}</h3>
                <div className="flex items-center text-blue-600 font-black text-[10px] uppercase tracking-widest mt-1">
                   <Award className="w-3 h-3 mr-1.5" />
                   {p.specialization?.name || "Clinical Generalist"}
                </div>
             </div>
          </CardHeader>

          <CardContent className="px-6 py-4 border-y border-slate-50 space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency</div>
                   <div className="text-xs font-bold text-slate-700 flex items-center">
                     <Calendar className="w-3 h-3 mr-1.5 text-slate-300" />
                     {p.max_daily_appointments} / Day
                   </div>
                </div>
                <div className="space-y-1">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catalog</div>
                   <div className="text-xs font-bold text-slate-700 flex items-center">
                     <Briefcase className="w-3 h-3 mr-1.5 text-slate-300" />
                     {p.services?.length || 0} Procedures
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                Verified Clinical Credential
             </div>
          </CardContent>

          <CardFooter className="px-6 py-4 bg-slate-50/30 flex items-center justify-between group-hover:bg-blue-50/30 transition-colors">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-400 transition-colors">Profile Insight</span>
             <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </CardFooter>
        </Card>
      ))}

      {providers.length === 0 && (
         <div className="col-span-full py-32 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 border border-dashed border-slate-200">
               <User className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">No Clinicians Registered in Registry</p>
         </div>
      )}
    </div>
  );
}

const Briefcase = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);
