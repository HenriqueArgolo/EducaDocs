"use client";

import Link from "next/link";
import { BookOpen, Mail, MessageCircle, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-surface-0 border-t border-surface-100 py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8 mb-12">
          
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-primary-600 p-2 rounded-lg text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-text-900 tracking-tight">EduDocs AI</span>
            </Link>
            <p className="text-text-500 text-sm leading-relaxed max-w-xs mb-6">
              Empoderando professores com Inteligência Artificial para planejamento educacional alinhado à BNCC.
            </p>
            <div className="flex items-center gap-4 text-text-400">
              <a href="#" className="hover:text-primary-600 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-600 transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-600 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-text-900 mb-4">Produto</h4>
            <ul className="space-y-3 text-sm text-text-500">
              <li><a href="#" className="hover:text-primary-600 transition-colors">Recursos</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Planos de Aula</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Avaliações</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Preços</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-900 mb-4">Suporte</h4>
            <ul className="space-y-3 text-sm text-text-500">
              <li><a href="#" className="hover:text-primary-600 transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Tutoriais</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Comunidade</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Contato</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-900 mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-text-500">
              <li><a href="#" className="hover:text-primary-600 transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Privacidade</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-200 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-400">
          <p>© {new Date().getFullYear()} EduDocs AI. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              Feito com <span className="text-error-500">♥</span> no Brasil
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
