"use client";

import { Textarea } from "@/components/ui/textarea";

export function StepTopic({
  value,
  onChange,
}: {
  value: string;
  onChange: (topic: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-900 mb-2">
          Tema principal
        </h2>
        <p className="text-text-500">
          Descreva o assunto central. Nossa Inteligência Artificial vai estruturar o conteúdo para você.
        </p>
      </div>

      <div className="relative">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ex: fracoes equivalentes em problemas do cotidiano"
          className="min-h-[220px] text-base p-4 resize-none bg-surface-50 focus:bg-white transition-colors"
          maxLength={500}
        />
        <div className="absolute bottom-4 right-4 text-xs font-medium text-text-400">
          {value.length}/500
        </div>
      </div>
    </div>
  );
}
