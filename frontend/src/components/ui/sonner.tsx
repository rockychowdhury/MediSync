"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      richColors
      expand={false}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-3.5" />
        ),
        info: (
          <InfoIcon className="size-3.5" />
        ),
        warning: (
          <TriangleAlertIcon className="size-3.5" />
        ),
        error: (
          <OctagonXIcon className="size-3.5" />
        ),
        loading: (
          <Loader2Icon className="size-3.5 animate-spin" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:px-4 group-[.toaster]:py-2 group-[.toaster]:min-h-[52px]",
          description: "group-[.toast]:text-slate-500 group-[.toast]:text-[11px] group-[.toast]:font-medium group-[.toast]:mt-0.5",
          title: "group-[.toast]:text-[13px] group-[.toast]:font-black group-[.toast]:tracking-tight group-[.toast]:leading-none",
          actionButton: "group-[.toast]:bg-indigo-600 group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-900",
          success: "group-[.toaster]:!bg-emerald-50 group-[.toaster]:!border-emerald-100 group-[.toaster]:!text-emerald-900",
          error: "group-[.toaster]:!bg-rose-50 group-[.toaster]:!border-rose-100 group-[.toaster]:!text-rose-900",
          warning: "group-[.toaster]:!bg-amber-50 group-[.toaster]:!border-amber-100 group-[.toaster]:!text-amber-900",
          info: "group-[.toaster]:!bg-blue-50 group-[.toaster]:!border-blue-100 group-[.toaster]:!text-blue-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
