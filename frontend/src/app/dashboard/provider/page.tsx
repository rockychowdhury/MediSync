"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { Loader2, MonitorPlay, Clock } from "lucide-react";

export default function ProviderSchedulePage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);

  // Provider Schedule Mock Maps to dashboard.md
  const schedule = [
    { id: 1, time: "09:00 AM", end: "09:30 AM", patient: "James Collins", service: "Annual Checkup", status: "completed" },
    { id: 2, time: "09:30 AM", end: "09:45 AM", patient: "Maria Garcia", service: "Urgent Consultation", status: "in_progress" },
    { id: 3, time: "09:45 AM", end: "10:00 AM", type: 'buffer' },
    { id: 4, time: "10:00 AM", end: "10:30 AM", patient: "Emma Watson", service: "Follow-up", status: "scheduled" },
    { id: 5, time: "10:30 AM", end: "11:00 AM", patient: "Robert Miles", service: "Procedure X", status: "scheduled" },
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 400);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      <PageHeader 
        breadcrumbs={["Home", "Provider", "My Schedule"]} 
        title={`Dr. ${user?.full_name?.split(' ').pop() || 'Provider'}'s Schedule`} 
        actionContent={
          <div className="flex bg-slate-100 p-1.5 rounded-[12px] border border-slate-200/50 shadow-inner">
            <button className="px-5 py-1.5 text-[13px] font-bold bg-white text-slate-800 rounded-lg shadow-sm">Day</button>
            <button className="px-5 py-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-800">Week</button>
            <button className="px-5 py-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-800">Month</button>
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        
        {/* Timeline View Column */}
        <DashboardCard className="flex-1">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-[18px] font-bold text-slate-900 leading-tight">Today's Timeline</h2>
              <p className="text-[14px] text-slate-500 font-medium">8 slots remaining</p>
            </div>
            <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-200">
              Accepting Walk-Ins
            </div>
          </div>

          <div className="space-y-4">
            {schedule.map((slot, index) => {
              if (slot.type === 'buffer') {
                return (
                  <div key={index} className="flex h-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 opacity-60">
                    <div className="w-24 shrink-0 flex items-center justify-end pr-4 border-r border-slate-100">
                      <span className="text-[12px] font-bold text-slate-400">{slot.time}</span>
                    </div>
                    <div className="px-4 flex items-center">
                      <span className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Buffer / Prep</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={slot.id} className="flex relative">
                  <div className="w-24 shrink-0 flex flex-col items-end justify-start pr-4 pt-4 border-r border-slate-100">
                    <span className="text-[13px] font-bold text-slate-800">{slot.time}</span>
                    <span className="text-[11px] font-semibold text-slate-400">{slot.end}</span>
                  </div>
                  
                  <div className={`ml-4 flex-1 p-4 rounded-xl border relative overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer ${
                    slot.status === 'in_progress' ? 'bg-amber-50 border-amber-200' :
                    slot.status === 'completed' ? 'bg-slate-50 border-slate-200 opacity-75' :
                    'bg-white border-blue-100 hover:border-blue-300'
                  }`}>
                    {slot.status === 'in_progress' && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                    )}
                    {slot.status === 'scheduled' && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    )}
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`text-[15px] font-bold ${slot.status === 'completed' ? "text-slate-500 line-through decoration-slate-300" : "text-slate-900"}`}>{slot.patient}</h4>
                        <p className="text-[13px] font-medium text-slate-500">{slot.service}</p>
                      </div>
                      
                      {slot.status === 'scheduled' && <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700">Upcoming</span>}
                      {slot.status === 'in_progress' && <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">In Room</span>}
                      {slot.status === 'completed' && <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-200 text-slate-600">Done</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardCard>

        {/* Live Queue Panel Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <DashboardCard className="bg-[#1E293B] text-white border-none shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Current Status</span>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
            </div>
            <div className="text-[32px] font-bold tracking-tight mb-4">In Session</div>
            <div className="p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
              <h4 className="text-[15px] font-bold text-white">Maria Garcia</h4>
              <p className="text-[13px] text-slate-300 mb-4">Urgent Consultation</p>
              
              <div className="flex space-x-2">
                <button className="flex-1 bg-white text-slate-900 font-bold text-[13px] rounded-lg py-2 transition-transform active:scale-95 flex items-center justify-center">
                  <MonitorPlay className="w-4 h-4 mr-2" /> End Visit
                </button>
              </div>
            </div>
          </DashboardCard>
          
          <DashboardCard className="flex-1 bg-[#fafafa]">
            <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-slate-400" />
              Up Next
            </h3>
            
            <div className="space-y-3">
              {schedule.filter(s => s.status === 'scheduled').map(s => (
                <div key={s.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[13px] font-bold text-slate-800">{s.time}</span>
                  </div>
                  <div className="text-[14px] font-semibold text-slate-700">{s.patient}</div>
                  <div className="text-[12px] text-slate-500">{s.service}</div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

      </div>
    </div>
  );
}
