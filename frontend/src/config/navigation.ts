import {
  LayoutDashboard,
  CalendarDays,
  CalendarPlus,
  Users,
  UserPlus,
  Stethoscope,
  ClipboardList,
  ListOrdered,
  BarChart3,
  Activity,
  CalendarClock,
  Calendar,
  Settings,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Admin navigation menu */
export const adminNavigation: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Key metrics and quick actions",
      },
    ],
  },
  {
    label: "Appointments",
    items: [
      {
        title: "Appointments",
        href: "/appointments",
        icon: CalendarDays,
        description: "View and manage all appointments",
      },
      {
        title: "Queue Management",
        href: "/queue",
        icon: ListOrdered,
        description: "Manage waitlist queue",
      },
      {
        title: "Schedule",
        href: "/schedule",
        icon: CalendarClock,
        description: "Calendar view of appointments",
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        title: "Providers",
        href: "/admin/providers",
        icon: Stethoscope,
        description: "Manage healthcare providers",
      },
      {
        title: "Services",
        href: "/admin/services",
        icon: ClipboardList,
        description: "Configure medical services",
      },
      {
        title: "Users",
        href: "/admin/users",
        icon: Users,
        description: "Manage system users",
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        title: "Reports",
        href: "/admin/reports",
        icon: BarChart3,
        description: "Analytics and reports",
      },
      {
        title: "Activity Logs",
        href: "/admin/activity-logs",
        icon: Activity,
        description: "System activity audit trail",
      },
    ],
  },
];

/** Receptionist navigation menu */
export const receptionistNavigation: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Appointments",
    items: [
      {
        title: "Appointments",
        href: "/appointments",
        icon: CalendarDays,
      },
      {
        title: "Create Appointment",
        href: "/appointments/create",
        icon: CalendarPlus,
      },
      {
        title: "Queue Management",
        href: "/queue",
        icon: ListOrdered,
      },
      {
        title: "Schedule",
        href: "/schedule",
        icon: CalendarClock,
      },
    ],
  },
];

/** Provider navigation menu */
export const providerNavigation: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "My Work",
    items: [
      {
        title: "My Schedule",
        href: "/provider/my-schedule",
        icon: Calendar,
      },
      {
        title: "My Appointments",
        href: "/provider/my-appointments",
        icon: CalendarDays,
      },
      {
        title: "Availability",
        href: "/provider/availability",
        icon: Settings,
      },
      {
        title: "Statistics",
        href: "/provider/statistics",
        icon: BarChart3,
      },
    ],
  },
];

/** Get navigation based on user role */
export function getNavigationByRole(role: string): NavGroup[] {
  switch (role) {
    case "admin":
      return adminNavigation;
    case "receptionist":
      return receptionistNavigation;
    case "provider":
      return providerNavigation;
    default:
      return [];
  }
}
