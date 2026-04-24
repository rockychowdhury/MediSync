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
import { cn } from "@/lib/utils";

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
      <div className="bg-white p-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-xl shadow-indigo-100 flex items-center justify-center relative border-2 border-white">
               <span className="text-sm font-black text-white">{provider?.user?.name?.substring(0, 2).toUpperCase()}</span>
               {provider?.status === "available" && (
                 <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
               )}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">{provider?.user?.name}</h1>
                <Badge className={cn(
                  "h-4 text-[8px] font-black uppercase tracking-widest px-1.5",
                  isInactive ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                )}>
                  {isInactive ? "Inactive" : "Clinical Staff"}
                </Badge>
              </div>
              <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wide">
                <span>{provider?.specialization?.name || "General Practice"}</span>
                <Separator orientation="vertical" className="h-2.5 bg-slate-200" />
                <span className="font-medium normal-case tracking-normal">{provider?.user?.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50/50 p-1 rounded-xl border border-slate-100">
            <Button variant="ghost" size="sm" onClick={onUpdate} className="h-8 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all cursor-pointer">
              <ExternalLink className="w-3 h-3 mr-1.5" />
              Portal
            </Button>
            <Button className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md shadow-indigo-100 transition-all active:scale-95 cursor-pointer">
              <Edit2 className="w-3 h-3 mr-1.5" />
              Moderate
            </Button>
          </div>
        </div>

        {/* Tab Selection */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
            <TabsList className="bg-slate-50/80 p-0.5 rounded-xl border border-slate-100 inline-flex w-auto mb-1 min-w-max">
              <TabsTrigger value="profile" className="rounded-lg px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-black text-[9px] uppercase tracking-widest text-slate-400 transition-all">
                <User className="w-3 h-3 mr-1.5" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="availability" className="rounded-lg px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-black text-[9px] uppercase tracking-widest text-slate-400 transition-all">
                <Calendar className="w-3 h-3 mr-1.5" />
                Presence
              </TabsTrigger>
              <TabsTrigger value="timeoff" className="rounded-lg px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-black text-[9px] uppercase tracking-widest text-slate-400 transition-all">
                <Clock className="w-3 h-3 mr-1.5" />
                Leave
              </TabsTrigger>
              <TabsTrigger value="services" className="rounded-lg px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-black text-[9px] uppercase tracking-widest text-slate-400 transition-all">
                <Briefcase className="w-3 h-3 mr-1.5" />
                Domain
              </TabsTrigger>
              <TabsTrigger value="stats" className="rounded-lg px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-black text-[9px] uppercase tracking-widest text-slate-400 transition-all">
                <BarChart3 className="w-3 h-3 mr-1.5" />
                Audit
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
         {activeTab === "profile" && <ProfileTab provider={provider} />}
         {activeTab === "availability" && <AvailabilityTab provider={provider} />}
         {activeTab === "timeoff" && <TimeOffTab provider={provider} />}
         {activeTab === "services" && <ServicesTab provider={provider} />}
         {activeTab === "stats" && <StatsTab provider={provider} />}
      </div>
    </div>
  );
}
