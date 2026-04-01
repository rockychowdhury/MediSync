import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, Calendar, Users, Shield, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background pt-16 md:pt-24 lg:pt-32 pb-16 md:pb-24">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl preserve-3d"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-accent/5 blur-3xl preserve-3d"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl">
            <div className="inline-flex items-center space-x-2 rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <span>MediSync v2.0 is now live</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight mb-8 text-foreground animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              Healthcare Scheduling <br className="hidden md:block" />
              <span className="text-gradient-primary">Reimagined</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              Intelligent appointment management, seamless patient flow, and powerful provider utilization tools for modern clinics.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              <Link href="/#contact">
                <Button size="lg" className="gradient-primary w-full sm:w-auto text-lg h-12 px-8">
                  Request Demo <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-12 px-8">
                  Platform Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Preview Section */}
        <section className="py-20 bg-muted/50 border-y border-border" id="features">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-heading font-bold mb-4 text-foreground">Everything you need to run your clinic</h2>
              <p className="text-lg text-muted-foreground">Purpose-built tools designed specifically for the complex workflows of modern healthcare facilities.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="bg-background rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2 text-foreground">Smart Scheduling</h3>
                <p className="text-muted-foreground text-sm">Automated booking and conflict resolution to maximize provider time.</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-background rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2 text-foreground">Patient Portal</h3>
                <p className="text-muted-foreground text-sm">Self-service booking, intake forms, and appointment reminders.</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-background rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2 text-foreground">Queue Management</h3>
                <p className="text-muted-foreground text-sm">Real-time waiting room analytics and digital patient tracking.</p>
              </div>

              {/* Feature 4 */}
              <div className="bg-background rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2 text-foreground">HIPAA Compliant</h3>
                <p className="text-muted-foreground text-sm">Enterprise-grade security and full regulatory compliance built-in.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
