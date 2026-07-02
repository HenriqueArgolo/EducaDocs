"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PEDAGOGICAL_FUNCTIONS } from "./catalog";

interface OutlineEditorProps {
  outline: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

export function OutlineEditor({ outline, onChange, onAdd, onRemove, onMove }: OutlineEditorProps) {
  return (
    <div>
      <div className="space-y-2" aria-live="polite">
        {outline.map((item, index) => {
          const pedagogicalFunction =
            PEDAGOGICAL_FUNCTIONS[index] ?? (index % 2 === 0 ? "Reflexão" : "Desenvolvimento");
          return (
            <div
              key={`${index}-${outline.length}`}
              data-pedagogical-function={pedagogicalFunction}
              className="group grid min-h-16 grid-cols-[36px_minmax(0,1fr)_88px_44px] items-center gap-2 rounded-2xl border border-surface-200 bg-white px-3 py-2 shadow-sm transition-colors hover:border-primary-200"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-50 text-[11px] font-black text-primary-700">
                {index + 1}
              </span>
              <label className="min-w-0">
                <span className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-text-400">
                  {pedagogicalFunction}
                </span>
                <Input
                  aria-label={`Título do slide ${index + 1}`}
                  value={item}
                  onChange={(event) => onChange(index, event.target.value)}
                  className="h-8 border-0 bg-transparent px-0 text-sm font-bold shadow-none focus-visible:ring-0"
                />
              </label>
              <span className="flex" aria-label={`Mover slide ${index + 1}`}>
                <button
                  type="button"
                  aria-label={`Mover slide ${index + 1} para cima`}
                  disabled={index === 0}
                  onClick={() => onMove(index, -1)}
                  className="grid h-11 w-11 place-items-center rounded-xl text-text-400 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-25"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Mover slide ${index + 1} para baixo`}
                  disabled={index === outline.length - 1}
                  onClick={() => onMove(index, 1)}
                  className="grid h-11 w-11 place-items-center rounded-xl text-text-400 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-25"
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
              <button
                type="button"
                aria-label={`Remover slide ${index + 1}`}
                onClick={() => onRemove(index)}
                className="grid h-11 w-11 place-items-center rounded-xl text-text-400 transition-colors hover:bg-error-50 hover:text-error-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={onAdd}
        leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
        className="mt-3 h-12 w-full rounded-2xl border-dashed bg-white text-primary-700"
      >
        Adicionar slide
      </Button>
    </div>
  );
}
