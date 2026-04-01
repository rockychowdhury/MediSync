"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logoutAction } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, Users, Calendar, Clock, Activity, 
  Settings, LogOut, Menu, X, ChevronRight, UserCircle, Bell
} from "lucide-react";
import MediSyncLogo from "@/components/common/MediSyncLogo";

const ADMIN_LINKS = [
  { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { name: "Providers", href: "/dashboard/admin/providers", icon: Users },
  { name: "System Logs", href: "/dashboard/admin/logs", icon: Activity },
  { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

const PROVIDER_LINKS = [
  { name: "My Schedule", href: "/dashboard/provider", icon: Calendar },
  { name: "Patient Queue", href: "/dashboard/provider/queue", icon: Users },
  { name: "Time Off", href: "/dashboard/provider/time-off", icon: Clock },
];

const RECEPTIONIST_LINKS = [
  { name: "Appointments", href: "/dashboard/receptionist", icon: Calendar },
  { name: "Waitlist", href: "/dashboard/receptionist/waitlist", icon: Clock },
  { name: "Patients", href: "/dashboard/receptionist/patients", icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const user = useSelector((state: RootState) => state.auth.user);
  
  if (!user) {
    // If somehow reached without auth, layout will render blank briefly until AuthObserver strictly boots them
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  const role = user.role?.toLowerCase() || "receptionist";
  
  let navLinks = RECEPTIONIST_LINKS;
  if (role === "admin") navLinks = ADMIN_LINKS;
  else if (role === "provider") navLinks = PROVIDER_LINKS;

  const handleLogout = () => {
    dispatch(logoutAction());
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100 flex-shrink-0">
          <Link href={`/dashboard/${role}`} className="flex items-center space-x-2 text-blue-600">
            <MediSyncLogo size={28} />
            <span className="font-heading font-bold tracking-tight text-xl text-slate-900">MediSync</span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-slate-500 hover:text-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col flex-1 overflow-y-auto">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">
            {role} Portal
          </div>
          
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-4 flex-shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 text-slate-400 group-hover:text-red-600" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 flex-shrink-0 shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-800 mr-4"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">
              {navLinks.find(l => pathname === l.href || pathname.startsWith(l.href + '/'))?.name || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-slate-400 hover:text-slate-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-slate-700 leading-none mb-1">{user.full_name}</span>
                <span className="text-xs text-slate-500 capitalize leading-none">{role}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                {user.full_name ? user.full_name[0].toUpperCase() : <UserCircle className="w-6 h-6"/>}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
