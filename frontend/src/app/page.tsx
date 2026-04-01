import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/hero-section";
import { ProblemStatement } from "@/components/home/problem-statement";
import { SolutionOverview } from "@/components/home/solution-overview";
import { FeaturesShowcase } from "@/components/home/features-showcase";
import { TechStack } from "@/components/home/tech-stack";
import { UiGallery } from "@/components/home/ui-gallery";
import { SystemCapabilities } from "@/components/home/system-capabilities";
import { ProjectMetrics } from "@/components/home/project-metrics";
import { CtaContact } from "@/components/home/cta-contact";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <ProblemStatement />
        <SolutionOverview />
        <FeaturesShowcase />
        <TechStack />
        <UiGallery />
        <SystemCapabilities />
        <ProjectMetrics />
        <CtaContact />
      </main>
      <Footer />
    </div>
  );
}
