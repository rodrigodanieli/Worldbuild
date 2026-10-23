"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Image as ImageIcon,
  Upload,
  Check,
  Trash2,
  Loader2,
  Sparkles,
  Clipboard,
  Clock,
  FolderOpen,
} from "lucide-react";
import { PRESET_BANNERS, PRESET_AVATARS, ProjectMediaItem } from "./card-context-types";
import { uploadUniversalMedia, extractMediaFromClipboard } from "@/lib/media-upload";

interface BannerAvatarModalProps {
  isOpen: boolean;
  mode: "banner" | "avatar" | "image_field";
  projectId: string;
  cardId: string;
  currentUrl?: string | null;
  title?: string;
  onClose: () => void;
  onSelect: (url: string | null) => void;
}

export function BannerAvatarModal({
  isOpen,
  mode,
  projectId,
  cardId,
  currentUrl,
  title,
  onClose,
  onSelect,
}: BannerAvatarModalProps) {
  const [activeTab, setActiveTab] = useState<"project" | "upload" | "presets">("project");
  const [customUrl, setCustomUrl] = useState(currentUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [projectMedia, setProjectMedia] = useState<ProjectMediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const resource = mode === "banner" ? "banner_card" : mode === "avatar" ? "avatar_card" : "image_field_card";
  const presets = mode === "banner" ? PRESET_BANNERS : mode === "avatar" ? PRESET_AVATARS : [...PRESET_AVATARS, ...PRESET_BANNERS];
  const displayTitle = title || (mode === "banner" ? "Capa do Card (Banner)" : mode === "avatar" ? "Avatar / Ícone do Card" : "Imagem do Campo");

  // Carrega mídias já enviadas para este projeto e recurso
  const loadProjectMedia = async () => {
    if (!projectId) return;
    setLoadingMedia(true);
    try {
      const url = mode === "image_field"
        ? `/api/media?projectId=${projectId}`
        : `/api/media?projectId=${projectId}&resource=${resource}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProjectMedia(data.media || []);
      }
    } catch (err) {
      console.error("Erro ao carregar mídias do projeto:", err);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProjectMedia();
      setErrorMessage("");
    }
  }, [isOpen, projectId, resource]);

  // Upload unificado (tanto via botão quanto via Ctrl+V / Paste)
  const handleDirectUpload = async (file: File | Blob) => {
    setIsUploading(true);
    setErrorMessage("");

    try {
      const data = await uploadUniversalMedia({
        file,
        projectId,
        resource,
        cardId,
      });

      if (data.success && data.url) {
        onSelect(data.url);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Erro no envio do arquivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleDirectUpload(file);
    }
  };

  // Suporte global a Ctrl+V dentro do Modal aberto
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const file = extractMediaFromClipboard(e);
      if (file) {
        e.preventDefault();
        handleDirectUpload(file);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, projectId, resource]);

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) {
      setErrorMessage("Digite uma URL de imagem válida.");
      return;
    }
    onSelect(customUrl.trim());
    onClose();
  };

  const handleRemove = () => {
    onSelect(null);
    onClose();
  };

  const handleDeleteExistingMedia = async (mediaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Deseja remover esta mídia dos registros do projeto?")) return;

    try {
      const res = await fetch(`/api/media?id=${mediaId}`, { method: "DELETE" });
      if (res.ok) {
        setProjectMedia((prev) => prev.filter((m) => m.id !== mediaId));
      }
    } catch (err) {
      alert("Falha ao remover mídia.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700/80 bg-[#141724] p-6 shadow-2xl flex flex-col max-h-[88vh]">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">{displayTitle}</h3>
              <p className="text-[11px] text-slate-400">
                Recurso: <span className="font-mono text-amber-400">{resource}</span> • Cole com Ctrl+V ou selecione
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("project")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "project"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>Mídias do Projeto ({projectMedia.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "upload"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Novo Upload / Ctrl+V</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "presets"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Presets & URL</span>
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* ABA 1: MÍDIAS DO PROJETO */}
          {activeTab === "project" && (
            <div>
              {loadingMedia ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                  <span>Consultando mídias deste projeto...</span>
                </div>
              ) : projectMedia.length === 0 ? (
                <div className="py-10 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                  <FolderOpen className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-300">
                    Nenhuma mídia de {mode === "banner" ? "capa" : mode === "avatar" ? "avatar" : "imagem"} enviada ainda neste projeto
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                    Envie imagens pelo botão de upload ou dê <strong>Ctrl+V</strong> para colá-las e salvá-las automaticamente na galeria.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs transition"
                  >
                    Fazer Primeiro Upload
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {projectMedia.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        onSelect(m.url);
                        onClose();
                      }}
                      className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-amber-400 bg-slate-900 cursor-pointer transition shadow-md"
                    >
                      <div className={`w-full overflow-hidden bg-black/40 ${mode === "banner" ? "h-24" : "h-24"}`}>
                        <img
                          src={m.url}
                          alt={m.originalName}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="p-2 bg-[#10131d]">
                        <p className="text-[11px] font-medium text-slate-200 truncate" title={m.originalName}>
                          {m.originalName}
                        </p>
                        <p className="text-[9px] text-slate-500 flex items-center justify-between mt-0.5">
                          <span>{(m.sizeBytes / 1024).toFixed(0)} KB</span>
                          <span className="font-mono text-amber-400/80">{m.hash.slice(0, 6)}</span>
                        </p>
                      </div>

                      {/* Botão de Excluir */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteExistingMedia(m.id, e)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 hover:bg-rose-950 text-slate-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition"
                        title="Remover mídia do projeto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 2: UPLOAD & CTRL+V */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center gap-3 w-full p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-500/70 bg-[#10131d] hover:bg-slate-900 transition cursor-pointer group">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 text-xs font-semibold text-amber-400">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span>Processando hash e registrando no banco SQLite...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-white">
                        Clique para selecionar arquivo de imagem
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PNG, JPG, WebP ou GIF até 10MB
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-semibold text-slate-300">
                      <Clipboard className="h-3 w-3 text-amber-400" />
                      <span>Ou simplesmente pressione <strong>Ctrl+V</strong> em qualquer lugar!</span>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">⚡ Fluxo Unificado de Upload:</p>
                <p>
                  • O arquivo é renomeado com hash SHA-256 única.
                  <br />
                  • Registrado na tabela do projeto com recurso <code>{resource}</code>.
                  <br />
                  • Ficará disponível na aba <em>"Mídias do Projeto"</em> para ser reutilizado.
                </p>
              </div>
            </div>
          )}

          {/* ABA 3: PRESETS FANTASIA & URL EXTERNA */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Presets de Fantasia e RPG</span>
                </label>
                <div className={`grid ${mode === "banner" ? "grid-cols-3 gap-2.5" : "grid-cols-6 gap-2"}`}>
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onSelect(preset.url);
                        onClose();
                      }}
                      className={`group relative overflow-hidden rounded-xl border border-slate-700 hover:border-amber-400 transition ${
                        mode === "banner" ? "h-20" : "h-14 w-14"
                      }`}
                      title={preset.name}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white text-center px-1">
                          {preset.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inserir URL Direta */}
              <form onSubmit={handleApplyUrl} className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300">
                  Ou informar link de imagem externa (URL direta)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition border border-slate-700"
                  >
                    Aplicar
                  </button>
                </div>
              </form>
            </div>
          )}

          {errorMessage && (
            <p className="text-xs text-rose-400 font-medium bg-rose-950/30 border border-rose-900/50 p-2.5 rounded-xl">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center mt-3">
          {currentUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remover {mode === "banner" ? "Capa" : "Avatar"}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
