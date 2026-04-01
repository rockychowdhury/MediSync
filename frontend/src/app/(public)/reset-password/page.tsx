"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, EyeOff, Eye, AlertCircle } from "lucide-react";

// Validation for setting new password
const resetPasswordSchema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur"
  });

  // Verify token exists on mount
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing password reset token. Please request a new link.");
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(token, data.new_password);
      setSuccess(true);
      // Automatically redirect after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full animate-in fade-in pt-10 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">Link Expired or Invalid</h1>
        <p className="text-[15px] font-medium text-slate-500 mb-8 max-w-sm">
          The password reset token is missing or invalid. Please submit a new password reset request.
        </p>
        <Link href="/forgot-password" className="w-full">
          <Button className="w-full h-12 text-[15px] rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all">
            Request New Link
          </Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full animate-in zoom-in-95 duration-500 pt-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50/50">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4 font-heading tracking-tight">Password Reset Successfully</h1>
        <p className="text-[15px] font-medium text-slate-500 mb-8 max-w-sm">
          Your account password has been safely updated. You can now login with your new credentials. Redirecting...
        </p>
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="w-full animate-in slide-in-from-bottom-4 duration-500 pt-10">
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 font-heading tracking-tight">Create New Password</h1>
        <p className="text-[15px] font-medium text-slate-500">
          Your new password must be different from previous used passwords.
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50/80 border border-red-200 text-red-700 text-sm font-semibold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* New Password */}
        <div className="space-y-2.5 relative">
          <Label htmlFor="new_password" className="text-slate-700 font-bold text-[14px]">New Password</Label>
          <div className="relative">
            <Input 
              id="new_password" 
              type={showPassword ? "text" : "password"}
              placeholder="••••••••" 
              className={`h-12 bg-white rounded-xl focus-visible:ring-blue-600 shadow-sm border-slate-200 pr-12 transition-colors text-[15px] px-4 ${errors.new_password ? 'border-red-500' : 'hover:border-slate-300'}`}
              disabled={loading}
              {...register("new_password")}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-all"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
            </button>
          </div>
          {errors.new_password && <p className="text-xs font-semibold text-red-500 mt-1">{errors.new_password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2.5">
          <Label htmlFor="confirm_password" className="text-slate-700 font-bold text-[14px]">Confirm Password</Label>
          <Input 
            id="confirm_password" 
            type={showPassword ? "text" : "password"}
            placeholder="••••••••" 
            className={`h-12 bg-white rounded-xl focus-visible:ring-blue-600 shadow-sm border-slate-200 transition-colors text-[15px] px-4 ${errors.confirm_password ? 'border-red-500' : 'hover:border-slate-300'}`}
            disabled={loading}
            {...register("confirm_password")}
          />
          {errors.confirm_password && <p className="text-xs font-semibold text-red-500 mt-1">{errors.confirm_password.message}</p>}
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-[15px] rounded-xl font-bold shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 disabled:opacity-70" 
          disabled={loading || !!error}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Resetting Password...
            </span>
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>
    </div>
  );
}
