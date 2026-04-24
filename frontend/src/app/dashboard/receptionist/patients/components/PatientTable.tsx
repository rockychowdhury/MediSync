"use client";

import { useState } from "react";
import { format, differenceInYears } from "date-fns";
import { Phone, Mail, User, ChevronLeft, ChevronRight, Activity, BellOff } from "lucide-react";
import { SkeletonRows } from "@/components/dashboard/receptionist/SkeletonRows";

interface Patient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  notification_opt_out?: boolean;
  is_active: boolean;
}

interface PatientTableProps {
  patients: Patient[];
  isLoading: boolean;
  searchQuery: string;
  onViewDetails: (id: string) => void;
  onBookAppointment: (id: string) => void;
}

export function PatientTable({
  patients,
  isLoading,
  searchQuery,
  onViewDetails,
  onBookAppointment,
}: PatientTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (isLoading) {
    return (
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-4">
        <SkeletonRows rows={10} columns={7} />
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          {searchQuery ? `No patients found for "${searchQuery}"` : "No patient records yet"}
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          {searchQuery 
            ? "Check the spelling or create a new patient record." 
            : "Create the first patient record to get started."}
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(patients.length / itemsPerPage);
  const currentData = patients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDOB = (dob?: string) => {
    if (!dob) return "N/A";
    try {
      const date = new Date(dob);
      const age = differenceInYears(new Date(), date);
      return `${format(date, "d MMM yyyy")} (${age} yrs)`;
    } catch {
      return dob;
    }
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      <div className="w-full overflow-x-auto hidden-scrollbar">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Date of Birth</th>
              <th className="py-3 px-4 text-center">Notifications</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((patient) => (
              <tr 
                key={patient.id} 
                className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-3 px-4 font-bold text-slate-900">{patient.name}</td>
                <td className="py-3 px-4">
                  {patient.phone ? (
                    <a href={`tel:${patient.phone}`} className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600">
                      <Phone className="w-3 h-3" />
                      {patient.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs">None</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {patient.email ? (
                    <a href={`mailto:${patient.email}`} className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 truncate max-w-[150px]">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{patient.email}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs">None</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600">{formatDOB(patient.date_of_birth)}</td>
                <td className="py-3 px-4 text-center">
                  {patient.notification_opt_out ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                      <BellOff className="w-3 h-3" /> Off
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600">
                      <Activity className="w-3 h-3" /> On
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {patient.is_active ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200">Inactive</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap space-x-3">
                  <button 
                    onClick={() => onViewDetails(patient.id)}
                    className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    View / Edit
                  </button>
                  <button 
                    onClick={() => onBookAppointment(patient.id)}
                    className="text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Book Appointment
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 p-4 flex items-center justify-between bg-white">
        <div className="text-xs text-slate-500 font-medium">
          Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, patients.length)} of {patients.length} patients
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-200 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-700 px-2">Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-slate-200 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
