"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedLabel: string;
  setSelectedLabel: (label: string) => void;
  placeholder: string;
  setPlaceholder: (placeholder: string) => void;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

export function Select({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState("");
  const [placeholder, setPlaceholder] = React.useState("");

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        open,
        setOpen,
        selectedLabel,
        setSelectedLabel,
        placeholder,
        setPlaceholder,
      }}
    >
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be used within Select");

  return (
    <button
      type="button"
      onClick={() => context.setOpen(!context.open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-text-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200" style={{ transform: context.open ? 'rotate(180deg)' : 'none' }} />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within Select");

  React.useEffect(() => {
    if (placeholder) {
      context.setPlaceholder(placeholder);
    }
  }, [placeholder]);

  return (
    <span className={cn("block truncate text-left", !context.selectedLabel && "text-text-400")}>
      {context.selectedLabel || context.placeholder}
    </span>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectContent must be used within Select");

  if (!context.open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-surface-200 bg-white p-1 shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  className,
  value,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be used within Select");

  const isSelected = context.value === value;

  React.useEffect(() => {
    if (isSelected) {
      context.setSelectedLabel(String(children));
    }
  }, [isSelected, children]);

  return (
    <div
      onClick={() => {
        context.onValueChange(value);
        context.setSelectedLabel(String(children));
        context.setOpen(false);
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 px-3 text-sm text-text-800 outline-none hover:bg-slate-50 transition-colors",
        isSelected && "bg-primary-50 text-primary-600 font-medium hover:bg-primary-50",
        className
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
    </div>
  );
}
