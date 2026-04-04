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
  MoreHorizontal
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
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Institutional Roles</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {roles.length} System Defined Roles
          </p>
        </div>
        <Button onClick={onAdd} className="h-10 gap-2 font-bold px-4">
          <Plus className="w-4 h-4" />
          Create New Role
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm shadow-slate-100/50">
        <Table>
          <TableHeader className="bg-slate-50/50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional Role</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Policy Description</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Permissions</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Active Users</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id} className="hover:bg-slate-50/30 border-b border-slate-100 last:border-b-0 transition-colors">
                <TableCell className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-[12px] text-slate-400 uppercase tracking-tighter">
                       {role.name[0]}
                    </div>
                    <div className="flex flex-col gap-0.5">
                       <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                         {role.name}
                       </span>
                       <code className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                         ROLE_ID_{role.id}
                       </code>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-6 max-w-xs">
                   <p className="text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                     {role.description || "Primary security boundary defined for active operational role."}
                   </p>
                </TableCell>
                <TableCell className="py-5 px-6 text-center">
                   <Popover>
                      <PopoverTrigger asChild>
                         <Button variant="ghost" className="h-8 gap-2 px-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors group">
                            <span className="text-xs font-black tracking-tight">{role.permission_count || 0}</span>
                            <ShieldCheck className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                         </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0 rounded-xl overflow-hidden shadow-xl" side="bottom" align="center">
                         <div className="bg-slate-50 p-3 border-b border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{role.name} Policy Ledger</p>
                         </div>
                         <ScrollArea className="max-h-60 p-2">
                            <div className="space-y-1">
                               {role.permissions.map((p) => (
                                  <div key={p.id} className="p-2 bg-white rounded-lg border border-slate-50 flex flex-col">
                                     <span className="text-[10px] font-mono font-bold text-slate-700">{p.name}</span>
                                  </div>
                               ))}
                               {role.permissions.length === 0 && (
                                  <p className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase italic">Empty Policy</p>
                               )}
                            </div>
                         </ScrollArea>
                         <div className="p-2 border-top border-slate-100 bg-slate-50">
                            <Button 
                              variant="ghost" 
                              className="w-full h-8 gap-2 text-[10px] font-black uppercase text-indigo-600 hover:bg-white"
                              onClick={() => onManageInMatrix(role)}
                            >
                               Manage in Matrix <ChevronRight className="w-3 h-3" />
                            </Button>
                         </div>
                      </PopoverContent>
                   </Popover>
                </TableCell>
                <TableCell className="py-5 px-6 text-center">
                   <Popover onOpenChange={(open) => open && handleFetchUsers(role.id)}>
                      <PopoverTrigger asChild>
                         <Button variant="ghost" className="h-8 gap-2 px-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors group">
                            <span className="text-xs font-black tracking-tight">{role.user_count || 0}</span>
                            <Users className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                         </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0 rounded-xl overflow-hidden shadow-xl" side="bottom" align="center">
                         <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{role.name} Active Users</p>
                            <History className="w-3.5 h-3.5 text-slate-300" />
                         </div>
                         <ScrollArea className="max-h-60 p-2">
                            <div className="space-y-1">
                               {fetchingUsers === role.id ? (
                                  <div className="flex justify-center py-8">
                                     <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full"
                                     />
                                  </div>
                               ) : roleUsers[role.id]?.map((user) => (
                                  <div key={user.id} className="p-2 bg-white rounded-lg border border-slate-50 flex flex-col group">
                                     <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{user.name}</span>
                                     <span className="text-[9px] text-slate-400 font-mono italic">{user.email}</span>
                                  </div>
                               ))}
                               {!fetchingUsers && roleUsers[role.id]?.length === 0 && (
                                  <p className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase italic">No active users</p>
                               )}
                            </div>
                         </ScrollArea>
                         <div className="p-2 border-top border-slate-100 bg-slate-50">
                            <Link href="/dashboard/admin/users" passHref>
                               <Button variant="ghost" className="w-full h-8 gap-2 text-[10px] font-black uppercase text-emerald-600 hover:bg-white">
                                  Manage Users <ExternalLink className="w-3 h-3" />
                               </Button>
                            </Link>
                         </div>
                      </PopoverContent>
                   </Popover>
                </TableCell>
                <TableCell className="py-5 px-6 text-right">
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-lg">
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                         </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 p-2 rounded-xl">
                         <DropdownMenuItem 
                            onClick={() => onEdit(role)}
                            className="gap-2 p-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer rounded-lg"
                         >
                            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                         </DropdownMenuItem>
                         {isSystemRole(role.name) ? (
                            <div className="gap-2 p-2.5 text-xs font-bold text-slate-300 flex items-center cursor-not-allowed">
                               <Lock className="w-3.5 h-3.5 text-amber-300" /> System Locked
                            </div>
                         ) : (
                            <DropdownMenuItem 
                               onClick={() => onDelete(role)}
                               className="gap-2 p-2.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer rounded-lg"
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
  );
}
