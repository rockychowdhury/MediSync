"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";

// Inline validation for simple single-field form
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur"
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(data.email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full animate-in fade-in zoom-in-95 duration-500 pt-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-blue-50/50">
          <MailCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4 font-heading tracking-tight">Check your email</h1>
        <p className="text-[15px] font-medium text-slate-500 mb-8 max-w-sm">
          We've sent password reset instructions to your email address. If an account exists, you will receive it shortly.
        </p>
        <Link href="/login" className="w-full">
          <Button className="w-full h-12 text-[15px] rounded-xl font-bold shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pt-10">
      
      <Link href="/login" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to login
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 font-heading tracking-tight">Reset Password</h1>
        <p className="text-[15px] font-medium text-slate-500">
          Enter your registered email address and we'll send you instructions to reset your password.
        </p>
      </div>

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

        <Button 
          type="submit" 
          className="w-full h-12 text-[15px] rounded-xl font-bold shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 disabled:opacity-70" 
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending verification email...
            </span>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>
    </div>
  );
}
