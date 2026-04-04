"use client";

import React, { useState } from "react";
import { 
  User, 
  Calendar, 
  Clock, 
  Briefcase, 
  BarChart3,
  ExternalLink,
  ShieldCheck,
  Power,
  Edit2
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileTab } from "./tabs/ProfileTab";
import { AvailabilityTab } from "./tabs/AvailabilityTab";
import { TimeOffTab } from "./tabs/TimeOffTab";
import { ServicesTab } from "./tabs/ServicesTab";
import { StatsTab } from "./tabs/StatsTab";
import { Separator } from "@/components/ui/separator";

interface ProviderDetailPanelProps {
  provider: any;
  loading: boolean;
  onUpdate: () => void;
  onStatusChange: (status: string) => void;
}

export function ProviderDetailPanel({ 
  provider, 
  loading, 
  onUpdate, 
  onStatusChange 
}: ProviderDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("profile");

  if (loading && !provider) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Hydrating Clinical Workspace...</p>
      </div>
    );
  }

  const isInactive = provider?.user?.is_active === false;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/30">
      {/* Detail Header */}
      <div className="bg-white p-6 border-b border-slate-100 shrink-0">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-100 flex items-center justify-center relative border-4 border-white">
               <span className="text-xl font-black text-white">{provider?.user?.name?.substring(0, 2).toUpperCase()}</span>
               {provider?.status === "available" && (
                 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm" />
               )}
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">{provider?.user?.name}</h1>
                <Badge className={isInactive ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-emerald-50 text-emerald-600 border-emerald-100"}>
                  {isInactive ? "Inactive" : "Clinical Staff"}
                </Badge>
              </div>
              <div className="text-sm font-bold text-slate-500 flex items-center gap-2">
                {provider?.specialization?.name}
                <Separator orientation="vertical" className="h-3" />
                <span className="font-medium">{provider?.user?.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <Button variant="ghost" size="sm" onClick={onUpdate} className="h-9 px-4 rounded-xl font-bold text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors">
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              Public URL
            </Button>
            <Button className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-indigo-100 transition-all active:scale-95">
              <Edit2 className="w-3.5 h-3.5 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Tab Selection */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-100/50 p-1 rounded-2xl border border-slate-100 inline-flex w-auto">
            <TabsTrigger value="profile" className="rounded-xl px-5 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold text-[11px] uppercase tracking-wider text-slate-500 transition-all">
              <User className="w-3.5 h-3.5 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="availability" className="rounded-xl px-5 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold text-[11px] uppercase tracking-wider text-slate-500 transition-all">
              <Calendar className="w-3.5 h-3.5 mr-2" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="timeoff" className="rounded-xl px-5 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold text-[11px] uppercase tracking-wider text-slate-500 transition-all">
              <Clock className="w-3.5 h-3.5 mr-2" />
              Time Off
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-xl px-5 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold text-[11px] uppercase tracking-wider text-slate-500 transition-all">
              <Briefcase className="w-3.5 h-3.5 mr-2" />
              Services 
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl px-5 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold text-[11px] uppercase tracking-wider text-slate-500 transition-all">
              <BarChart3 className="w-3.5 h-3.5 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
         {activeTab === "profile" && <ProfileTab provider={provider} />}
         {activeTab === "availability" && <AvailabilityTab provider={provider} />}
         {activeTab === "timeoff" && <TimeOffTab provider={provider} />}
         {activeTab === "services" && <ServicesTab provider={provider} />}
         {activeTab === "stats" && <StatsTab provider={provider} />}
      </div>
    </div>
  );
}
