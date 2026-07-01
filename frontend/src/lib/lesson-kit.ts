export type LessonKitStatus = "GENERATING" | "PARTIAL" | "READY";
export type LessonKitMaterialStatus = "QUEUED" | "GENERATING" | "READY" | "FAILED";
export type LessonKitMaterialType = "LESSON_PLAN" | "STUDENT_ACTIVITY" | "TEACHER_ANSWER_KEY" | "ASSESSMENT" | "PEDAGOGICAL_EVIDENCE" | "INCLUSIVE_ADAPTATIONS";
export interface LessonKitMaterial { id:number; type:LessonKitMaterialType; status:LessonKitMaterialStatus; content:string; generationError?:string|null; version:number; }
export interface LessonKit { id:number; sourceDocumentId:number; title:string; status:LessonKitStatus; grade?:string|null; subject?:string|null; topic:string; materials:LessonKitMaterial[]; createdAt:string; updatedAt:string; }
export const lessonKitMaterials:Array<{type:LessonKitMaterialType;label:string;description:string}> = [
 {type:"LESSON_PLAN",label:"Plano de aula",description:"A base pedagógica que orienta o kit."},
 {type:"STUDENT_ACTIVITY",label:"Atividade do aluno",description:"Aplicação prática pronta para a turma."},
 {type:"TEACHER_ANSWER_KEY",label:"Gabarito do professor",description:"Respostas esperadas e mediação docente."},
 {type:"ASSESSMENT",label:"Instrumento avaliativo",description:"Critérios observáveis de aprendizagem."},
 {type:"PEDAGOGICAL_EVIDENCE",label:"Evidências pedagógicas",description:"Registros para acompanhamento e coordenação."},
 {type:"INCLUSIVE_ADAPTATIONS",label:"Adaptações inclusivas",description:"Apoios concretos de leitura e participação."},
];
export const kitReadiness=(kit:LessonKit)=>`${kit.materials.filter(item=>item.status==="READY").length} de 6 prontos`;
