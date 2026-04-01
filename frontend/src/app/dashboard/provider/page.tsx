"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { appointmentsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Clock, Loader2, Users } from "lucide-react";

export default function ProviderDashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(false);

  // Note: For mock presentation purposes
  const capacity = {
    totalFrames: 16,
    bookedFrames: 11,
    utilization: "68%",
  };

  const queue = [
    { id: 101, patient: "John Doe", type: "Follow-up", time: "09:00 AM", status: "In Progress" },
    { id: 102, patient: "Sarah Smith", type: "Consultation", time: "09:30 AM", status: "Waiting" },
    { id: 103, patient: "Michael Johnson", type: "Urgent", time: "10:15 AM", status: "Scheduled" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Provider Schedule</h2>
        <p className="text-slate-500">Welcome, Dr. {user?.full_name?.split(' ').pop() || "Provider"}. Here is your schedule for today.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{capacity.bookedFrames}</div>
            <p className="text-xs text-slate-500 mt-1">Out of {capacity.totalFrames} available slots</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Capacity Utilization</CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{capacity.utilization}</div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: capacity.utilization }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Next Patient</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">Sarah Smith</div>
            <div className="flex items-center text-sm font-medium text-blue-700 mt-1">
              <Clock className="w-3 h-3 mr-1" />
              09:30 AM - Consultation
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Area */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Active Queue</CardTitle>
          <CardDescription>
            Your patient waiting list and upcoming appointments for today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700 border-y border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold">Time</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Patient Name</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Visit Type</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                      {item.time}
                    </td>
                    <td className="px-6 py-4">
                      {item.patient}
                    </td>
                    <td className="px-6 py-4">
                      {item.type}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${item.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                          item.status === 'Waiting' ? 'bg-amber-100 text-amber-800' : 
                          'bg-slate-100 text-slate-800'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                        View Chart
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
