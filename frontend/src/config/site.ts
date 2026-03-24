export const siteConfig = {
  name: "MediSync",
  description:
    "A full-stack appointment management system that helps clinics optimize provider schedules, reduce no-shows, and streamline patient care through intelligent queue management.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  apiTimeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  links: {
    github: "https://github.com/rockychowdhury/MediSync",
  },
  demo: {
    email: process.env.NEXT_PUBLIC_DEMO_EMAIL || "demo@medisync.com",
    password: process.env.NEXT_PUBLIC_DEMO_PASSWORD || "Demo@123",
  },
} as const;

export type SiteConfig = typeof siteConfig;
