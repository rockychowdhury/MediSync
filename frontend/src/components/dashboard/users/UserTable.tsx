"use client";

import React, { useState } from "react";
import { 
  MoreVertical, 
  Edit3, 
  Lock, 
  Unlock, 
  History, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Clock,
  ShieldAlert
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { usersApi, User } from "@/lib/api";
import { UserAuditDrawer } from "./UserAuditDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserTableProps {
  users: User[];
  loading: boolean;
  total: number;
  skip: number;
  limit: number;
  onPageChange: (skip: number) => void;
  onUpdate: () => void;
}

export function UserTable({
  users,
  loading,
  total,
  skip,
  limit,
  onPageChange,
  onUpdate,
}: UserTableProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  const toggleStatus = async (user: User) => {
    try {
      if (user.is_active) await usersApi.deactivateUser(user.id);
      else await usersApi.activateUser(user.id);
      onUpdate();
    } catch (error) {
      console.error("Failed to toggle user status", error);
    }
  };

  const handleAuditAction = (id: string) => {
    setSelectedUserId(id);
    setIsAuditDrawerOpen(true);
  };

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identified Staff</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Role</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authentication Insight</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Administrative Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400 flex items-center justify-center font-black text-xs uppercase border border-slate-200 group-hover:scale-110 transition-transform duration-500">
                      {user.name?.[0] || "U"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-slate-800 tracking-tight leading-none mb-1 group-hover:text-blue-600 transition-colors">{user.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center">
                        <Mail className="w-3 h-3 mr-1.5 opacity-50" />
                        {user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <Badge variant="outline" className="rounded-xl px-3 py-1 bg-white border-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                    <ShieldCheck className="w-3 h-3 text-blue-500" />
                    {user.role_name || "Staff Identity"}
                  </Badge>
                </td>
                <td className="px-8 py-5">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.is_active ? "bg-green-500 shadow-green-100" : "bg-red-400 shadow-red-100"} shadow-lg animate-pulse`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${user.is_active ? "text-green-600" : "text-red-400"}`}>
                        {user.is_active ? "Verified Operational" : "Protocol Lockdown"}
                      </span>
                   </div>
                </td>
                <td className="px-8 py-5">
                   <div className="space-y-1.5">
                      <div className="flex items-center text-slate-500 font-bold text-[11px] gap-2">
                         <Clock className="w-3.5 h-3.5 text-slate-300" />
                         {user.last_login_at ? format(new Date(user.last_login_at), "MMM d, h:mm a") : "NEVER LOGGED"}
                      </div>
                      <div className="text-[9px] text-slate-300 font-black uppercase tracking-widest flex items-center">
                         <Calendar className="w-3 h-3 mr-1.5 opacity-40" />
                         Registry Enroll: {format(new Date(user.created_at), "MMM d, yyyy")}
                      </div>
                   </div>
                </td>
                <td className="px-8 py-5 text-right">
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:shadow-xl transition-all text-slate-300 hover:text-slate-600">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-200 shadow-2xl p-2 bg-white">
                        <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 leading-tight">Administrative Controls</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-50" />
                        <DropdownMenuItem className="rounded-xl px-3 py-2.5 font-bold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-3">
                           <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                           Modify Identity
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleAuditAction(user.id)}
                          className="rounded-xl px-3 py-2.5 font-bold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-3"
                        >
                           <History className="w-3.5 h-3.5 text-amber-500" />
                           View Security Audit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-50" />
                        <DropdownMenuItem 
                          onClick={() => toggleStatus(user)}
                          className={`rounded-xl px-3 py-2.5 font-bold text-xs cursor-pointer flex items-center gap-3 ${user.is_active ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                        >
                           {user.is_active ? (
                             <><Lock className="w-3.5 h-3.5" /> Suspend Credentials</>
                           ) : (
                             <><Unlock className="w-3.5 h-3.5" /> Reinstate Credentials</>
                           )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
               <tr>
                <td colSpan={5} className="py-32 text-center">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 border border-dashed border-slate-200">
                      <ShieldAlert className="w-8 h-8 text-slate-200" />
                   </div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">No Identity Records Detected in Registry</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Structured Pagination Component */}
      <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-3">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Operational Ledger Page {currentPage} of {totalPages || 1}
            </span>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
              {total} Identity Units Enrolled
            </span>
         </div>
         
         <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              disabled={skip === 0 || loading}
              onClick={() => onPageChange(skip - limit)}
              className="h-11 px-5 rounded-xl border-slate-200 bg-white shadow-sm font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95 disabled:opacity-50"
            >
               <ChevronLeft className="w-4 h-4 mr-2" />
               Identified Prev
            </Button>
            <Button 
              variant="outline"
              disabled={skip + limit >= total || loading}
              onClick={() => onPageChange(skip + limit)}
              className="h-11 px-5 rounded-xl border-slate-200 bg-white shadow-sm font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95 disabled:opacity-50"
            >
               Identified Next
               <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
         </div>
      </div>

      <UserAuditDrawer 
        userId={selectedUserId}
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
      />
    </div>
  );
}
