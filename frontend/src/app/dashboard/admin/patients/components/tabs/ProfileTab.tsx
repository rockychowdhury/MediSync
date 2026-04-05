import React from "react";
import { User, Phone, Mail, Calendar, Info, Shield, Clock, TrendingUp, CheckCircle, XCircle, AlertCircle, Copy } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileTabProps {
  patient: any;
  stats: any;
  onEdit: () => void;
  onToggleNotifications: (val: boolean) => void;
}

export function ProfileTab({ patient, stats, onEdit, onToggleNotifications }: ProfileTabProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("ID copied to clipboard");
  };

  const InfoRow = ({ icon: Icon, label, value, subValue, copyable }: any) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">{label}</p>
        <div className="flex items-center gap-2">
           <p className={cn("text-xs font-bold text-slate-800", copyable && "font-mono")}>{value || "—"}</p>
           {copyable && value && (
             <Button variant="ghost" size="icon" className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(value)}>
               <Copy className="w-3 h-3 text-slate-400" />
             </Button>
           )}
        </div>
        {subValue && <p className="text-[10px] text-slate-400 mt-0.5 italic">{subValue}</p>}
      </div>
    </div>
  );

  const StatCard = ({ label, value, icon: Icon, colorClass, subText }: any) => (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm relative overflow-hidden group">
       <div className={cn("absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity", colorClass)}>
          <Icon size={80} strokeWidth={3} />
       </div>
       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</p>
       <p className={cn("text-2xl font-black", colorClass)}>{value}</p>
       {subText && <p className="text-[10px] text-slate-500 mt-1">{subText}</p>}
    </div>
  );

  return (
    <div className="p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column: Info Sections */}
        <div className="space-y-10">
          <section>
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <Info className="w-4 h-4 text-blue-500" />
                 Personal Information
               </h3>
               <Button variant="outline" size="sm" onClick={onEdit} className="h-8 rounded-lg border-slate-100 text-[10px] font-bold text-slate-600 px-4">EDIT</Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <InfoRow icon={User} label="Full Name" value={patient.name} />
              <InfoRow icon={Phone} label="Phone Number" value={patient.phone} />
              <InfoRow icon={Mail} label="Email Address" value={patient.email} />
              <InfoRow 
                icon={Calendar} 
                label="Date of Birth" 
                value={patient.date_of_birth ? format(new Date(patient.date_of_birth), "dd MMMM yyyy") : "Not set"} 
                subValue={patient.date_of_birth && `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years old`}
              />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Shield className="w-4 h-4 text-slate-400" />
              Account Settings
            </h3>
            <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-2">
              <InfoRow icon={Clock} label="Account Status" value={patient.is_active ? "● Active" : "○ Inactive"} />
              <div className="flex items-center justify-between p-4 group">
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                       <Shield className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                       <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Appointment Reminders</p>
                       <p className="text-xs font-bold text-slate-800">
                          {patient.notification_opt_out ? "🔕 Opted Out" : "🔔 Receiving Reminders"}
                       </p>
                    </div>
                 </div>
                 <Switch 
                  checked={!patient.notification_opt_out} 
                  onCheckedChange={(checked) => onToggleNotifications(!checked)} 
                  className="data-[state=checked]:bg-blue-600"
                 />
              </div>
              <InfoRow icon={Info} label="Internal Patient ID" value={patient.id} copyable />
            </div>
          </section>
        </div>

        {/* Right Column: Stats Section */}
        <div className="space-y-10">
          <section>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Clinical Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard 
                 label="Total VISITS" 
                 value={stats?.total_appointments || "0"} 
                 icon={Calendar} 
                 colorClass="text-blue-600"
                 subText={`${stats?.total_hours || "0"} clinic hours total`}
              />
              <StatCard 
                 label="Completion Rate" 
                 value={`${stats?.completion_rate || "0"}%`} 
                 icon={CheckCircle} 
                 colorClass="text-green-600"
              />
              <StatCard 
                label="Cancellations" 
                value={stats?.cancelled_count || "0"} 
                icon={XCircle} 
                colorClass="text-red-600"
              />
              <StatCard 
                label="No-Show Frequency" 
                value={stats?.no_show_count || "0"} 
                icon={AlertCircle} 
                colorClass="text-amber-600"
                subText={stats?.no_show_rate ? `${stats.no_show_rate}% miss rate` : "0% miss rate"}
              />
            </div>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden">
             <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl" />
             <p className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] mb-4">Activity Timeline</p>
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                   <p className="text-xs text-slate-400">First recorded visit: <span className="text-white font-bold">{stats?.first_visit ? format(new Date(stats.first_visit), "dd MMM yyyy") : "N/A"}</span></p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                   <p className="text-xs text-slate-400">Most recent unit interaction: <span className="text-white font-bold">{stats?.last_visit ? format(new Date(stats.last_visit), "dd MMM yyyy") : "N/A"}</span></p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                   <p className="text-xs text-slate-400">Record created: <span className="text-white font-bold">{patient.created_at ? format(new Date(patient.created_at), "dd MMM yyyy") : "N/A"}</span></p>
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
