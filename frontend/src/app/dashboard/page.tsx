"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { SmartSuggestion } from "@/components/dashboard/smart-suggestion";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Button } from "@/components/ui/button";
import {
  buildUserStats,
  fetchUserDocuments,
  getCurrentUser,
  getCachedData,
} from "@/lib/api";
import type { AuthUser, DocumentHistoryItem } from "@/lib/types";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const [user, setUser] = React.useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    return getCurrentUser();
  });
  const [documents, setDocuments] = React.useState<DocumentHistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    const cached = getCachedData<DocumentHistoryItem[]>(`/documents/user/${currentUser.id}`);
    return cached ? [...cached].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
  });
  const [isLoading, setIsLoading] = React.useState(() => {
    if (typeof window === "undefined") return true;
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    const cached = getCachedData<DocumentHistoryItem[]>(`/documents/user/${currentUser.id}`);
    return !cached;
  });
  const [error, setError] = React.useState<boolean>(false);

  const loadDocuments = React.useCallback(async () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const cacheKey = `/documents/user/${currentUser.id}`;
    const cached = getCachedData<DocumentHistoryItem[]>(cacheKey);
    if (cached) {
      setDocuments(
        [...cached].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(false);

    try {
      const docs = await fetchUserDocuments(currentUser.id);
      setDocuments(
        [...docs].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadDocuments();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadDocuments]);

  const greeting = getGreeting();
  const hasDocuments = documents.length > 0;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-text-900 mb-2">
          {user ? `${greeting}, ${user.name} 👋` : `${greeting} 👋`}
        </h1>
        <p className="text-lg text-text-400">
          O que você deseja criar hoje?
        </p>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-8 rounded-xl border border-error-500/20 bg-error-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 text-error-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Não foi possível carregar seus documentos. Tente novamente em alguns instantes.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDocuments}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="border-error-500/30 text-error-400 hover:bg-error-500/20"
          >
            Tentar novamente
          </Button>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-surface-100 animate-shimmer" />
            ))}
          </div>
          <div className="h-32 rounded-xl bg-surface-100 animate-shimmer" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-10"
          >
            <QuickActions />
            <SmartSuggestion />

            <RecentDocuments documents={documents} />

            {hasDocuments && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-text-900">Seu impacto</h3>
                </div>
                <StatsCards stats={buildUserStats(documents)} />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
