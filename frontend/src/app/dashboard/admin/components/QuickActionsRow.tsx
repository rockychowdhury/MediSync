"use client";

import React from "react";
import { 
  CalendarPlus, 
  UserPlus, 
  UserCheck, 
  FileText, 
  PieChart, 
  Settings,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  href: string;
}

function QuickAction({ label, sublabel, icon, color, href }: QuickActionProps) {
  return (
    <a 
      href={href}
      className="group relative flex flex-col p-5 bg-white rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all overflow-hidden"
    >
      <div className={cn("absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform", color)}>
        {icon}
      </div>
      
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm border", color.replace('text-', 'bg-').replace('text-white', 'text-slate-900') + '/10', color.replace('text-', 'border-').replace('text-white', 'border-slate-100') + '/20')}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 18, className: color })}
      </div>

      <div className="flex flex-col">
        <span className="text-[14px] font-black text-slate-800 tracking-tight leading-none group-hover:text-blue-600 transition-colors">{label}</span>
        <span className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest leading-none">{sublabel}</span>
      </div>

      <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
        Action Now <ChevronRight size={10} />
      </div>
    </a>
  );
}

export function QuickActionsRow() {
  const actions = [
    {
      label: "Book Appointment",
      sublabel: "Schedule new visit",
      icon: <CalendarPlus />,
      color: "text-blue-600",
      href: "/dashboard/admin/appointments?action=new"
    },
    {
      label: "Add to Waitlist",
      sublabel: "Queue urgent patient",
      icon: <UserPlus />,
      color: "text-amber-600",
      href: "/dashboard/admin/waitlist?action=new"
    },
    {
      label: "Register Provider",
      sublabel: "Onboard new staff",
      icon: <UserCheck />,
      color: "text-emerald-600",
      href: "/dashboard/admin/providers?action=new"
    },
    {
      label: "System Audit",
      sublabel: "Review activity logs",
      icon: <FileText />,
      color: "text-indigo-600",
      href: "/dashboard/admin/audit"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {actions.map((action) => (
        <QuickAction key={action.label} {...action} />
      ))}
    </div>
  );
}
