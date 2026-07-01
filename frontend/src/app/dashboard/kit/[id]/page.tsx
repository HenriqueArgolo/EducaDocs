"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { fetchLessonKit } from "@/lib/lesson-kit-api";
import type { LessonKit } from "@/lib/lesson-kit";
import { isLessonKitMaterialType, lessonKitMaterialEditorHref } from "@/lib/kit-material-editor";
import { LessonKitHub } from "@/components/lesson-kit/LessonKitHub";

export default function LessonKitPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [kit, setKit] = React.useState<LessonKit | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const requested = searchParams.get("material");

  React.useEffect(() => {
    fetchLessonKit(params.id)
      .then(setKit)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar o kit."));
  }, [params.id]);

  React.useEffect(() => {
    if (kit && isLessonKitMaterialType(requested)) {
      router.replace(lessonKitMaterialEditorHref(kit.sourceDocumentId, kit.id, requested));
    }
  }, [kit, requested, router]);

  if (error) return <div role="alert" className="lesson-kit-page-state"><AlertCircle/>{error}</div>;
  if (!kit || isLessonKitMaterialType(requested)) return <div className="lesson-kit-page-state" aria-live="polite"><LoaderCircle className="animate-spin"/>Carregando material do kit...</div>;
  return <LessonKitHub kit={kit}/>;
}
