"use client";

import React, { useState } from "react";
import { X, MapPin, Lock, Sparkles } from "lucide-react";
import { MapPinData } from "./fantasy-map-data";

export interface NewPinModalProps {
  coords: { x: number; y: number } | null;
  onClose: () => void;
  onSave: (pinData: Omit<MapPinData, "id">) => void;
}

const COLOR_PRESETS = [
  { label: "Azul (Locais)", value: "#38bdf8" },
  { label: "Âmbar (Cidades)", value: "#fbbf24" },
  { label: "Verde (Florestas/Tavernas)", value: "#34d399" },
  { label: "Roxo (Arcano)", value: "#c084fc" },
  { label: "Vermelho (Masmorras/Segredos)", value: "#f43f5e" },
];

export function NewPinModal({ coords, onClose, onSave }: NewPinModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MapPinData["category"]>("landmark");
  const [color, setColor] = useState("#38bdf8");
  const [isSecret, setIsSecret] = useState(false);
  const [tagInput, setTagInput] = useState("");

  if (!coords) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    onSave({
      title,
      description,
      category,
      x: coords.x,
      y: coords.y,
      color: isSecret ? "#f43f5e" : color,
      isSecret,
      tags: tags.length > 0 ? tags : [category],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#141721] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Criar Novo Marcador no Mapa</h3>
              <p className="text-xs text-slate-400">
                Fixado nas coordenadas X: {coords.x}, Y: {coords.y}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nome do Local / Ponto de Interesse *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Cripta do Rei Esqueleto"
              className="w-full px-3 py-2 rounded-lg bg-[#181c28] border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-[#181c28] border border-slate-700/80 text-sm text-slate-100 outline-none focus:border-amber-500"
            >
              <option value="landmark">Ponto de Interesse / Geográfico</option>
              <option value="capital">Capital / Grande Cidadela</option>
              <option value="city">Cidade / Assentamento</option>
              <option value="dungeon">Masmorra / Ruína</option>
              <option value="tavern">Taverna / Pousada</option>
              <option value="secret">Segredo Oculto de Mestre</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Descrição / Lore Inicial
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve resumo para jogadores ou notas de sessão..."
              className="w-full px-3 py-2 rounded-lg bg-[#181c28] border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Cor do Marcador
            </label>
            <div className="flex gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.value}
                  onClick={() => setColor(preset.value)}
                  style={{ backgroundColor: preset.value }}
                  className={`h-7 w-7 rounded-full border-2 transition ${
                    color === preset.value
                      ? "border-white scale-110 shadow-lg"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  title={preset.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="ex: masmorra, perigo, tesouro"
              className="w-full px-3 py-2 rounded-lg bg-[#181c28] border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
            />
          </div>

          {/* Toggle de Segredo */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-950/20 border border-rose-900/50">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-rose-400" />
              <div>
                <span className="text-xs font-bold text-rose-200 block">
                  Segredo Exclusivo do Mestre
                </span>
                <span className="text-[11px] text-rose-400/80">
                  Oculto para jogadores quando no modo jogador
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-black transition shadow-lg shadow-amber-950/40"
            >
              Salvar Marcador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
