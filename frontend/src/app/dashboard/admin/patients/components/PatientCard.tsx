import React from "react";
import { MoreVertical, Mail, Phone, Calendar, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PatientCardProps {
  patient: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (patient: any) => void;
  onBook: (patient: any) => void;
  onDeactivate: (patient: any) => void;
}

export function PatientCard({ 
  patient, 
  isSelected, 
  onSelect, 
  onEdit, 
  onBook, 
  onDeactivate 
}: PatientCardProps) {
  const initials = patient.name
    ? patient.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
    : "??";

  const age = patient.date_of_birth 
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() 
    : null;

  return (
    <div 
      onClick={() => onSelect(patient.id)}
      className={cn(
        "group relative p-4 rounded-2xl border transition-all cursor-pointer mb-3 mx-4",
        isSelected 
          ? "bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-100" 
          : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md hover:shadow-slate-100/50"
      )}
    >
      {isSelected && (
        <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-r-full" />
      )}

      <div className="flex items-start gap-4">
        <div className="relative">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all",
            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600"
          )}>
            {initials}
          </div>
          <div className={cn(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
            patient.is_active ? "bg-green-500" : "bg-slate-300"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={cn(
              "font-bold text-[13px] truncate pr-6",
              isSelected ? "text-blue-900" : "text-slate-800"
            )}>
              {patient.name}
            </h4>
            
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger 
                  onClick={(e) => e.stopPropagation()}
                  className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 p-0 rounded-lg hover:bg-slate-100")}
                >
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-100 p-2">
                  <DropdownMenuItem onClick={() => onEdit(patient)} className="rounded-lg">Edit Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBook(patient)} className="rounded-lg">Book Appointment</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDeactivate(patient)} 
                    className={cn("rounded-lg", patient.is_active ? "text-red-600" : "text-blue-600")}
                  >
                    {patient.is_active ? "Deactivate Patient" : "Reactivate Patient"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
               <Phone className="w-3 h-3" />
               <span className="truncate">{patient.phone || "No phone"}</span>
               <span className="text-slate-300">•</span>
               <Mail className="w-3 h-3 ml-0.5" />
               <span className="truncate">{patient.email || "No email"}</span>
            </div>
            
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>
                  {patient.date_of_birth ? format(new Date(patient.date_of_birth), "dd MMM yyyy") : "DOB not set"} 
                  {age && ` (${age} yrs)`}
                </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {patient.notification_opt_out && (
               <Badge variant="outline" className="h-5 px-1.5 bg-amber-50 text-amber-600 border-amber-100 text-[9px] font-black uppercase tracking-wider gap-1">
                 <BellOff className="w-2.5 h-2.5" />
                 Opt-Out
               </Badge>
            )}
            
            {patient.next_appointment && (
              <div className="text-[10px] text-slate-400 italic flex items-center gap-1.5 mt-1">
                <span className="w-1 h-1 rounded-full bg-blue-400" />
                Next: {format(new Date(patient.next_appointment.start), "d MMM")} · {patient.next_appointment.service}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
