"use client";

import { motion } from "framer-motion";
import { CheckCircle2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    description: "Para professores testarem o poder do nosso sistema.",
    features: [
      { name: "3 planos de aula completos por mês", included: true },
      { name: "Acesso total à base da BNCC", included: true },
      { name: "Exportação em PDF básico", included: true },
      { name: "Geração de atividades", included: false },
      { name: "Suporte prioritário", included: false },
    ],
    buttonText: "Começar Grátis",
    popular: false,
    delay: 0.1,
  },
  {
    name: "Profissional",
    price: "R$ 29,90",
    period: "/mês",
    description: "Aulas infinitas para transformar toda sua rotina escolar.",
    features: [
      { name: "Planos de aula ilimitados", included: true },
      { name: "Acesso total à base da BNCC", included: true },
      { name: "Exportação em PDF premium e Word", included: true },
      { name: "Geração ilimitada de avaliações e provas", included: true },
      { name: "Suporte prioritário VIP", included: true },
    ],
    buttonText: "Assinar o Profissional",
    popular: true,
    delay: 0.2,
  },
];

export function Pricing() {
  return (
    <section className="py-32 bg-surface-50 relative overflow-hidden">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-primary-900/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-accent-900/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-100 border border-surface-200 text-accent-400 text-sm font-bold tracking-wide uppercase mb-8 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>Planos e Preços</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight text-text-900 mb-6">
            Um investimento que <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-primary-400">devolve seu tempo.</span>
          </h2>
          <p className="text-xl text-text-500 font-medium">
            Quanto vale não precisar mais trabalhar nos finais de semana? Escolha o plano perfeito para você.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: plan.popular ? 1.05 : 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: plan.delay, duration: 0.6, type: "spring", bounce: 0.3 }}
              className={`relative flex flex-col p-10 rounded-[2rem] bg-surface-100/50 backdrop-blur-xl border ${plan.popular ? 'border-primary-500 shadow-[0_0_80px_rgba(124,58,237,0.2)] z-10' : 'border-surface-200 shadow-xl mt-0 md:mt-6 md:mb-6'} overflow-hidden transition-all duration-500 hover:shadow-[0_0_100px_rgba(124,58,237,0.3)]`}
            >
              {plan.popular && (
                <>
                  <div className="absolute inset-0 rounded-[2rem] border-2 border-transparent [background:linear-gradient(45deg,transparent_25%,rgba(124,58,237,0.5)_50%,transparent_75%)_border-box] [background-size:200%_200%] animate-border-beam pointer-events-none" style={{ WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
                  <div className="absolute top-0 right-10 bg-primary-500 text-white px-4 py-1.5 rounded-b-xl text-sm font-bold tracking-wide shadow-lg">
                    Recomendado
                  </div>
                </>
              )}
              
              <div className="mb-8 relative z-10">
                <h3 className="text-2xl font-bold text-text-900 mb-3">{plan.name}</h3>
                <p className="text-text-400 text-base">{plan.description}</p>
              </div>

              <div className="mb-10 relative z-10">
                <span className="text-5xl font-black text-text-900 drop-shadow-sm">{plan.price}</span>
                {plan.period && <span className="text-text-500 font-medium ml-2">{plan.period}</span>}
              </div>

              <div className="flex-1 space-y-5 mb-10 relative z-10">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-start gap-3">
                    {feature.included ? (
                      <CheckCircle2 className="w-6 h-6 text-primary-400 flex-shrink-0" />
                    ) : (
                      <X className="w-6 h-6 text-surface-300 flex-shrink-0" />
                    )}
                    <span className={feature.included ? "text-text-700 font-medium" : "text-text-500"}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative z-10 mt-auto">
                <Button 
                  variant={plan.popular ? "cta" : "outline"} 
                  size="xl" 
                  className={`w-full rounded-2xl font-bold text-lg ${plan.popular ? 'shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:shadow-[0_0_50px_rgba(244,63,94,0.5)]' : 'bg-surface-200 text-text-900 border-surface-300 hover:bg-surface-300'}`}
                >
                  {plan.buttonText}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
