"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpenCheck, ClipboardCheck, Download, Eye, FileCheck2, FileText, RefreshCw, Shapes, SlidersHorizontal } from "lucide-react";
import type { LessonKit, LessonKitMaterial, LessonKitMaterialType } from "@/lib/lesson-kit";
import { kitReadiness, lessonKitMaterials } from "@/lib/lesson-kit";
import { downloadLessonKitMaterial, regenerateLessonKitMaterial } from "@/lib/lesson-kit-api";
import type { ActivityGenerationSettings } from "@/lib/lesson-kit-api";
import { lessonKitMaterialEditorHref } from "@/lib/kit-material-editor";
import { ActivityConfigurationDialog } from "@/components/lesson-kit/ActivityConfigurationDialog";

const icons: Record<LessonKitMaterialType, typeof FileText> = {
  LESSON_PLAN: BookOpenCheck,
  STUDENT_ACTIVITY: Shapes,
  TEACHER_ANSWER_KEY: FileCheck2,
  ASSESSMENT: ClipboardCheck,
  PEDAGOGICAL_EVIDENCE: Eye,
  INCLUSIVE_ADAPTATIONS: FileText,
};

export function LessonKitHub({ kit: initialKit }: { kit: LessonKit }) {
  const [kit, setKit] = React.useState(initialKit);
  const [activityToConfigure, setActivityToConfigure] = React.useState<LessonKitMaterial | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const replace = (material: LessonKitMaterial) => {
    setKit((current) => ({
      ...current,
      materials: current.materials.map((item) => item.type === material.type ? material : item),
    }));
  };

  async function regenerate(material: LessonKitMaterial) {
    if (!confirm("Regenerar somente este material? Os outros materiais serão preservados.")) return;
    setBusy(true);
    setError(null);
    try {
      replace(await regenerateLessonKitMaterial(kit.id, material.type));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível regenerar.");
    } finally {
      setBusy(false);
    }
  }

  async function generateConfiguredActivity(settings: ActivityGenerationSettings) {
    if (!activityToConfigure) return;
    setBusy(true);
    setError(null);
    try {
      replace(await regenerateLessonKitMaterial(kit.id, activityToConfigure.type, settings));
      setActivityToConfigure(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar as atividades.");
    } finally {
      setBusy(false);
    }
  }

  async function download(material: LessonKitMaterial) {
    setBusy(true);
    setError(null);
    try {
      const label = lessonKitMaterials.find((item) => item.type === material.type)?.label ?? "Material do kit";
      await downloadLessonKitMaterial(kit.id, material.type, `${kit.topic} - ${label}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível baixar o material.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="lesson-kit-shell">
    <header className="lesson-kit-hero"><div className="lesson-kit-hero-orb" aria-hidden="true"/><span className="lesson-kit-eyebrow">Kit de aula semanal · {kitReadiness(kit)}</span><h1>{kit.topic}</h1><p>Da preparação à evidência pedagógica: tudo organizado, editável e pronto para sua turma.</p><div className="lesson-kit-meta">{kit.grade&&<span>{kit.grade}</span>}{kit.subject&&<span>{kit.subject}</span>}<span>{kit.status==="READY"?"Kit completo":"Em preparação"}</span></div></header>
    <div className="lesson-kit-heading"><div><span>Central pedagógica</span><h2>Materiais do kit</h2></div><strong>{kitReadiness(kit)}</strong></div>
    {error&&<p role="alert" className="lesson-kit-error-inline">{error}</p>}
    <section className="lesson-kit-grid">{lessonKitMaterials.map((definition)=>{const material=kit.materials.find((item)=>item.type===definition.type);const Icon=icons[definition.type];const ready=material?.status==="READY";return <article key={definition.type} className={`lesson-kit-card ${definition.type==="LESSON_PLAN"?"lesson-kit-card-featured":""}`}><div className="lesson-kit-card-top"><span className="lesson-kit-icon"><Icon aria-hidden="true"/></span><span className={`lesson-kit-status lesson-kit-status-${material?.status?.toLowerCase()}`}>{ready?"Pronto":material?.status==="FAILED"?"Falhou":"Preparando"}</span></div><h3>{definition.label}</h3><p>{definition.description}</p>{definition.type==="LESSON_PLAN"&&<div className="lesson-kit-paper" aria-hidden="true"><i/><i/><i/></div>}{definition.type==="STUDENT_ACTIVITY"&&<button className="lesson-kit-save min-h-11 w-full" onClick={()=>material&&setActivityToConfigure(material)} disabled={!ready||busy}><SlidersHorizontal aria-hidden="true"/> Configurar atividade</button>}<div className="lesson-kit-actions">{ready&&material?<Link href={lessonKitMaterialEditorHref(kit.sourceDocumentId,kit.id,definition.type)}>{definition.type==="LESSON_PLAN"?"Abrir plano":"Abrir"}</Link>:<button disabled>Abrir</button>}<button className="lesson-kit-action-quiet" onClick={()=>material&&regenerate(material)} disabled={busy||definition.type==="LESSON_PLAN"||definition.type==="STUDENT_ACTIVITY"||!ready}><RefreshCw aria-hidden="true"/> Regenerar</button><button onClick={()=>material&&download(material)} className="lesson-kit-icon-button" aria-label={`Baixar ${definition.label}`} disabled={!ready||busy}><Download aria-hidden="true"/></button></div></article>})}</section>
    {activityToConfigure&&<ActivityConfigurationDialog busy={busy} onClose={()=>setActivityToConfigure(null)} onGenerate={generateConfiguredActivity}/>} 
  </div>;
}
