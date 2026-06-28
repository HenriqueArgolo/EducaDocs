import * as React from "react";
import Link from "next/link";
import { FileText, Menu, PlusCircle } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-surface-50 print:block print:bg-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-surface-200 bg-surface-0 flex items-center justify-between px-4 md:hidden sticky top-0 z-10 print:hidden">
            <div className="flex items-center gap-2">
              <Menu className="w-6 h-6 text-text-600" />
              <span className="font-bold text-lg text-text-900">EduDocs.ai</span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard/documents"
                className="p-2 rounded-md text-text-600 hover:bg-surface-100"
                aria-label="Meus documentos"
              >
                <FileText className="w-5 h-5" />
              </Link>
              <Link
                href="/dashboard/new"
                className="p-2 rounded-md text-primary-600 hover:bg-primary-50"
                aria-label="Novo documento"
              >
                <PlusCircle className="w-5 h-5" />
              </Link>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-y-auto print:block print:p-0 print:overflow-visible">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
