"use client";

import { useState, useEffect } from "react";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

type ToastOptions = Omit<ToastProps, "id">;

type Listener = (toasts: ToastProps[]) => void;
let memoryToasts: ToastProps[] = [];
let listeners: Listener[] = [];

function emitChange() {
  listeners.forEach((listener) => listener([...memoryToasts]));
}

export function toast(options: ToastOptions) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastProps = { ...options, id };
  memoryToasts.push(newToast);
  emitChange();

  // Auto-remove after 4 seconds
  setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
    emitChange();
  }, 4000);

  return id;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>(memoryToasts);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  return {
    toasts,
    toast,
  };
}
