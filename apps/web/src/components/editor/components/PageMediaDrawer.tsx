"use client";

import React, { useState, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import {
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  Trash2,
  Plus,
  X,
  Loader2,
  FileCheck,
  Film,
  HardDrive,
  Clipboard,
} from "lucide-react";
import { uploadUniversalMedia, extractMediaFromClipboard } from "@/lib/media-upload";

export interface PageAssetItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType?: string;
  format?: string;
  mediaType: "image" | "video" | "audio" | string;
  sizeBytes: number;
  url: string;
  resource?: string;
  createdAt: string | Date;
}

export interface PageMediaDrawerProps {
  projectId?: string;
  pageId?: string;
  cardId?: string;
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PageMediaDrawer({
  projectId,
  pageId,
  cardId,
  editor,
  isOpen,
  onClose,
}: PageMediaDrawerProps) {
  const [assets, setAssets] = useState<PageAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "image" | "video" | "audio">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetId = cardId || pageId || "";
  const isCard = !!cardId;
  const resource = isCard ? "markdown_card" : "pagina_wiki";

  // Carrega mídias do projeto/recurso
  const fetchAssets = async () => {
    setLoading(true);
    try {
      let loaded: PageAssetItem[] = [];

      // 1. Tenta carregar do endpoint unificado de mídias do projeto
      if (projectId) {
        const res = await fetch(`/api/media?projectId=${projectId}&resource=${resource}`);
        if (res.ok) {
          const data = await res.json();
          loaded = data.media || [];
        }
      }

      // 2. Fallback ou união com assets legados vinculados à página/card
      if (targetId) {
        const legacyUrl = isCard ? `/api/cards/${targetId}/assets` : `/api/pages/${targetId}/assets`;
        const res = await fetch(legacyUrl);
        if (res.ok) {
          const data = await res.json();
          const legacyAssets: PageAssetItem[] = data.assets || [];
          // Mescla sem duplicar por URL ou id
          const existingUrls = new Set(loaded.map((a) => a.url));
          for (const leg of legacyAssets) {
            if (!existingUrls.has(leg.url)) {
              loaded.push(leg);
            }
          }
        }
      }

      setAssets(loaded);
    } catch (e) {
      console.error("Erro ao listar mídias:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
      setErrorMessage("");
    }
  }, [isOpen, projectId, targetId, resource]);

  // Upload unificado para arquivo selecionado ou colado
  const handleUploadFile = async (file: File | Blob) => {
    setUploading(true);
    setErrorMessage("");

    try {
      const data = await uploadUniversalMedia({
        file,
        projectId: projectId || "",
        resource,
        cardId,
        pageId,
      });

      if (data.success && data.media) {
        setAssets((prev) => [data.media, ...prev]);

        // Insere automaticamente no cursor do editor
        insertIntoEditor(data.media);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Falha no envio do arquivo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Suporte a Ctrl+V dentro do Drawer
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const file = extractMediaFromClipboard(e);
      if (file) {
        e.preventDefault();
        handleUploadFile(file);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, projectId, resource, cardId, pageId]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  // Inserir mídia existente no editor
  const insertIntoEditor = (asset: PageAssetItem) => {
    if (!editor) return;

    if (asset.mediaType === "video") {
      (editor.commands as any).setVideo?.({ src: asset.url });
    } else if (asset.mediaType === "audio") {
      (editor.commands as any).setAudio?.({ src: asset.url, title: asset.originalName });
    } else {
      editor.commands.setImage({ src: asset.url, alt: asset.originalName });
    }
    onClose();
  };

  // Excluir mídia
  const handleDeleteMedia = async (assetId: string, name: string) => {
    if (!confirm(`Deseja remover "${name}" do servidor e desvincular deste item?`)) {
      return;
    }

    try {
      // Tenta remover na API unificada
      const res = await fetch(`/api/media?id=${assetId}`, { method: "DELETE" });
      if (!res.ok && targetId) {
        const legacyUrl = isCard ? `/api/cards/${targetId}/assets` : `/api/pages/${targetId}/assets`;
        await fetch(`${legacyUrl}?assetId=${assetId}`, { method: "DELETE" });
      }

      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    } catch (e) {
      alert("Falha ao excluir o arquivo.");
    }
  };

  if (!isOpen) return null;

  const filteredAssets = assets.filter((a) => {
    if (selectedFilter === "all") return true;
    return a.mediaType === selectedFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#141721] border border-slate-700 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header do Drawer */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#10131b]">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Mídias da Página (Imagens, Vídeos e Áudios)
              </h3>
              <p className="text-[11px] text-slate-400">
                Upload universal • Cole com Ctrl+V ou selecione um arquivo do dispositivo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Área de Upload e Drag-and-Drop */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={handleFileInput}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-[#12151e]/60 hover:bg-amber-500/5 group"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Enviando arquivo com hash única e registrando...
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-slate-400 group-hover:text-amber-400 transition">
                  <ImageIcon className="h-5 w-5 text-amber-400" />
                  <Film className="h-5 w-5 text-sky-400" />
                  <Music className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400">
                    Clique para selecionar Imagem, Vídeo ou Áudio
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Ou pressione <strong>Ctrl+V</strong> para colar diretamente da área de transferência
                  </p>
                </div>
              </>
            )}
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-400 font-medium mt-2 bg-rose-950/40 p-2 rounded-lg border border-rose-900/50">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Filtros de Tipo */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-[#11141e] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400 mr-1">Filtrar:</span>
            {(
              [
                { id: "all", label: `Todos (${assets.length})` },
                { id: "image", label: "Imagens" },
                { id: "video", label: "Vídeos" },
                { id: "audio", label: "Áudios" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedFilter === f.id
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-[10px] text-slate-500 font-mono">
            Recurso: {resource}
          </span>
        </div>

        {/* Grid de Mídias Cadastradas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
              <span>Carregando mídias registradas...</span>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
              <FileCheck className="h-8 w-8 text-slate-600 mb-2" />
              <span>Nenhuma mídia encontrada com este filtro.</span>
              <span className="text-[10px] text-slate-500 mt-1">
                Faça upload ou cole um arquivo com Ctrl+V.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative rounded-xl border border-slate-800 hover:border-amber-500/80 bg-slate-900/60 overflow-hidden flex flex-col transition shadow-md"
                >
                  {/* Thumbnail / Preview de Acordo com o Tipo */}
                  <div
                    onClick={() => insertIntoEditor(asset)}
                    className="h-28 bg-[#0a0d14] flex items-center justify-center overflow-hidden cursor-pointer relative"
                  >
                    {asset.mediaType === "video" ? (
                      <div className="flex flex-col items-center gap-1 text-sky-400">
                        <VideoIcon className="h-8 w-8" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          Vídeo
                        </span>
                      </div>
                    ) : asset.mediaType === "audio" ? (
                      <div className="flex flex-col items-center gap-1 text-emerald-400">
                        <Music className="h-8 w-8" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          Áudio
                        </span>
                      </div>
                    ) : (
                      <img
                        src={asset.url}
                        alt={asset.originalName}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    )}

                    {/* Overlay de Ação no Hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 text-white text-xs font-bold">
                      <Plus className="h-4 w-4 text-amber-400" />
                      <span>Inserir no Editor</span>
                    </div>
                  </div>

                  {/* Informações da Mídia */}
                  <div className="p-2 bg-[#0e111a] flex items-center justify-between gap-1 border-t border-slate-800/80">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[11px] font-semibold text-slate-200 truncate"
                        title={asset.originalName}
                      >
                        {asset.originalName}
                      </p>
                      <p className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="capitalize">{asset.mediaType}</span>
                        <span>•</span>
                        <span>{(asset.sizeBytes / 1024).toFixed(0)} KB</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(asset.id, asset.originalName)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Excluir arquivo do servidor"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-3 bg-[#10131b] border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-1 text-[11px]">
            <Clipboard className="h-3.5 w-3.5 text-amber-400" />
            <span>Dica: Clique em qualquer mídia acima para inseri-la no texto do editor.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
