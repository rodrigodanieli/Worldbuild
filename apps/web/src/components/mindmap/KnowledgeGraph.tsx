"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { WorldNode, WorldNodeData } from "./WorldNode";
import { 
  Filter, 
  Search, 
  Sparkles, 
  Maximize2, 
  BookOpen, 
  ShieldAlert, 
  ArrowRight,
  Layers,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const INITIAL_NODES: Node[] = [
  {
    id: "world-1",
    type: "worldNode",
    position: { x: 420, y: 60 },
    data: {
      id: "world-1",
      label: "Reino de Eldoria",
      category: "location",
      subtitle: "Vasto império continental governado pelo Conselho das Quatro Coroas.",
      tags: ["reino", "continente", "lore-principal"],
      linkCount: 3,
    },
  },
  {
    id: "loc-1",
    type: "worldNode",
    position: { x: 160, y: 240 },
    data: {
      id: "loc-1",
      label: "Capital Valefundo",
      category: "location",
      subtitle: "Cidade fortificada encravada entre as montanhas cinzentas.",
      tags: ["cidade", "capital", "comercio"],
      linkCount: 4,
    },
  },
  {
    id: "loc-2",
    type: "worldNode",
    position: { x: 20, y: 460 },
    data: {
      id: "loc-2",
      label: "Tumba Esquecida",
      category: "location",
      subtitle: "Complexo subterrâneo selado por feitiços arcanos esquecidos.",
      tags: ["masmorra", "perigo", "mortos-vivos"],
      isSecret: true,
      linkCount: 2,
    },
  },
  {
    id: "loc-sub-1",
    type: "worldNode",
    position: { x: 220, y: 580 },
    data: {
      id: "loc-sub-1",
      label: "Taverna do Javali Saltitante",
      category: "location",
      subtitle: "Principal ponto de encontro de aventureiros e fofocas locais.",
      tags: ["taverna", "ponto-de-encontro"],
      linkCount: 1,
    },
  },
  {
    id: "loc-sub-2",
    type: "worldNode",
    position: { x: 380, y: 430 },
    data: {
      id: "loc-sub-2",
      label: "Torre Arcana das Brumas",
      category: "location",
      subtitle: "Observatório secreto de estudos planares de Valefundo.",
      tags: ["magia", "arcano", "relicario"],
      isSecret: true,
      linkCount: 2,
    },
  },
  {
    id: "char-1",
    type: "worldNode",
    position: { x: 740, y: 220 },
    data: {
      id: "char-1",
      label: "Kaelen Sombra-da-Noite",
      category: "character",
      subtitle: "Guerreiro Mestre de Batalha (Nv 3). Sincronizado com App Mobile.",
      tags: ["jogador", "dnd-5e", "combatente"],
      linkCount: 3,
    },
  },
  {
    id: "item-1",
    type: "worldNode",
    position: { x: 960, y: 390 },
    data: {
      id: "item-1",
      label: "Espada Longa de Mithral",
      category: "item",
      subtitle: "Forjada pelos artífices de Valefundo. Concede +1 em ataques.",
      tags: ["arma-magica", "mithral", "raro"],
      linkCount: 1,
    },
  },
  {
    id: "faction-1",
    type: "worldNode",
    position: { x: 680, y: 450 },
    data: {
      id: "faction-1",
      label: "Ordem da Rosa Escarlate",
      category: "faction",
      subtitle: "Irmandade militar juramentada a manter a paz na fronteira.",
      tags: ["faccao", "milicia", "leal-e-bom"],
      linkCount: 1,
    },
  },
  {
    id: "char-3",
    type: "worldNode",
    position: { x: 440, y: 640 },
    data: {
      id: "char-3",
      label: "Lady Vespera",
      category: "character",
      subtitle: "Nobre influente da corte, secretamente aliada ao Culto do Vazio.",
      tags: ["npc", "infiltrada", "antagonista"],
      isSecret: true,
      linkCount: 2,
    },
  },
  {
    id: "faction-2",
    type: "worldNode",
    position: { x: 260, y: 760 },
    data: {
      id: "faction-2",
      label: "Culto do Vazio",
      category: "faction",
      subtitle: "Seita apocalíptica buscando despertar a entidade sob a tumba.",
      tags: ["seita", "culto", "vilao-principal"],
      isSecret: true,
      linkCount: 2,
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: "e-valefundo-eldoria",
    source: "loc-1",
    target: "world-1",
    label: "Capital de",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#38bdf8", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#38bdf8" },
  },
  {
    id: "e-tumba-valefundo",
    source: "loc-2",
    target: "loc-1",
    label: "Sob o solo de",
    type: "smoothstep",
    style: { stroke: "#f43f5e", strokeWidth: 1.5, strokeDasharray: "5 5" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#f43f5e" },
  },
  {
    id: "e-taverna-valefundo",
    source: "loc-sub-1",
    target: "loc-1",
    label: "Localizada em",
    type: "smoothstep",
    style: { stroke: "#94a3b8", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
  },
  {
    id: "e-torre-valefundo",
    source: "loc-sub-2",
    target: "loc-1",
    label: "Baluarte em",
    type: "smoothstep",
    style: { stroke: "#38bdf8", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#38bdf8" },
  },
  {
    id: "e-kaelen-eldoria",
    source: "char-1",
    target: "world-1",
    label: "Patrulha",
    type: "smoothstep",
    style: { stroke: "#f59e0b", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
  },
  {
    id: "e-kaelen-ordem",
    source: "char-1",
    target: "faction-1",
    label: "Membro de",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#f59e0b", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
  },
  {
    id: "e-kaelen-espada",
    source: "char-1",
    target: "item-1",
    label: "Empunha (@item)",
    type: "smoothstep",
    style: { stroke: "#10b981", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
  },
  {
    id: "e-vespera-torre",
    source: "char-3",
    target: "loc-sub-2",
    label: "Infiltrada em",
    type: "smoothstep",
    style: { stroke: "#f43f5e", strokeWidth: 1.5, strokeDasharray: "4 4" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#f43f5e" },
  },
  {
    id: "e-vespera-culto",
    source: "char-3",
    target: "faction-2",
    label: "Líder Oculta de",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#f43f5e", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#f43f5e" },
  },
  {
    id: "e-culto-tumba",
    source: "faction-2",
    target: "loc-2",
    label: "Conspira na",
    type: "smoothstep",
    style: { stroke: "#f43f5e", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#f43f5e" },
  },
];

export function KnowledgeGraph() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNode, setSelectedNode] = useState<WorldNodeData | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const nodeTypes = useMemo(() => ({ worldNode: WorldNode }), []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.data as unknown as WorldNodeData);
  }, []);

  // Filtra nós com base na categoria e na barra de pesquisa
  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const data = node.data as unknown as WorldNodeData;
      let isVisible = true;

      if (categoryFilter !== "all") {
        if (categoryFilter === "secret") {
          isVisible = !!data.isSecret;
        } else {
          isVisible = data.category === categoryFilter;
        }
      }

      if (searchQuery && isVisible) {
        const query = searchQuery.toLowerCase();
        isVisible =
          data.label.toLowerCase().includes(query) ||
          (data.subtitle && data.subtitle.toLowerCase().includes(query)) ||
          (data.tags && data.tags.some((t) => t.toLowerCase().includes(query))) ||
          false;
      }

      return {
        ...node,
        hidden: !isVisible,
      };
    });
  }, [nodes, categoryFilter, searchQuery]);

  return (
    <div className="relative h-full w-full bg-[#0a0c12] overflow-hidden select-none">
      {/* Barra de Filtros e Controles Superiores */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-[#12151e]/90 p-2 shadow-2xl backdrop-blur-md">
        {/* Campo de Busca Rápida no Grafo */}
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nó no grafo..."
            className="w-full rounded-lg border border-slate-700/60 bg-[#181c28] pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="h-5 w-[1px] bg-slate-800 mx-1" />

        {/* Botões de Filtro por Categoria */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              categoryFilter === "all"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            Todos ({nodes.length})
          </button>
          <button
            onClick={() => setCategoryFilter("location")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              categoryFilter === "location"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            Lugares
          </button>
          <button
            onClick={() => setCategoryFilter("character")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              categoryFilter === "character"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            Personagens
          </button>
          <button
            onClick={() => setCategoryFilter("item")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              categoryFilter === "item"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            Itens
          </button>
          <button
            onClick={() => setCategoryFilter("faction")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              categoryFilter === "faction"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            Facções
          </button>
          <button
            onClick={() => setCategoryFilter("secret")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              categoryFilter === "secret"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-slate-400 hover:text-rose-400 hover:bg-slate-800/60"
            }`}
          >
            <ShieldAlert className="h-3 w-3" />
            <span>Segredos DM</span>
          </button>
        </div>
      </div>

      {/* Canvas Principal do React Flow */}
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
      >
        <Background color="#1f293d" gap={20} size={1} />
        <Controls className="!bg-[#141721] !border-slate-800 !text-slate-300 !fill-slate-300 shadow-2xl rounded-xl overflow-hidden" />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as unknown as WorldNodeData;
            if (d?.isSecret) return "#f43f5e";
            if (d?.category === "location") return "#38bdf8";
            if (d?.category === "character") return "#f59e0b";
            if (d?.category === "item") return "#10b981";
            if (d?.category === "faction") return "#c084fc";
            return "#64748b";
          }}
          className="!bg-[#12151e]/90 !border-slate-800 !rounded-xl shadow-2xl backdrop-blur-md"
          maskColor="rgba(10, 12, 18, 0.7)"
        />
      </ReactFlow>

      {/* Painel Lateral Deslizante (Slide-Over Drawer) para Detalhes do Nó */}
      {selectedNode && (
        <div className="absolute right-4 top-4 bottom-4 z-30 w-96 rounded-2xl border border-slate-700/80 bg-[#12151e]/95 p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {selectedNode.isSecret ? "Segredo do Mestre" : selectedNode.category}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <h3 className="text-xl font-bold text-white tracking-tight">
                {selectedNode.label}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {selectedNode.subtitle}
              </p>
            </div>

            {/* Tags associadas */}
            {selectedNode.tags && (
              <div className="mt-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Tags & Metadados
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181c28] text-slate-300 border border-slate-800"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Conexões Diretas Identificadas no Grafo */}
            <div className="mt-6">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Relações Vinculadas (@)
              </span>
              <div className="space-y-1.5">
                {edges
                  .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                  .map((e) => {
                    const isSource = e.source === selectedNode.id;
                    const otherNodeId = isSource ? e.target : e.source;
                    const otherNode = nodes.find((n) => n.id === otherNodeId)?.data as unknown as WorldNodeData;

                    return (
                      <div
                        key={e.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#181c28] border border-slate-800 text-xs"
                      >
                        <span className="text-slate-400">{e.label || "Conectado a"}</span>
                        <span className="font-semibold text-amber-300 flex items-center gap-1">
                          {otherNode?.label || otherNodeId}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Botão de Ação: Abrir no Editor TipTap */}
          <div className="pt-4 border-t border-slate-800">
            <Link
              href="/wiki"
              className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-950/40 transition"
            >
              <BookOpen className="h-4 w-4" />
              <span>Abrir Artigo Completo no Editor Wiki</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
