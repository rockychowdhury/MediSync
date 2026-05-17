"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store/index";
import { setUser } from "@/store/slices/authSlice";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { toast } from "sonner";
import { Loader2, User, Mail, Shield, Lock, Save, Camera } from "lucide-react";
import apiClient from "@/lib/api/client";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Populate form from Redux auth state
  useEffect(() => {
    if (user) {
      setName(user.name || user.full_name || "");
      setEmail(user.email || "");
      setRole(user.role || user.role_name || "receptionist");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSavingProfile(true);
    try {
      const res = await apiClient.put("/profile/me", { name: name.trim() });
      if (res.data?.success) {
        toast.success("Profile updated successfully");
        // Update Redux state
        dispatch(setUser({ user: { ...user!, name: name.trim() } }));
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { toast.error("Enter your current password"); return; }
    if (newPassword.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    
    setSavingPassword(true);
    try {
      const res = await apiClient.put("/profile/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (res.data?.success) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pb-12">
      <div className="shrink-0 mb-6">
        <PageHeader 
          breadcrumbs={["Home", "Reception", "Profile"]} 
          title="My Profile"
          description="Manage your personal information and account settings."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
        {/* Left: Avatar Card */}
        <DashboardCard className="p-6 flex flex-col items-center text-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg">
              {name.charAt(0).toUpperCase()}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{name}</h3>
            <p className="text-sm text-slate-500">{email}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold capitalize border border-blue-200">
            <Shield className="w-3 h-3" />
            {role}
          </div>

          <div className="w-full border-t border-slate-100 pt-4 mt-2 space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Status</span>
              <span className="font-bold text-emerald-600">{user.is_active ? "Active" : "Inactive"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Last Login</span>
              <span className="font-bold text-slate-700 text-xs">{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "N/A"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Joined</span>
              <span className="font-bold text-slate-700 text-xs">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </DashboardCard>

        {/* Right: Forms */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Personal Info */}
          <DashboardCard className="p-6 space-y-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </DashboardCard>

          {/* Change Password */}
          <DashboardCard className="p-6 space-y-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              Change Password
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl shadow-md shadow-amber-500/20 disabled:opacity-50 hover:bg-amber-700 transition-colors"
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
