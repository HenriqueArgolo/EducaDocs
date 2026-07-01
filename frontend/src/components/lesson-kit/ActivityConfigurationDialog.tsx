"use client";

import * as React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { ActivityGenerationSettings } from "@/lib/lesson-kit-api";

const choices = {
  format: [["MISTA", "Mista"], ["ESCREVER", "Escrever"], ["MARCAR", "Marcar"], ["ASSOCIAR", "Associar"], ["COMPLETAR", "Completar"], ["VERDADEIRO_FALSO", "Verdadeiro ou falso"]],
  purpose: [["PRATICA", "Prática"], ["REVISAO", "Revisão"], ["DIAGNOSTICA", "Diagnóstica"], ["AVALIATIVA", "Avaliativa"]],
  difficulty: [["APOIO", "Apoio"], ["REGULAR", "Regular"], ["DESAFIO", "Desafio"]],
  modality: [["INDIVIDUAL", "Individual"], ["DUPLA", "Dupla"], ["GRUPO", "Grupo"]],
} as const;

export function ActivityConfigurationDialog({busy,onClose,onGenerate}:{busy:boolean;onClose:()=>void;onGenerate:(settings:ActivityGenerationSettings)=>void}) {
  const [settings,setSettings] = React.useState<ActivityGenerationSettings>({activityCount:1,exercisesPerActivity:5,format:"MISTA",purpose:"PRATICA",difficulty:"REGULAR",modality:"INDIVIDUAL"});
  const select = (key:keyof typeof choices,label:string) => <label className="space-y-2 text-sm font-semibold text-text-700"><span>{label}</span><select className="h-11 w-full rounded-xl border border-surface-200 bg-white px-3 focus:ring-2 focus:ring-primary-500" value={settings[key]} onChange={event=>setSettings(current=>({...current,[key]:event.target.value}))}>{choices[key].map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label>;
  return <div className="lesson-kit-modal-backdrop"><section className="lesson-kit-modal max-w-2xl" role="dialog" aria-modal="true" aria-labelledby="activity-config-title"><header><div><span className="lesson-kit-eyebrow"><SlidersHorizontal className="inline h-4 w-4"/> Personalizar geração</span><h2 id="activity-config-title">Monte as atividades para esta turma</h2></div><button onClick={onClose} aria-label="Fechar"><X/></button></header><div className="grid gap-5 p-6 sm:grid-cols-2"><label className="space-y-2 text-sm font-semibold text-text-700"><span>Quantidade de atividades</span><input className="h-11 w-full rounded-xl border border-surface-200 px-3" type="number" min="1" max="10" value={settings.activityCount} onChange={e=>setSettings({...settings,activityCount:Number(e.target.value)})}/><small className="font-normal text-text-500">Cada atividade gera uma folha separada.</small></label><label className="space-y-2 text-sm font-semibold text-text-700"><span>Exercícios por atividade</span><input className="h-11 w-full rounded-xl border border-surface-200 px-3" type="number" min="1" max="20" value={settings.exercisesPerActivity} onChange={e=>setSettings({...settings,exercisesPerActivity:Number(e.target.value)})}/><small className="font-normal text-text-500">Ex.: 5 × 5 = 5 folhas e 25 exercícios.</small></label>{select("format","Formato")}{select("purpose","Finalidade")}{select("difficulty","Dificuldade")}{select("modality","Modalidade")}</div><footer><button onClick={onClose}>Cancelar</button><button className="lesson-kit-save" disabled={busy} onClick={()=>onGenerate(settings)}>{busy?"Gerando…":"Gerar atividades"}</button></footer></section></div>;
}
