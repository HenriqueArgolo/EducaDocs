"use client";

import { Hero } from "@/components/landing/hero";
import { Benefits } from "@/components/landing/benefits";
import { DemoSection } from "@/components/landing/demo-section";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-surface-0 flex flex-col">
      <Hero />
      <Benefits />
      <DemoSection />
      <Pricing />
      <Footer />
    </main>
  );
}
