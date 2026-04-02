"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { DashboardCard, MetricCard } from "@/components/dashboard/ui/DashboardCard";
import { Loader2, Plus, Clock, CheckCircle2 } from "lucide-react";

export default function ReceptionistQueuePage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('all');

  // Specific Receptionist Queue Mocks matching dashboard.md structure
  const stats = {
    scheduled: 45,
    checked_in: 12,
    in_progress: 3,
    completed: 28,
  };

  const providers = [
    { id: 'all', label: 'All Providers' },
    { id: '1', label: 'Dr. Sarah Jenkins' },
    { id: '2', label: 'Dr. Marcus Chen' },
  ];

  const queue = [
    { id: 1, time: "09:00 AM", patient: "James Collins", service: "Annual Checkup", duration: "30m", status: "completed", provider_id: '1' },
    { id: 2, time: "09:30 AM", patient: "Maria Garcia", service: "Urgent Consultation", duration: "15m", status: "in_progress", provider_id: '1' },
    { id: 3, time: "09:45 AM", patient: "David Kim", service: "Blood Work", duration: "15m", status: "checked_in", provider_id: '2' },
    { id: 4, time: "10:00 AM", patient: "Emma Watson", service: "Follow-up", duration: "30m", status: "scheduled", provider_id: '2' },
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const filteredQueue = activeSubTab === 'all' ? queue : queue.filter(q => q.provider_id === activeSubTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      <PageHeader 
        breadcrumbs={["Home", "Reception", "Today's Queue"]} 
        title={new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())} 
        actionContent={
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[14px] font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Walk-In Booking</span>
          </button>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Scheduled" value={stats.scheduled} />
        <MetricCard title="Checked In" value={stats.checked_in} />
        <MetricCard title="In Progress" value={stats.in_progress} />
        <MetricCard title="Completed" value={stats.completed} />
      </div>

      {/* Main Queue Dashboard */}
      <DashboardCard className="mt-4 p-0">
        
        {/* Provider Sub Tabs */}
        <div className="flex border-b border-slate-100 overflow-x-auto hidden-scrollbar px-2 bg-[#fdfdfd]">
          {providers.map(provider => (
            <button
              key={provider.id}
              onClick={() => setActiveSubTab(provider.id)}
              className={`px-6 py-4 text-[14px] font-bold border-b-[3px] transition-colors whitespace-nowrap ${
                activeSubTab === provider.id 
                  ? "border-blue-600 text-blue-700" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {provider.label}
            </button>
          ))}
        </div>

        {/* Queue Table */}
        <div className="p-6">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Time Slot</th>
                <th className="text-left py-3 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Patient Name</th>
                <th className="text-left py-3 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Service</th>
                <th className="text-left py-3 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Status</th>
                <th className="text-right py-3 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map(appt => (
                <tr key={appt.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 font-bold text-slate-700">{appt.time}</td>
                  <td className="py-4 font-bold text-slate-900">{appt.patient}</td>
                  <td className="py-4 font-medium text-slate-500">{appt.service} ({appt.duration})</td>
                  <td className="py-4">
                    {appt.status === 'scheduled' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Scheduled</span>}
                    {appt.status === 'checked_in' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-blue-50 text-blue-700 border border-blue-100"><Clock className="w-3 h-3 mr-1"/>Checked In</span>}
                    {appt.status === 'in_progress' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-amber-50 text-amber-700 border border-amber-100"><Activity className="w-3 h-3 mr-1 animate-pulse"/>In Progress</span>}
                    {appt.status === 'completed' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-green-50 text-green-700 border border-green-100"><CheckCircle2 className="w-3 h-3 mr-1"/>Completed</span>}
                  </td>
                  <td className="py-4 text-right space-x-2">
                    {appt.status === 'scheduled' && <button className="text-[12px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">Check In</button>}
                    {appt.status === 'checked_in' && <button className="text-[12px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">Start Visit</button>}
                    {appt.status === 'in_progress' && <button className="text-[12px] font-bold text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">Complete</button>}
                    {(appt.status === 'scheduled' || appt.status === 'checked_in') && <button className="text-[12px] font-bold text-slate-500 hover:text-red-600 px-2 py-1.5 transition-colors">Cancel</button>}
                  </td>
                </tr>
              ))}
              {filteredQueue.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-medium">No appointments found for this queue.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}
