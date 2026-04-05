"use client";

import React from "react";
import { AlertCircle, Zap, Clock, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  alert: any;
  onDismiss: () => void;
}

function AlertBanner({ alert, onDismiss }: AlertBannerProps) {
  const getIcon = () => {
    switch (alert.type) {
      case 'emergency_waitlist': return <Zap className="text-rose-600" />;
      case 'pending_time_off': return <Clock className="text-amber-600" />;
      case 'capacity_conflict': return <ShieldAlert className="text-rose-600" />;
      case 'failed_notifications': return <AlertCircle className="text-amber-600" />;
      default: return <AlertCircle className="text-slate-600" />;
    }
  };

  const getStyles = () => {
    if (alert.severity === 'high') return "bg-rose-50 border-rose-100 text-rose-900";
    if (alert.severity === 'medium') return "bg-amber-50 border-amber-100 text-amber-900";
    return "bg-slate-50 border-slate-100 text-slate-900";
  };

  return (
    <div className={cn("relative p-5 rounded-3xl border flex items-center justify-between gap-4 transition-all animate-in fade-in slide-in-from-top-1 px-8 pb-4", getStyles())}>
      <div className="flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-sm", alert.severity === 'high' ? 'text-rose-600' : 'text-amber-600')}>
          {getIcon()}
        </div>
        <div>
          <h4 className="text-[14px] font-black tracking-tight">{alert.title}</h4>
          <p className="text-[12px] font-medium opacity-80">{alert.message}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {alert.action_label && (
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className={cn("bg-white hover:bg-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest px-4 h-9 border shadow-sm", 
              alert.severity === 'high' ? 'text-rose-600 border-rose-100' : 'text-amber-600 border-amber-100')}
          >
            <a href={alert.action_url}>{alert.action_label} →</a>
          </Button>
        )}
        <button onClick={onDismiss} className="p-1.5 hover:bg-white/50 rounded-lg transition-colors opacity-40 hover:opacity-100">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

interface AlertBannerZoneProps {
  alerts: any[];
}

export function AlertBannerZone({ alerts }: AlertBannerZoneProps) {
  const [dismissedIndices, setDismissedIndices] = React.useState<number[]>([]);

  if (!alerts || alerts.length === 0) return null;

  const visibleAlerts = alerts.filter((_, i) => !dismissedIndices.includes(i));
  if (visibleAlerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 mb-8">
      {visibleAlerts.slice(0, 3).map((alert, index) => (
        <AlertBanner 
          key={index} 
          alert={alert} 
          onDismiss={() => setDismissedIndices([...dismissedIndices, index])} 
        />
      ))}
      {visibleAlerts.length > 3 && (
        <div className="text-center">
          <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
            Show {visibleAlerts.length - 3} more alerts ↓
          </button>
        </div>
      )}
    </div>
  );
}
