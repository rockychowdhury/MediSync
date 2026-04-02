"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { DashboardCard, MetricCard } from "@/components/dashboard/ui/DashboardCard";
import { Loader2, Plus, Clock, Activity, CheckCircle2 } from "lucide-react";

export default function ReceptionistQueuePage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('all');

  const stats = { scheduled: 45, checked_in: 12, in_progress: 3, completed: 28 };
  const providers = [ { id: 'all', label: 'All' }, { id: '1', label: 'Dr. Jenkins' }, { id: '2', label: 'Dr. Chen' } ];
  const queue = Array.from({length: 12}).map((_, i) => ({
    id: i, time: "09:00 AM", patient: "James Collins " + i, service: "Checkup", duration: "30m", status: i < 3 ? "completed" : i === 3 ? "in_progress" : i < 6 ? "checked_in" : "scheduled", provider_id: i % 2 === 0 ? '1' : '2'
  }));

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  const filteredQueue = activeSubTab === 'all' ? queue : queue.filter(q => q.provider_id === activeSubTab);

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      
      <div className="shrink-0 mb-4">
        <PageHeader 
          breadcrumbs={["Home", "Reception", "Queue"]} 
          title={new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date())} 
          actionContent={
            <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[14px] font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700">
              <Plus className="w-4 h-4" /><span>Walk-In Booking</span>
            </button>
          }
        />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mt-2">
          <MetricCard title="Scheduled" value={stats.scheduled} />
          <MetricCard title="Checked In" value={stats.checked_in} />
          <MetricCard title="In Progress" value={stats.in_progress} />
          <MetricCard title="Completed" value={stats.completed} />
        </div>
      </div>

      <DashboardCard className="mt-2 flex-1 min-h-0 flex flex-col p-0">
        <div className="flex border-b border-slate-100 shrink-0 px-2 bg-[#fdfdfd]">
          {providers.map(provider => (
            <button
              key={provider.id}
              onClick={() => setActiveSubTab(provider.id)}
              className={`px-5 py-3 text-[13px] font-bold border-b-[3px] transition-colors whitespace-nowrap ${
                activeSubTab === provider.id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500"
              }`}
            >
              {provider.label}
            </button>
          ))}
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto hidden-scrollbar">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-6 font-bold text-slate-400 uppercase text-[11px] bg-white">Time</th>
                <th className="text-left py-3 px-6 font-bold text-slate-400 uppercase text-[11px] bg-white">Patient</th>
                <th className="text-left py-3 px-6 font-bold text-slate-400 uppercase text-[11px] bg-white">Status</th>
                <th className="text-right py-3 px-6 font-bold text-slate-400 uppercase text-[11px] bg-white">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map(appt => (
                <tr key={appt.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 px-6 font-bold text-slate-700">{appt.time}</td>
                  <td className="py-3 px-6 font-bold text-slate-900">{appt.patient}</td>
                  <td className="py-3 px-6">
                    {appt.status === 'scheduled' && <span className="px-2 py-1 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Scheduled</span>}
                    {appt.status === 'checked_in' && <span className="px-2 py-1 rounded text-[11px] font-bold bg-blue-50 text-blue-700 flex items-center w-max"><Clock className="w-3 h-3 mr-1"/>Checked In</span>}
                    {appt.status === 'in_progress' && <span className="px-2 py-1 rounded text-[11px] font-bold bg-amber-50 text-amber-700 flex items-center w-max"><Activity className="w-3 h-3 mr-1 animate-pulse"/>In Progress</span>}
                    {appt.status === 'completed' && <span className="px-2 py-1 rounded text-[11px] font-bold bg-green-50 text-green-700 flex items-center w-max"><CheckCircle2 className="w-3 h-3 mr-1"/>Done</span>}
                  </td>
                  <td className="py-3 px-6 text-right space-x-1 whitespace-nowrap">
                    {appt.status === 'scheduled' && <button className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded hover:bg-blue-100">Check In</button>}
                    {appt.status === 'checked_in' && <button className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded hover:bg-indigo-100">Start</button>}
                    {appt.status === 'in_progress' && <button className="text-[11px] font-bold text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded hover:bg-green-100">Complete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}
