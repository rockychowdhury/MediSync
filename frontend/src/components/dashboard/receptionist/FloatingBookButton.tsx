"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { BookAppointmentModal } from "@/components/dashboard/receptionist/modals/BookAppointmentModal";
import { usePathname } from "next/navigation";

export function FloatingBookButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Don't show on profile page
  if (pathname === "/dashboard/receptionist/profile") {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.3)] hover:bg-blue-700 hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)] transition-all hover:scale-105 active:scale-95 group px-5 py-3.5"
      >
        <div className="bg-white/20 p-1 rounded-full group-hover:rotate-90 transition-transform duration-300">
          <Plus className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm tracking-wide hidden sm:block pr-1">Book Appointment</span>
      </button>

      <BookAppointmentModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          setIsOpen(false);
          // If we are on the queue or appointments page, we should trigger a refresh
          // Since it's a global FAB, the easiest way without complex state is 
          // a soft refresh or using SWR/React Query invalidation.
          // For now, we will just use a window event that pages can listen to.
          window.dispatchEvent(new CustomEvent("appointment_booked"));
        }}
      />
    </>
  );
}
