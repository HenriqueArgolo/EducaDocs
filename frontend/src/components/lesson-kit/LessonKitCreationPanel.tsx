"use client";
import * as React from "react";
import { ArrowRight, Check, FileCheck2, LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { createLessonKit } from "@/lib/lesson-kit-api";
const outputs=["Atividade","Gabarito","Avaliação","Evidências","Adaptações"];
export function LessonKitCreationPanel({documentId}:{documentId:number}){
 const router=useRouter();const[loading,setLoading]=React.useState(false);const[error,setError]=React.useState<string|null>(null);
 async function create(){setLoading(true);setError(null);try{const kit=await createLessonKit(documentId);router.push(`/dashboard/kit/${kit.id}`);}catch(cause){setError(cause instanceof Error?cause.message:"Não foi possível criar o kit.");setLoading(false);}}
 return <section className="lesson-kit-cta print:hidden" aria-labelledby="kit-cta-title"><div className="lesson-kit-cta-glow" aria-hidden="true"/><div className="relative z-[1] max-w-2xl"><span className="lesson-kit-eyebrow"><Sparkles aria-hidden="true"/> Próximo passo</span><h2 id="kit-cta-title">Transforme este plano em uma aula completa</h2><p>Crie cinco materiais alinhados ao plano e reúna tudo em uma central pronta para aplicar, avaliar e registrar.</p><div className="lesson-kit-output-list" aria-label="Materiais incluídos">{outputs.map(output=><span key={output}><Check aria-hidden="true"/>{output}</span>)}</div></div><button type="button" className="lesson-kit-create-button" onClick={create} disabled={loading}>{loading?<LoaderCircle className="animate-spin" aria-hidden="true"/>:<FileCheck2 aria-hidden="true"/>}{loading?"Montando seu kit...":"Criar kit completo"}{!loading&&<ArrowRight aria-hidden="true"/>}</button><div className="sr-only" aria-live="polite">{loading?"Criando materiais do kit":error??""}</div>{error&&<p role="alert" className="lesson-kit-error">{error}</p>}</section>;
}
