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
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md">
            <tr className="border-b border-slate-100 h-10">
              <th className="px-8 py-0 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Identified Staff</th>
              <th className="px-8 py-0 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Security Role</th>
              <th className="px-8 py-0 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Account Status</th>
              <th className="px-8 py-0 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Authentication Insight</th>
              <th className="px-8 py-0 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right leading-none">Administrative Operations</th>
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
                <td className="px-8 py-2.5">
                  <Badge variant="outline" className="rounded-xl px-3 py-1 bg-white border-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                    <ShieldCheck className="w-3 h-3 text-blue-500" />
                    {user.role_name || "Staff Identity"}
                  </Badge>
                </td>
                <td className="px-8 py-2.5">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.is_active ? "bg-green-500 shadow-green-100" : "bg-red-400 shadow-red-100"} shadow-lg animate-pulse`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${user.is_active ? "text-green-600" : "text-red-400"}`}>
                        {user.is_active ? "Verified Operational" : "Protocol Lockdown"}
                      </span>
                   </div>
                </td>
                <td className="px-8 py-2.5">
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
                <td className="px-8 py-2.5 text-right">
                   <div className="flex items-center justify-end gap-1.5 focus-within:z-10 relative">
                    {/* Identity Insight */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger 
                          render={
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          }
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDetailsOpen(true);
                          }}
                        />
                        <TooltipContent className="bg-slate-900 text-white border-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5">Identity Insight</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Modify Identity */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger 
                          render={
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                          }
                          onClick={() => handleEditAction(user)}
                        />
                        <TooltipContent className="bg-slate-900 text-white border-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5">Modify Profile</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Security Audit */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger 
                          render={
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-black text-xs"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </Button>
                          }
                          onClick={() => handleAuditAction(user.id)}
                        />
                        <TooltipContent className="bg-slate-900 text-white border-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5">Security Audit</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                     <div className="h-4 w-px bg-slate-100 mx-0.5" />

                    {/* Lifecycle Toggle */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger 
                          render={
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className={`h-8 w-8 p-0 rounded-lg transition-all ${user.is_active ? "text-slate-400 hover:text-orange-600 hover:bg-orange-50/50" : "text-green-500 hover:text-green-700 hover:bg-green-50"}`}
                            >
                              {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </Button>
                          }
                          onClick={() => toggleStatus(user)}
                        />
                        <TooltipContent className="bg-slate-900 text-white border-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5">
                          {user.is_active ? "Lock Identity" : "Restore Identity"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Purge Identity */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger 
                          render={
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          }
                          onClick={() => {
                            setDeleteUserId(user.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        />
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
            className="h-9 w-9 p-0 rounded-xl border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95 disabled:opacity-30"
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
            className="h-9 w-9 p-0 rounded-xl border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95 disabled:opacity-30"
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
        <AlertDialogContent className="rounded-3xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
               <div className="p-2 bg-rose-50 rounded-xl">
                  <Trash2 className="w-5 h-5 text-rose-500" />
               </div>
               Identity Purge Protocol
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 mt-2">
              You are about to irreversibly remove this staff identity from the primary clinical registry. All associated credentials will be permanently invalidated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-2">
            <AlertDialogCancel className="rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-100 hover:bg-slate-50">Abort Registry Deletion</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSuccess}
              className="rounded-xl font-black text-[10px] uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100"
            >
               Confirm Identity Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

