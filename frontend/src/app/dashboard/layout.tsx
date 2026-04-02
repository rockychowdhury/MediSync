"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logoutAction } from "@/store/slices/authSlice";
import { 
  LayoutDashboard, Users, Calendar, Clock, Activity, 
  Settings, LogOut, Menu, X, ChevronDown, Bell, Search, 
  FileText, BriefcaseMedical
} from "lucide-react";
import Image from "next/image";

// Re-map the icons and generic labels based on dashboard.md exact tab lists
const ADMIN_LINKS = [
  { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { name: "Appointments", href: "/dashboard/admin/appointments", icon: Calendar },
  { name: "Patients", href: "/dashboard/admin/patients", icon: Users },
  { name: "Providers & Services", href: "/dashboard/admin/providers", icon: BriefcaseMedical },
  { name: "Waitlist", href: "/dashboard/admin/waitlist", icon: Clock },
  { name: "Users & Roles", href: "/dashboard/admin/users", icon: Users },
  { name: "Audit Log", href: "/dashboard/admin/audit", icon: Activity },
];

const RECEPTIONIST_LINKS = [
  { name: "Today's Queue", href: "/dashboard/receptionist", icon: LayoutDashboard },
  { name: "Appointments", href: "/dashboard/receptionist/appointments", icon: Calendar },
  { name: "Patients", href: "/dashboard/receptionist/patients", icon: Users },
  { name: "Waitlist", href: "/dashboard/receptionist/waitlist", icon: Clock },
];

const PROVIDER_LINKS = [
  { name: "My Schedule", href: "/dashboard/provider", icon: Calendar },
  { name: "Availability", href: "/dashboard/provider/availability", icon: Clock },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const user = useSelector((state: RootState) => state.auth.user);
  
  if (!user) {
    return <div className="min-h-screen bg-[#f7f8f9] flex items-center justify-center">Loading...</div>;
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
    <div className="min-h-screen bg-[#eef1f5] flex p-0 sm:p-2 lg:p-4 font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main OS-like Window Container (imitating the screenshot borders) */}
      <div className="flex-1 flex overflow-hidden lg:rounded-[24px] lg:shadow-xl lg:ring-1 lg:ring-slate-900/5 bg-[#FAFAFA] flex-col lg:flex-row relative">
        
        {/* Sidebar */}
        <aside 
          className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#f5f6f8] lg:bg-transparent lg:border-r border-slate-200/60 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col pt-6 pb-6 shadow-2xl lg:shadow-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Workspace / Dropdown Header matching UI */}
          <div className="px-6 mb-8 flex justify-between items-center">
            <button className="flex items-center space-x-3 group w-full text-left">
              <div className="w-8 h-8 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center font-bold text-sm tracking-tighter">
                {user.full_name ? user.full_name[0].toUpperCase() : 'M'}
              </div>
              <span className="font-semibold text-[15px] text-slate-800 flex-1 truncate group-hover:text-black transition-colors">
                MediSync Workspace
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto hidden-scrollbar">
            {navLinks.map((link) => {
              // Exact match or active nested routes safely
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center px-4 py-2.5 rounded-[10px] text-[14px] font-medium transition-all duration-200 relative group ${
                    isActive 
                      ? "bg-[#eaeaec] text-slate-900 shadow-sm" 
                      : "text-slate-500 hover:bg-[#eeeff1] hover:text-slate-800"
                  }`}
                >
                  {/* Subtle active state styling to match UI reference */}
                  <Icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? "text-slate-700" : "text-slate-400 group-hover:text-slate-500"}`} />
                  <span className="flex-1">{link.name}</span>
                  {isActive && (
                    <span className="absolute left-0 w-1 h-5 bg-slate-400 rounded-r-md opacity-0"></span> // Opt out of this specific indicator, relying just on bg
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Footer Links */}
          <div className="px-4 mt-auto pt-6 space-y-1 border-t-0">
            <Link href={`/dashboard/${role}/profile`} className="flex items-center px-4 py-2.5 rounded-[10px] text-[14px] font-medium text-slate-500 hover:bg-[#eeeff1] hover:text-slate-800 transition-all duration-200">
              <FileText className="w-4 h-4 mr-3 text-slate-400" />
              Documentation
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center px-4 py-2.5 rounded-[10px] text-[14px] font-medium text-slate-500 hover:bg-[#eeeff1] hover:text-red-600 transition-all duration-200 group">
              <Settings className="w-4 h-4 mr-3 text-slate-400 group-hover:text-red-500 transition-colors" />
              Settings / Logout
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
          <main className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10">
            {/* Limit max width nicely for huge screens but keep fluid for desktop */}
            <div className="max-w-[1400px] w-full mx-auto relative isolate pt-4">
              {children}
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
