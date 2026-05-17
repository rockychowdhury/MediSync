"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import type { RootState } from "@/store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (allowedRoles && user && user.role && !allowedRoles.includes(user.role)) {
        // Fallback to their specific dashboard if unauthorized
        if (user.role === "admin") router.replace("/dashboard/admin");
        else if (user.role === "provider") router.replace("/dashboard/provider");
        else router.replace("/dashboard/receptionist");
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || (allowedRoles && user && user.role && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
