"use client";

import React, { useState } from "react";
import { 
  History, 
  ChevronLeft, 
  ChevronRight,
  Mail,
  Calendar,
  Clock,
  ShieldAlert,
  Eye,
  Trash2,
  Lock,
  Unlock,
  Edit3,
  ShieldCheck,
  UserCheck,
  UserX,
  MoreVertical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { usersApi, User } from "@/lib/api/users";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserAuditModal } from "./UserAuditModal";
import { UserDetailsDialog } from "./UserDetailsDialog";
import { EditUserDialog } from "./EditUserDialog";
import { toast } from "sonner";

interface UserTableProps {
  users: User[];
  loading: boolean;
  total: number;
  skip: number;
  limit: number;
  onPageChange: (skip: number) => void;
  onUpdate: () => void;
  roles: { id: number; name: string }[];
}


export function UserTable({
  users,
  loading,
  total,
  skip,
  limit,
  onPageChange,
  onUpdate,
  roles,
}: UserTableProps) {

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleEditAction = (user: User) => {
    setEditUser(user);
    setIsEditDialogOpen(true);
  };

  const toggleStatus = async (user: User) => {
    setIsActionLoading(true);
    try {
      if (user.is_active) {
        await usersApi.deactivateUser(user.id);
        toast.info("Account Suspended", {
          description: `User ${user.name} has been locked from clinical operations.`
        });
      } else {
        await usersApi.activateUser(user.id);
        toast.success("Account Reinstated", {
          description: `User ${user.name} identity has been fully verified and activated.`
        });
      }
      onUpdate();
    } catch (error) {
      console.error("Failed to toggle user status", error);
      toast.error("Security Protocol Error", {
        description: "Failed to update account lifecycle state."
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteSuccess = async () => {
    if (!deleteUserId) return;
    setIsActionLoading(true);
    try {
      await usersApi.deleteUser(deleteUserId);
      toast.success("Identity Purged", {
        description: "Staff record has been successfully removed from the registry."
      });
      onUpdate();
    } catch (error) {
      toast.error("Deletion Failed", {
        description: "Failed to purge identity record from database."
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteUserId(null);
      setIsActionLoading(false);
    }
  };

  const handleAuditAction = (id: string) => {
    setSelectedUserId(id);
    setIsAuditModalOpen(true);
  };

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-500">
      <div className="flex-1 overflow-y-auto no-scrollbar relative [scrollbar-width:thin] scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md">
            <tr className="border-b border-slate-100 h-8">
              <th className="px-6 py-0 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none">Identified Staff</th>
              <th className="px-6 py-0 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none">Security Role</th>
              <th className="px-6 py-0 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none">Account Status</th>
              <th className="px-6 py-0 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none">Authentication Insight</th>
              <th className="px-6 py-0 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] text-right leading-none">Administrative Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user) => (
              <tr 
                key={user.id} 
                className="hover:bg-slate-50/50 transition-all duration-300 group cursor-pointer"
                onClick={() => {
                  setSelectedUser(user);
                  setIsDetailsOpen(true);
                }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400 flex items-center justify-center font-black text-[10px] uppercase border border-slate-200 group-hover:scale-110 transition-transform duration-500">
                      {user.name?.[0] || "U"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-black text-slate-800 tracking-tight leading-none mb-1 group-hover:text-blue-600 transition-colors truncate">{user.name}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center truncate">
                        <Mail className="w-2.5 h-2.5 mr-1 opacity-50" />
                        {user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-2.5">
                  <Badge variant="outline" className="rounded-xl px-2 py-0.5 bg-white border-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                    <ShieldCheck className="w-2.5 h-2.5 text-blue-500" />
                    {user.role_name || "Staff"}
                  </Badge>
                </td>
                <td className="px-6 py-2.5">
                   <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-green-500 shadow-green-100" : "bg-red-400 shadow-red-100"} shadow-lg animate-pulse`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${user.is_active ? "text-green-600" : "text-red-400"}`}>
                        {user.is_active ? "Operational" : "Lockdown"}
                      </span>
                   </div>
                </td>
                <td className="px-6 py-2.5">
                   <div className="space-y-1">
                      <div className="flex items-center text-slate-500 font-bold text-[10px] gap-2">
                         <Clock className="w-3 h-3 text-slate-300" />
                         {user.last_login_at ? format(new Date(user.last_login_at), "MMM d, h:mm a") : "NEVER LOGGED"}
                      </div>
                      <div className="text-[8px] text-slate-300 font-black uppercase tracking-widest flex items-center">
                         <Calendar className="w-2.5 h-2.5 mr-1 opacity-40" />
                         Enroll: {format(new Date(user.created_at), "MMM d, yyyy")}
                      </div>
                   </div>
                </td>
                <td className="px-6 py-2.5 text-right">
                   <div className="flex items-center justify-end gap-1.5 focus-within:z-10 relative">
                    {/* Identity Insight */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger 
                          asChild
                        >
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white border-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5">Identity Insight</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Modify Identity */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger 
                          asChild
                        >
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 transition-all cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAction(user);
                            }}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white border-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5">Modify Profile</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Security Audit */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger 
                          asChild
                        >
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-black text-xs cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAuditAction(user.id);
                            }}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white border-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5">Security Audit</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                     <div className="h-4 w-px bg-slate-100 mx-0.5" />

                    {/* Lifecycle Toggle */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger 
                          asChild
                        >
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className={`h-8 w-8 p-0 rounded-lg transition-all cursor-pointer ${user.is_active ? "text-slate-400 hover:text-orange-600 hover:bg-orange-50/50" : "text-green-500 hover:text-green-700 hover:bg-green-50"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStatus(user);
                            }}
                          >
                            {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white border-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5">
                          {user.is_active ? "Lock Identity" : "Restore Identity"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Purge Identity */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger 
                          asChild
                        >
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteUserId(user.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-rose-600 text-white border-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5">Purge Identity</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                   </div>
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

      {/* ─── Simple Pagination Footer ─────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 bg-slate-50/30 shrink-0">
        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
           Showing {Math.min(skip + 1, total)}–{Math.min(skip + limit, total)} of {total.toLocaleString()} Entries
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(skip - limit)}
            disabled={skip === 0}
            className="h-9 w-9 p-0 rounded-xl border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95 disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="h-9 px-4 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-[11px] font-black text-slate-700 shadow-sm min-w-[70px]">
             {Math.floor(skip / limit) + 1} <span className="mx-2 text-slate-300">/</span> {Math.ceil(total / limit) || 1}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(skip + limit)}
            disabled={skip + limit >= total}
            className="h-9 w-9 p-0 rounded-xl border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95 disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <UserAuditModal 
        userId={selectedUserId}
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      <UserDetailsDialog
        user={selectedUser}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      <EditUserDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        user={editUser}
        roles={roles}
        onUpdate={onUpdate}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-[32px] border-slate-200 p-0 overflow-hidden bg-white shadow-2xl">
          <div className="p-8">
            <AlertDialogHeader>
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <AlertDialogTitle className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">
                Identity Purge Protocol
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] font-medium text-slate-500 leading-relaxed">
                You are about to irreversibly remove this staff identity from the primary clinical registry. All associated credentials will be permanently invalidated.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="flex-1 h-11 rounded-xl font-black text-[9px] uppercase tracking-widest border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition-all m-0 cursor-pointer">
                Abort Deletion
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteSuccess}
                className="flex-1 h-11 rounded-xl font-black text-[9px] uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100 transition-all active:scale-95 m-0 cursor-pointer"
              >
                Confirm Purge
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

