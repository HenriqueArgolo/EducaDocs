"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Presentation,
  Users,
} from "lucide-react";
import { clearSession } from "@/lib/api";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/dashboard" },
  { icon: FileText, label: "Meus documentos", href: "/dashboard/documents" },
  { icon: PlusCircle, label: "Criar documento", href: "/dashboard/new" },
  { icon: BookOpen, label: "Biblioteca", href: "/dashboard/library" },
  { icon: Presentation, label: "Apresentações", href: "/dashboard/slides" },
  { icon: Users, label: "Minhas Turmas", href: "/dashboard/classrooms" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <aside className="w-64 bg-surface-100 border-r border-surface-200 hidden md:flex flex-col h-screen sticky top-0 print:hidden">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="bg-primary-600 p-1.5 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-text-900">
            EduDocs<span className="text-primary-500">.ai</span>
          </span>
        </Link>
      </div>

      <div className="px-4 pb-6">
        <Link
          href="/dashboard/new"
          className="flex items-center justify-center gap-2 bg-primary-600 text-white rounded-lg p-3 font-semibold shadow-md hover:bg-primary-700 transition-colors w-full"
        >
          <PlusCircle className="w-5 h-5" />
          Novo documento
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <motion.div
          className="text-xs font-semibold text-text-400 uppercase tracking-wider mb-2 ml-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          Sistema
        </motion.div>
        {navItems.map((item, i) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
            >
              <Link href={item.href} className="block relative">
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary-500/20 rounded-lg -z-10 border border-primary-500/30"
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "text-primary-400 font-bold"
                      : "text-text-400 hover:text-text-100 hover:bg-surface-200"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary-400" : "text-text-400"
                    )}
                  />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-200">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-colors text-error-400 hover:bg-error-500/10 hover:text-error-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Sair</span>
        </button>
      </div>
    </aside>
  );
}
