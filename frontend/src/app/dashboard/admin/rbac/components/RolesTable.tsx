"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight,
  ExternalLink,
  History,
  Lock,
  MoreHorizontal,
  Fingerprint
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Role, UserSimple } from "@/lib/api/rbac";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { motion } from "framer-motion";

interface RolesTableProps {
  roles: Role[];
  onAdd: () => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onManageInMatrix: (role: Role) => void;
  fetchUsers: (roleId: number) => Promise<UserSimple[]>;
}

export function RolesTable({
  roles,
  onAdd,
  onEdit,
  onDelete,
  onManageInMatrix,
  fetchUsers,
}: RolesTableProps) {
  const [fetchingUsers, setFetchingUsers] = useState<number | null>(null);
  const [roleUsers, setRoleUsers] = useState<Record<number, UserSimple[]>>({});

  const handleFetchUsers = async (roleId: number) => {
    if (roleUsers[roleId]) return;
    setFetchingUsers(roleId);
    const users = await fetchUsers(roleId);
    setRoleUsers((prev) => ({ ...prev, [roleId]: users }));
    setFetchingUsers(null);
  };

  const isSystemRole = (name: string) => ["admin", "receptionist", "provider"].includes(name.toLowerCase());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Institutional Roles</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {roles.length} System Defined Roles
          </p>
        </div>
        <Button onClick={onAdd} className="h-9 gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-sm active:scale-95 transition-all">
          <Plus className="w-3.5 h-3.5" />
          Create New Role
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm shadow-slate-100/50">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/95 backdrop-blur z-20 border-b border-slate-200 sticky top-0">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-4 pl-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[300px]">Institutional Role</TableHead>
                <TableHead className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Policy Description</TableHead>
                <TableHead className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Permissions</TableHead>
                <TableHead className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Active Users</TableHead>
                <TableHead className="py-4 pr-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} className="hover:bg-slate-50/50 border-b border-slate-50 last:border-b-0 transition-all group h-[72px]">
                  <TableCell className="py-4 pl-8">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center text-[12px] font-black uppercase shrink-0 shadow-sm transition-transform group-hover:scale-105">
                         {role.name[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[14px] font-bold text-slate-800 leading-tight uppercase tracking-tight">
                           {role.name}
                         </span>
                         <div className="flex items-center gap-1.5 mt-1">
                            <Fingerprint className="w-2.5 h-2.5 text-slate-300" />
                            <code className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
                              SEC_ID_{role.id}
                            </code>
                         </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 max-w-xs">
                     <p className="text-[13px] leading-relaxed text-slate-500 font-medium line-clamp-1">
                       {role.description || "Institutional security boundary defined for active operational role."}
                     </p>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-center">
                     <Popover>
                        <PopoverTrigger>
                           <Button variant="outline" className="h-8 gap-2 px-3 rounded-xl border-slate-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all group/btn shadow-none">
                              <span className="text-[11px] font-bold tracking-tight">{role.permission_count || 0}</span>
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-indigo-500 transition-colors" />
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0 rounded-2xl overflow-hidden shadow-2xl border-slate-100 animate-in zoom-in-95 duration-200" side="bottom" align="center">
                           <div className="bg-slate-900 p-3.5 border-b border-white/10">
                              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{role.name} Policy Ledger</p>
                           </div>
                           <ScrollArea className="max-h-64 p-3 bg-white">
                              <div className="space-y-1.5">
                                 {role.permissions.map((p) => (
                                    <div key={p.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group/item hover:bg-white hover:border-indigo-100 transition-all">
                                       <span className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-tighter">{p.name}</span>
                                       <Lock className="w-3 h-3 text-slate-300 group-hover/item:text-indigo-400" />
                                    </div>
                                 ))}
                                 {role.permissions.length === 0 && (
                                    <div className="py-8 flex flex-col items-center justify-center gap-2">
                                       <ShieldCheck className="w-6 h-6 text-slate-200" />
                                       <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Zero Policy Mapping</p>
                                    </div>
                                 )}
                              </div>
                           </ScrollArea>
                           <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 backdrop-blur">
                              <Button 
                                variant="ghost" 
                                className="w-full h-9 gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-white hover:shadow-sm transition-all rounded-xl"
                                onClick={() => onManageInMatrix(role)}
                              >
                                 Manage in Matrix <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                           </div>
                        </PopoverContent>
                     </Popover>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-center">
                     <Popover onOpenChange={(open) => open && handleFetchUsers(role.id)}>
                        <PopoverTrigger>
                           <Button variant="outline" className="h-8 gap-2 px-3 rounded-xl border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all group/btn shadow-none">
                              <span className="text-[11px] font-bold tracking-tight">{role.user_count || 0}</span>
                              <Users className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-emerald-500 transition-colors" />
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0 rounded-2xl overflow-hidden shadow-2xl border-slate-100 animate-in zoom-in-95 duration-200" side="bottom" align="center">
                           <div className="bg-emerald-900 p-3.5 border-b border-white/10 flex justify-between items-center">
                              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{role.name} Personnel</p>
                              <History className="w-3.5 h-3.5 text-white/30" />
                           </div>
                           <ScrollArea className="max-h-64 p-3 bg-white">
                              <div className="space-y-1.5">
                                 {fetchingUsers === role.id ? (
                                    <div className="flex justify-center py-10">
                                       <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                 ) : roleUsers[role.id]?.map((user) => (
                                    <div key={user.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col group/user hover:bg-white hover:border-emerald-200 transition-all">
                                       <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{user.name}</span>
                                       <span className="text-[9px] text-slate-500 font-mono italic mt-0.5">{user.email}</span>
                                    </div>
                                 ))}
                                 {!fetchingUsers && roleUsers[role.id]?.length === 0 && (
                                    <div className="py-8 flex flex-col items-center justify-center gap-2">
                                       <Users className="w-6 h-6 text-slate-200" />
                                       <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No Institutional Assignments</p>
                                    </div>
                                 )}
                              </div>
                           </ScrollArea>
                           <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 backdrop-blur">
                              <Link href="/dashboard/admin/users" passHref>
                                 <Button variant="ghost" className="w-full h-9 gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-white hover:shadow-sm transition-all rounded-xl">
                                    Manage Registry <ExternalLink className="w-3.5 h-3.5" />
                                 </Button>
                              </Link>
                           </div>
                        </PopoverContent>
                     </Popover>
                  </TableCell>
                  <TableCell className="py-4 pr-8 text-right">
                     <DropdownMenu>
                        <DropdownMenuTrigger>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-xl group-hover:scale-105 transition-transform">
                              <MoreHorizontal className="w-4 h-4 text-slate-400" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 p-2 rounded-xl shadow-xl border-slate-100">
                           <DropdownMenuItem 
                              onClick={() => onEdit(role)}
                              className="gap-2.5 p-2.5 text-xs font-bold text-slate-700 hover:text-indigo-600 cursor-pointer rounded-lg transition-colors"
                           >
                              <Edit2 className="w-3.5 h-3.5" /> Update Portfolio
                           </DropdownMenuItem>
                           {isSystemRole(role.name) ? (
                              <div className="gap-2.5 p-2.5 text-xs font-bold text-slate-300 flex items-center bg-slate-50/50 mt-1 rounded-lg">
                                 <Lock className="w-3.5 h-3.5 text-amber-400" /> System Protected
                              </div>
                           ) : (
                              <DropdownMenuItem 
                                 onClick={() => onDelete(role)}
                                 className="gap-2.5 p-2.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer rounded-lg transition-colors"
                              >
                                 <Trash2 className="w-3.5 h-3.5" /> Decommission
                              </DropdownMenuItem>
                           )}
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
