import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { AuthObserver } from "@/components/auth/AuthObserver";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "MediSync — Smart Healthcare Scheduling",
    template: "%s | MediSync",
  },
  description:
    "A full-stack appointment management system that helps clinics optimize provider schedules, reduce no-shows, and streamline patient care through intelligent queue management.",
  icons: {
    icon: "/logo.png",
  },
  keywords: [
    "healthcare",
    "appointment management",
    "scheduling",
    "queue management",
    "provider utilization",
    "MediSync",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ReduxProvider>
          <AuthObserver>
            {children}
          </AuthObserver>
        </ReduxProvider>
      </body>
    </html>
  );
}
