"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logoutAction } from "@/store/slices/authSlice";
import { authApi } from "@/lib/api/auth";
import { 
  LayoutDashboard, Users, Calendar, Clock, Activity, 
  Settings, LogOut, Menu, X, ChevronDown, Bell, Search, 
  FileText, BriefcaseMedical
} from "lucide-react";
import Image from "next/image";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import MediSyncLogo from "@/components/common/MediSyncLogo";

interface NavItem {
  name: string;
  href: string;
  icon: any; // Allow for Lucide component flexibility
  exact?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}



// Re-map the icons and generic labels based on dashboard.md exact tab lists
// Structural grouping for a more professional, tiered navigation
const ADMIN_NAV: NavGroup[] = [
  {
    group: "Core",
    items: [
      { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard, exact: true },
    ]
  },
  {
    group: "Operations",
    items: [
      { name: "Appointments", href: "/dashboard/admin/appointments", icon: Calendar },
      { name: "Patients", href: "/dashboard/admin/patients", icon: Users },
      { name: "Providers", href: "/dashboard/admin/providers", icon: Users },
      { name: "Services & Specializations", href: "/dashboard/admin/services", icon: BriefcaseMedical },
      { name: "Waitlist", href: "/dashboard/admin/waitlist", icon: Clock },
    ]
  },
  {
    group: "Governance",
    items: [
      { name: "Workforce Identity", href: "/dashboard/admin/users", icon: Users },
      { name: "Access Governance", href: "/dashboard/admin/rbac", icon: BriefcaseMedical },
      { name: "Audit Log", href: "/dashboard/admin/audit", icon: Activity },
    ]
  }
];

const RECEPTIONIST_NAV: NavGroup[] = [
  {
    group: "Core",
    items: [
      { name: "Queue", href: "/dashboard/receptionist", icon: LayoutDashboard, exact: true },
    ]
  },
  {
    group: "Operations",
    items: [
      { name: "Appointments", href: "/dashboard/receptionist/appointments", icon: Calendar },
      { name: "Patients", href: "/dashboard/receptionist/patients", icon: Users },
      { name: "Waitlist", href: "/dashboard/receptionist/waitlist", icon: Clock },
    ]
  }
];

const PROVIDER_NAV: NavGroup[] = [
  {
    group: "Core",
    items: [
      { name: "Schedule", href: "/dashboard/provider", icon: Calendar, exact: true },
    ]
  },
  {
    group: "Operations",
    items: [
      { name: "Availability", href: "/dashboard/provider/availability", icon: Clock },
    ]
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const user = useSelector((state: RootState) => state.auth.user);
  
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center gap-1">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Authenticating</h2>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Securing your session</p>
        </div>
      </div>
    );
  }


  const role = user.role?.toLowerCase() || "receptionist";
  let navGroups = RECEPTIONIST_NAV;
  if (role === "admin") navGroups = ADMIN_NAV;
  else if (role === "provider") navGroups = PROVIDER_NAV;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Backend logout failed:", error);
    } finally {
      dispatch(logoutAction());
      router.push("/login");
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#eef3f8] flex p-0 sm:p-2 lg:p-3 font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-all duration-500" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main OS-like Window Container */}
      <div className="flex-1 flex overflow-hidden lg:rounded-[32px] lg:shadow-[0_20px_50px_rgba(0,0,0,0.1)] lg:ring-1 lg:ring-slate-200/50 bg-[#FAFAFA] flex-col lg:flex-row relative">
        
        {/* Modernized Sidebar */}
        <aside 
          className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white lg:bg-[#f8fafc]/50 lg:backdrop-blur-xl lg:border-r border-slate-200/60 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col pt-8 pb-8 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Enhanced Workspace Switcher */}
          <div className="px-6 mb-10">
            <button className="flex items-center space-x-3.5 group p-2.5 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all duration-300 w-full text-left outline-none">
              <div className="shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ease-out">
                <MediSyncLogo size={42} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block font-bold text-[14px] text-slate-800 leading-tight truncate">
                  MediSync
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>
          </div>

          {/* Grouped Navigation Items */}
          <nav className="flex-1 px-4 space-y-8 overflow-y-auto hidden-scrollbar">
            {navGroups.map((group) => (
              <div key={group.group} className="space-y-2">
                <h3 className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400/80 mb-3">
                  {group.group}
                </h3>
                <div className="space-y-1">
                  {group.items.map((link) => {
                    // Exact match for 'Core' items to avoid redundant highlights
                    const isActive = link.exact 
                      ? pathname === link.href 
                      : pathname === link.href || pathname.startsWith(link.href + '/');
                    
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={`flex items-center px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 relative group truncate ${
                          isActive 
                            ? "bg-white text-indigo-600 shadow-[0_4px_12px_rgba(0,0,0,0.03)] ring-1 ring-slate-200/50" 
                            : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
                        }`}
                      >
                        {/* Active Indicator Bar */}
                        {isActive && (
                          <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full shadow-[2px_0_8px_rgba(79,70,229,0.4)]" />
                        )}
                        
                        <Icon className={`w-4 h-4 mr-3 transition-all duration-300 ${
                          isActive 
                            ? "text-indigo-600 scale-110" 
                            : "text-slate-400 group-hover:text-slate-600 group-hover:scale-105"
                          }`} 
                        />
                        <span className="flex-1 truncate">{link.name}</span>
                        
                        {!isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Utility Controls */}
          <div className="px-4 mt-auto pt-6 space-y-1.5 border-t border-slate-100">
            <Link href={`/dashboard/${role}/profile`} className="flex items-center px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm ring-1 ring-transparent hover:ring-slate-100 transition-all duration-300 group">
              <FileText className="w-4 h-4 mr-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              Documentation
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group border border-transparent hover:border-red-100">
              <LogOut className="w-4 h-4 mr-3 text-slate-400 group-hover:text-red-500 transition-colors" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA] lg:rounded-r-[24px]">
          
          {/* Top Navbar / Search Bar matching UI */}
          <header className="h-[72px] flex items-center justify-between px-6 lg:px-10 z-10 flex-shrink-0 pt-4">
            
            <div className="flex items-center flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-slate-800 mr-4 p-2 -ml-2 rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Floating Search Bar */}
              <div className="hidden sm:flex items-center flex-1 max-w-sm mr-auto bg-[#f1f3f5] rounded-full px-4 py-2 ring-1 ring-transparent focus-within:ring-slate-300 focus-within:bg-white transition-all duration-200 relative">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search your database..." 
                  className="bg-transparent border-none outline-none text-sm w-full font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                />
                <span className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 ml-2 bg-white">
                  ⌘K
                </span>
              </div>
            </div>

            {/* Right Side Header Items */}
            <div className="flex items-center space-x-2">
              <button className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                <div className="w-4 h-2.5 rounded-full bg-slate-300 relative flex items-center p-0.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </button>
              <button className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 relative transition-colors">
                <Bell className="w-[18px] h-[18px]" />
                <span className="absolute top-[6px] right-[6px] w-[6px] h-[6px] bg-red-500 rounded-full border border-white"></span>
              </button>
              <button className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                <div className="w-[18px] h-[18px] border-[1.5px] border-slate-500 rounded-sm flex items-center justify-center">
                  <span className="text-xs font-bold leading-none">+</span>
                </div>
              </button>
              
              <div className="h-4 w-px bg-slate-200 mx-2"></div>
              
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 cursor-pointer">
                {/* Fallback to initials if no image */}
                <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
              </div>
            </div>
          </header>

          {/* Dynamic Page Content Render */}
          <main className="flex-1 overflow-y-auto px-6 lg:px-10 pb-6 w-full custom-scrollbar">
            {/* Fully bound the nested wrappers to 100% available viewport height */}
            <div className="max-w-[1400px] w-full h-full mx-auto relative isolate pt-2">
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </div>

          </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
