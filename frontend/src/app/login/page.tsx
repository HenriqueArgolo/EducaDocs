"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, LogIn, UserPlus, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, register, getCurrentUser, saveSession } from "@/lib/api";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { GridPattern } from "@/components/ui/patterns";

type AuthMode = "login" | "register";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<AuthMode>("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (getCurrentUser()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const auth =
        mode === "login"
          ? await login({ email, password })
          : await register({ name, email, password });

      saveSession(auth);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível autenticar. Verifique os dados."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-surface-50">
      <GridPattern />
      
      {/* Animated Blurry Blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary-400/30 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -50, 0],
          y: [0, 50, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent-400/20 rounded-full blur-[120px] pointer-events-none"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_1fr] bg-surface-50/70 backdrop-blur-xl border border-surface-200/40 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden relative z-10"
      >
        {/* Border Beam Effect */}
        <div className="absolute inset-0 rounded-3xl border-2 border-transparent [background:linear-gradient(45deg,transparent_25%,rgba(79,70,229,0.2)_50%,transparent_75%)_border-box] [background-size:200%_200%] animate-border-beam pointer-events-none" style={{ WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />

        {/* LEFT PANEL */}
        <div className="relative bg-gradient-to-br from-primary-900 to-primary-950 text-white p-10 md:p-14 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
          
          <div className="relative z-10">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-12"
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2.5 rounded-xl shadow-lg">
                <BookOpen className="w-7 h-7 text-primary-200" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">EduDocs AI</span>
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold leading-[1.1] mb-6 text-white"
            >
              Planejamento inteligente,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-primary-300">resultados reais.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-primary-200 text-lg leading-relaxed max-w-sm"
            >
              A primeira IA treinada exclusivamente com a matriz da BNCC brasileira.
            </motion.p>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-4 mt-12 relative z-10"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
              <Sparkles className="w-5 h-5 text-accent-400 mb-3" />
              <strong className="block text-white mb-1">Geração Rápida</strong>
              <span className="text-primary-200 text-sm">Planos em segundos</span>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
              <CheckCircle2 className="w-5 h-5 text-success-400 mb-3" />
              <strong className="block text-white mb-1">100% BNCC</strong>
              <span className="text-primary-200 text-sm">Alinhamento garanto</span>
            </div>
          </motion.div>
        </div>

        {/* RIGHT PANEL - FORM */}
        <div className="p-10 md:p-14 relative bg-surface-100/50">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="h-full flex flex-col justify-center max-w-md mx-auto"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-2 bg-surface-200/50 backdrop-blur-sm p-1.5 rounded-xl mb-10 w-fit border border-surface-300/50 shadow-sm">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  !isRegister
                    ? "bg-primary-500 text-white shadow-md scale-100"
                    : "text-text-400 hover:text-white scale-95 hover:scale-100"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  isRegister
                    ? "bg-primary-500 text-white shadow-md scale-100"
                    : "text-text-400 hover:text-white scale-95 hover:scale-100"
                }`}
              >
                Criar conta
              </button>
            </motion.div>

            <motion.div variants={itemVariants} className="mb-10">
              <h2 className="text-3xl font-black text-text-900 mb-3 tracking-tight">
                {isRegister ? "Comece agora mesmo" : "Bem-vindo de volta"}
              </h2>
              <p className="text-text-500 text-lg">
                {isRegister
                  ? "Crie sua conta gratuita e transforme suas aulas."
                  : "Acesse sua conta para continuar planejando."}
              </p>
            </motion.div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <AnimatePresence mode="popLayout">
                {isRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    transition={{ duration: 0.3, type: "spring" }}
                  >
                    <label className="block text-sm font-bold text-text-700 mb-2">
                      Nome completo
                    </label>
                    <Input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      minLength={2}
                      required
                      placeholder="Prof. João Silva"
                      className="h-12 bg-surface-0 border-surface-200 text-text-900 focus:border-primary-400 focus:ring-primary-400/20 shadow-sm rounded-xl placeholder:text-text-500"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants}>
                <label className="block text-sm font-bold text-text-700 mb-2">
                  Email profissional
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  placeholder="professor@escola.com"
                  className="h-12 bg-surface-0 border-surface-200 text-text-900 focus:border-primary-400 focus:ring-primary-400/20 shadow-sm rounded-xl placeholder:text-text-500"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-text-700">
                    Senha
                  </label>
                  {!isRegister && (
                    <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                      Esqueceu a senha?
                    </a>
                  )}
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  minLength={6}
                  required
                  placeholder="Mínimo de 6 caracteres"
                  className="h-12 bg-surface-0 border-surface-200 text-text-900 focus:border-primary-400 focus:ring-primary-400/20 shadow-sm rounded-xl placeholder:text-text-500"
                />
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm font-medium text-error-700 shadow-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants} className="pt-2">
                <Button
                  type="submit"
                  variant="cta"
                  size="xl"
                  isLoading={isSubmitting}
                  className="w-full rounded-xl shadow-lg hover:shadow-xl transition-all"
                  leftIcon={
                    isRegister ? (
                      <UserPlus className="w-5 h-5" />
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )
                  }
                >
                  {isRegister ? "Criar conta gratuita" : "Entrar no sistema"}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
