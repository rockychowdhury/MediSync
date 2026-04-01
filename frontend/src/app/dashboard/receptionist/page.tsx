"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, UserPlus, FileText, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ReceptionistDashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(false);

  // Mock data for presentation
  const waitlist = [
    { id: 1, name: "Emma Watson", doctor: "Dr. Smith", waitTime: "15 mins", priority: "Normal" },
    { id: 2, name: "James Bond", doctor: "Dr. Patel", waitTime: "45 mins", priority: "High" },
    { id: 3, name: "Bruce Wayne", doctor: "Dr. Smith", waitTime: "5 mins", priority: "Normal" },
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Front Desk Overview</h2>
          <p className="text-slate-500">Welcome, {user?.full_name?.split(' ')[0] || "Receptionist"}. Access waitlists and scheduling.</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm">
            <Search className="w-4 h-4 mr-2" />
            Find Patient
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <UserPlus className="w-4 h-4 mr-2" />
            New Walk-in
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Waitlist</CardTitle>
            <UsersIcon className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">8</div>
            <p className="text-xs text-amber-600 font-medium mt-1">Patients waiting</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Checked In Today</CardTitle>
            <CheckIcon className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">42</div>
            <p className="text-xs text-slate-500 mt-1">Target: 60</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Waitlist Table */}
        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Live Waitlist</CardTitle>
            <CardDescription>
              Currently checked in patients waiting for provider assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-500">
                <thead className="bg-slate-50 text-xs uppercase text-slate-700 border-y border-slate-200">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Patient</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Provider</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Wait Time</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Priority</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                      <td className="px-4 py-3">{item.doctor}</td>
                      <td className="px-4 py-3">
                        <span className={`font-mono ${parseInt(item.waitTime) > 30 ? 'text-red-600 font-bold' : ''}`}>
                          {item.waitTime}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${item.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" className="h-8">Assign</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Master Schedule</CardTitle>
            <CardDescription>
              Quickly check provider availability.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search providers..." className="pl-9 h-10 border-slate-200" />
            </div>
            
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-blue-200 cursor-pointer transition-colors bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">JS</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 leading-none">Dr. Smith</p>
                    <p className="text-xs text-slate-500 mt-1">Cardiology</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500" title="Available"></div>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-blue-200 cursor-pointer transition-colors bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">KP</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 leading-none">Dr. Patel</p>
                    <p className="text-xs text-slate-500 mt-1">General Practice</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-red-500" title="Busy"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Temporary icon components
function UsersIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}

function CheckIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"/></svg>;
}
