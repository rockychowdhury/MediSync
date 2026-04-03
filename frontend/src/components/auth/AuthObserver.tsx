"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import { setCredentials, logoutAction, setLoading } from "@/store/slices/authSlice";
import { authApi } from "@/lib/api/auth";

const PUBLIC_ROUTES = ["/", "/login", "/forgot-password", "/reset-password"];

export function AuthObserver({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    // Only run this verification once per session load
    if (initialized.current) return;
    initialized.current = true;

    async function checkSession() {
      try {
        const response = await authApi.me();
        
        // If successful, the HTTPOnly cookies hold a valid session.
        if (response.data?.data) {
          const { token } = response.data.data;
          const userData = {
            ...response.data.data,
            role: response.data.data.role_name || "receptionist",
          };
          
          dispatch(setCredentials({ user: userData, token }));

          
          // If on a public route but authenticated, redirect to dashboard based on role
          if (PUBLIC_ROUTES.includes(pathname)) {
            const role = userData.role;
            if (role === "admin") router.replace("/dashboard/admin");
            else if (role === "provider") router.replace("/dashboard/provider");
            else if (role === "receptionist") router.replace("/dashboard/receptionist");
            else router.replace("/dashboard");
          }
        }
      } catch (error) {
        // Validation failed (usually 401: cookies absent or expired)
        dispatch(logoutAction());

        // Redirect to login if user is on a protected route
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.replace("/login");
        }
      } finally {
        dispatch(setLoading(false));
      }
    }

    checkSession();
  }, [dispatch, pathname, router]);

  return <>{children}</>;
}
