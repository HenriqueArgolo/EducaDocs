"use client";

import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 p-4 md:max-w-md pointer-events-none">
      <AnimatePresence>
        {toasts.map(({ id, title, description, variant }) => {
          const isDestructive = variant === "destructive";
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-md pointer-events-auto ${
                isDestructive
                  ? "border-red-200 bg-red-50/90 text-red-900"
                  : "border-slate-200 bg-white/90 text-slate-900"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isDestructive ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
              </div>
              <div className="flex-grow space-y-1">
                {title && <p className="text-sm font-bold leading-none">{title}</p>}
                {description && <p className="text-xs opacity-90">{description}</p>}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
