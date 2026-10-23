"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail, User, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha na autenticação");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: quickEmail, password: quickPass }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no login");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#090b10] px-4 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#12151e]/95 p-8 shadow-2xl backdrop-blur-xl">
        {/* Logo e Cabeçalho */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/40 mb-3">
            <Sparkles className="h-6 w-6 text-black" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isRegister ? "Criar Conta no WorldBuild" : "Acessar Campanha"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRegister
              ? "Cadastre-se com e-mail e senha para começar a criar mundos"
              : "Entre para gerenciar seus mundos, wikis e fichas"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nome ou Alcunha de Mestre/Jogador
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Gandalf ou Mestre Lucas"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#181c28] border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@rpg.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#181c28] border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#181c28] border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-sm transition shadow-lg shadow-amber-950/40 disabled:opacity-50"
          >
            {loading ? "Processando..." : isRegister ? "Criar Minha Conta" : "Entrar no Sistema"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Alternar entre Login e Cadastro */}
        <div className="mt-5 text-center text-xs text-slate-400">
          {isRegister ? (
            <span>
              Já possui uma conta?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="text-amber-400 font-bold hover:underline"
              >
                Fazer Login
              </button>
            </span>
          ) : (
            <span>
              Ainda não tem conta?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="text-amber-400 font-bold hover:underline"
              >
                Cadastre-se com e-mail
              </button>
            </span>
          )}
        </div>

        {/* Atalhos Rápidos para Teste com Dados Semeados no SQLite */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block text-center mb-2">
            Contas de Teste Pré-Configuradas no SQLite
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("mestre@worldbuild.com", "mestre123")}
              className="p-2 rounded-lg bg-[#181c28] hover:bg-slate-800 border border-slate-700/70 text-left transition"
            >
              <div className="text-[11px] font-bold text-amber-300">🧙‍♂️ Mestre</div>
              <div className="text-[9px] text-slate-400 truncate">mestre@worldbuild.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("jogador@rpg.com", "jogador123")}
              className="p-2 rounded-lg bg-[#181c28] hover:bg-slate-800 border border-slate-700/70 text-left transition"
            >
              <div className="text-[11px] font-bold text-emerald-300">⚔️ Jogador</div>
              <div className="text-[9px] text-slate-400 truncate">jogador@rpg.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
