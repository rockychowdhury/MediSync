"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "@/lib/api/auth";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { setCredentials } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Shield, ClipboardList, Stethoscope, ArrowRight, Eye, EyeOff, LayoutDashboard } from "lucide-react";

type TabValue = "demo" | "login";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState<TabValue>("demo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [lastClickedRole, setLastClickedRole] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur"
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(data);
      const { token } = response.data.data;
      const meResponse = await authApi.me();
      if (meResponse.data?.data) {
        let role = meResponse.data.data.role_name || "receptionist";
        const userData = { ...meResponse.data.data, role };
        dispatch(setCredentials({ user: userData, token }));

        if (role === "admin") router.replace("/dashboard/admin");
        else if (role === "provider") router.replace("/dashboard/provider");
        else if (role === "receptionist") router.replace("/dashboard/receptionist");
        else router.replace("/dashboard");
      }
    } catch (err: any) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (role: string, email: string, pass: string) => {
    setLastClickedRole(role);
    // Switch completely to the login form tab
    setActiveTab("login");
    // Pre-fill the form credentials automatically
    setValue("email", email, { shouldValidate: true });
    setValue("password", pass, { shouldValidate: true });

    // Clear lastClicked visual state after animation
    setTimeout(() => setLastClickedRole(null), 800);
  };

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-500 flex flex-col pt-10">

      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 font-heading tracking-tight">Access Platform</h1>
        <p className="text-[15px] font-medium text-slate-500">Choose demonstration access or sign in to your account.</p>
      </div>

      {/* Custom Tabs Switcher */}
      <div className="bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-[14px] flex w-full mb-8 shadow-inner border border-slate-200/50">
        <button
          onClick={() => setActiveTab("demo")}
          className={`flex-1 flex items-center justify-center space-x-2 relative py-2.5 rounded-[10px] text-sm font-semibold transition-all duration-300 ${activeTab === "demo" ? "bg-white text-slate-900 shadow-sm border border-slate-200/60 font-bold" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
        >
          <LayoutDashboard className={`w-4 h-4 ${activeTab === "demo" ? "text-indigo-600" : ""}`} />
          <span>Demo Access</span>
        </button>
        <button
          onClick={() => setActiveTab("login")}
          className={`flex-1 flex items-center justify-center space-x-2 relative py-2.5 rounded-[10px] text-sm font-semibold transition-all duration-300 ${activeTab === "login" ? "bg-white text-slate-900 shadow-sm border border-slate-200/60 font-bold" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
        >
          <Shield className={`w-4 h-4 ${activeTab === "login" ? "text-blue-600" : ""}`} />
          <span>Manual Login</span>
        </button>
      </div>

      {/* Tab Panes */}
      <div className="relative w-full h-full min-h-[360px]">

        {/* --- DEMO TAB --- */}
        {activeTab === "demo" && (
          <div className="animate-in slide-in-from-left-4 fade-in duration-300">
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-600 mb-6 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                To explore the capabilities of this system without an account, please click one of the interactive simulated roles below.
              </p>

              {/* Admin Role */}
              <button
                type="button"
                onClick={() => handleDemoClick('admin', 'admin@medisync.com', 'admin1234')}
                className={`flex items-center w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-100/50 bg-white ${lastClickedRole === 'admin' ? 'border-indigo-600 ring-4 ring-indigo-50 scale-[0.98]' : 'border-slate-100 hover:-translate-y-1'}`}
              >
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center mr-4 group-hover:bg-indigo-600 transition-colors">
                  <Shield className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <span className="block text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">Admin Portal</span>
                  <span className="block text-xs font-medium text-slate-500 mt-0.5">Full system oversight & configuration</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 bg-slate-50 group-hover:bg-indigo-50 w-8 h-8 rounded-full p-1.5 transform group-hover:translate-x-1 transition-all" />
              </button>

              {/* Receptionist Role */}
              <button
                type="button"
                onClick={() => handleDemoClick('receptionist', 'receptionist@gmail.com', 'shahin567')}
                className={`flex items-center w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100/50 bg-white ${lastClickedRole === 'receptionist' ? 'border-blue-600 ring-4 ring-blue-50 scale-[0.98]' : 'border-slate-100 hover:-translate-y-1'}`}
              >
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mr-4 group-hover:bg-blue-600 transition-colors">
                  <ClipboardList className="w-6 h-6 text-blue-600 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <span className="block text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Front Desk Operations</span>
                  <span className="block text-xs font-medium text-slate-500 mt-0.5">Manage live waitlist & appointments</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 bg-slate-50 group-hover:bg-blue-50 w-8 h-8 rounded-full p-1.5 transform group-hover:translate-x-1 transition-all" />
              </button>

              {/* Provider Role */}
              <button
                type="button"
                onClick={() => handleDemoClick('provider', 'provider@gmail.com', 'shahin567')}
                className={`flex items-center w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:border-teal-500 hover:shadow-lg hover:shadow-teal-100/50 bg-white ${lastClickedRole === 'provider' ? 'border-teal-600 ring-4 ring-teal-50 scale-[0.98]' : 'border-slate-100 hover:-translate-y-1'}`}
              >
                <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center mr-4 group-hover:bg-teal-600 transition-colors">
                  <Stethoscope className="w-6 h-6 text-teal-600 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <span className="block text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Medical Provider</span>
                  <span className="block text-xs font-medium text-slate-500 mt-0.5">Control individual queue & charts</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-teal-600 bg-slate-50 group-hover:bg-teal-50 w-8 h-8 rounded-full p-1.5 transform group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        )}

        {/* --- LOGIN TAB --- */}
        {activeTab === "login" && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-50/80 border border-red-200 text-red-700 text-sm font-semibold animate-in shake flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-2 shrink-0"></div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-slate-700 font-bold text-[14px]">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className={`h-12 bg-white rounded-xl focus-visible:ring-blue-600 shadow-sm border-slate-200 transition-colors text-[15px] px-4 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : 'hover:border-slate-300'}`}
                  disabled={loading}
                  {...register("email")}
                />
                {errors.email && <p className="text-xs font-semibold text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2.5 relative">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 font-bold text-[14px]">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`h-12 bg-white rounded-xl focus-visible:ring-blue-600 shadow-sm border-slate-200 pr-12 transition-colors text-[15px] px-4 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : 'hover:border-slate-300'}`}
                    disabled={loading}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-all"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs font-semibold text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <div className="flex items-center space-x-3 pt-1 pb-3">
                <Checkbox id="remember" className="h-4 w-4 rounded-[4px] border-slate-300 text-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <label
                  htmlFor="remember"
                  className="text-sm font-semibold text-slate-600 leading-none cursor-pointer"
                >
                  Keep me signed in
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-[15px] rounded-xl font-bold shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 text-white transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  "Sign In Securely"
                )}
              </Button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
