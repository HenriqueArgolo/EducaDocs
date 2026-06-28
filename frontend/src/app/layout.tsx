import type { Metadata, Viewport } from "next";
import { Noise } from "@/components/ui/patterns";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduDocs AI - Documentos pedagogicos com BNCC validada",
  description:
    "Gere plano de aula, prova, rubrica e relatorio usando habilidades BNCC reais validadas pela API.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EduDocs AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground relative">
        <Noise />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
