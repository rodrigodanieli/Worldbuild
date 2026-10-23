"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ProjectHeader } from "@/components/layout/ProjectHeader";
import { WhiteboardCardNode, CardNodeData } from "./WhiteboardCardNode";
import { WhiteboardWikiNode, WikiNodeData } from "./WhiteboardWikiNode";
import { WhiteboardReferenceEdge } from "./WhiteboardReferenceEdge";
import { WhiteboardSidebar } from "./WhiteboardSidebar";
import { WhiteboardSideDrawer } from "./WhiteboardSideDrawer";
import { ImportReferencesModal } from "./ImportReferencesModal";
import { BoardModal } from "./BoardModal";
import { extractCardReferences, DetectedReference } from "./reference-extractor";
import {
  Sparkles,
  Maximize2,
  Lock,
  Layers,
  Save,
  Check,
  AlertCircle,
  FolderOpen,
  Plus,
  LayoutDashboard,
  ChevronDown,
  Edit3,
  Trash2,
} from "lucide-react";

export interface BoardItem {
  id: string;
  name: string;
  description?: string | null;
  data: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface WhiteboardClientContainerProps {
  projectId: string;
  projectName: string;
  initialBoards?: BoardItem[];
  initialActiveBoardId?: string;
  initialWhiteboardData?: string | null;
  initialCards: any[];
  initialTags: any[];
  initialPages: any[];
  user: {
    id: string;
    name: string;
    email: string;
    settings?: Record<string, any>;
  };
}

function FlowCanvas({
  projectId,
  projectName,
  initialBoards = [],
  initialActiveBoardId,
  initialWhiteboardData,
  initialCards,
  initialTags,
  initialPages,
  user,
}: WhiteboardClientContainerProps) {
  const reactFlowInstance = useReactFlow();

  // -------------------------------------------------------------------
  // 1. Estados dos Boards (Múltiplos Quadros do Projeto)
  // -------------------------------------------------------------------
  const normalizedInitialBoards = useMemo<BoardItem[]>(() => {
    if (initialBoards && initialBoards.length > 0) {
      return initialBoards;
    }
    // Fallback com dados do whiteboard anterior se existir
    let fallbackData = '{"nodes":[],"edges":[]}';
    if (initialWhiteboardData) {
      fallbackData =
        typeof initialWhiteboardData === "string"
          ? initialWhiteboardData
          : JSON.stringify(initialWhiteboardData);
    }
    return [
      {
        id: "default-board",
        name: "Quadro Principal",
        description: "Quadro inicial de cartões e relacionamentos",
        data: fallbackData,
      },
    ];
  }, [initialBoards, initialWhiteboardData]);

  const [boards, setBoards] = useState<BoardItem[]>(normalizedInitialBoards);
  const [activeBoardId, setActiveBoardId] = useState<string>(
    initialActiveBoardId || normalizedInitialBoards[0]?.id || "default-board"
  );
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [boardModalState, setBoardModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "rename" | "delete";
    board?: BoardItem;
  }>({
    isOpen: false,
    mode: "create",
  });

  const boardDropdownRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown de boards se clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        boardDropdownRef.current &&
        !boardDropdownRef.current.contains(e.target as unknown as globalThis.Node)
      ) {
        setIsBoardDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentBoard = useMemo(() => {
    return boards.find((b) => b.id === activeBoardId) || boards[0];
  }, [boards, activeBoardId]);

  // -------------------------------------------------------------------
  // 2. Estados dos Dados da Campanha
  // -------------------------------------------------------------------
  const [cards, setCards] = useState<any[]>(initialCards);
  const [tags, setTags] = useState<any[]>(initialTags);
  const [pages, setPages] = useState<any[]>(initialPages);

  // -------------------------------------------------------------------
  // 3. Estados de UI, Painéis e Notificações
  // -------------------------------------------------------------------
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedCardForEdit, setSelectedCardForEdit] = useState<any | null>(null);
  const [lockedEdgeWarning, setLockedEdgeWarning] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<{
    type: "success" | "info" | "warning";
    message: string;
  } | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [isCreatingCard, setIsCreatingCard] = useState(false);

  // Estado do Modal de Importação de Referências ao Soltar Card
  const [pendingDrop, setPendingDrop] = useState<{
    card: any;
    position: { x: number; y: number };
    references: DetectedReference[];
  } | null>(null);

  // -------------------------------------------------------------------
  // 4. Parse dos nós e edges do Board Ativo
  // -------------------------------------------------------------------
  const parseBoardData = useCallback((dataStr?: string | null) => {
    if (!dataStr) return { nodes: [], edges: [] };
    try {
      const parsed = typeof dataStr === "string" ? JSON.parse(dataStr) : dataStr;
      return {
        nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
        edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      };
    } catch {
      return { nodes: [], edges: [] };
    }
  }, []);

  const initialFlow = useMemo(() => {
    return parseBoardData(currentBoard?.data);
  }, [currentBoard, parseBoardData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------------
  // 5. Persistência e Auto-Save do Board Ativo
  // -------------------------------------------------------------------
  const saveBoardToDatabase = useCallback(
    async (boardId: string, currentNodes: Node[], currentEdges: Edge[]) => {
      setSaveStatus("saving");
      try {
        const payload = {
          data: {
            nodes: currentNodes,
            edges: currentEdges,
          },
        };

        // Salva na rota de board individual
        const res = await fetch(`/api/projects/${projectId}/boards/${boardId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          // Fallback para rota global de whiteboard
          await fetch(`/api/projects/${projectId}/whiteboard`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ whiteboardData: payload.data }),
          });
        }

        // Atualiza a representação do board em memória
        setBoards((prev) =>
          prev.map((b) =>
            b.id === boardId
              ? { ...b, data: JSON.stringify(payload.data) }
              : b
          )
        );

        setSaveStatus("saved");
      } catch (err) {
        console.error("Erro ao salvar board:", err);
        setSaveStatus("unsaved");
      }
    },
    [projectId]
  );

  const triggerAutoSave = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      setSaveStatus("unsaved");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveBoardToDatabase(activeBoardId, newNodes, newEdges);
      }, 900);
    },
    [activeBoardId, saveBoardToDatabase]
  );

  // -------------------------------------------------------------------
  // 6. Troca de Board
  // -------------------------------------------------------------------
  const handleSwitchBoard = useCallback(
    (targetBoardId: string) => {
      if (targetBoardId === activeBoardId) {
        setIsBoardDropdownOpen(false);
        return;
      }

      // Salva imediatamente o estado do board atual antes de alternar
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveBoardToDatabase(activeBoardId, nodes, edges);

      const targetBoard = boards.find((b) => b.id === targetBoardId);
      if (targetBoard) {
        const flowData = parseBoardData(targetBoard.data);
        setNodes(flowData.nodes);
        setEdges(flowData.edges);
        setActiveBoardId(targetBoardId);
        setIsBoardDropdownOpen(false);

        // Atualiza a URL sem recarregar a página
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("boardId", targetBoardId);
          window.history.replaceState({}, "", url.toString());
        }
      }
    },
    [activeBoardId, boards, nodes, edges, saveBoardToDatabase, parseBoardData, setNodes, setEdges]
  );

  // -------------------------------------------------------------------
  // 7. Tipos Customizados de Nós e Arestas
  // -------------------------------------------------------------------
  const nodeTypes = useMemo(
    () => ({
      cardNode: WhiteboardCardNode,
      wikiNode: WhiteboardWikiNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      referenceEdge: WhiteboardReferenceEdge,
    }),
    []
  );

  // Função para criar dados de visualização para um CardNode
  const createCardNodeData = useCallback(
    (card: any): CardNodeData => {
      const tag = tags.find((t) => t.id === card.tagId || t.name === card.category);
      const tagColor = tag?.color || "#38bdf8";

      let properties: Record<string, any> = {};
      try {
        properties =
          typeof card.properties === "string" ? JSON.parse(card.properties) : card.properties || {};
      } catch {}

      let customFields: any[] = [];
      try {
        customFields =
          typeof card.customFields === "string"
            ? JSON.parse(card.customFields)
            : card.customFields || [];
      } catch {}

      const fieldsPreview: Array<{ label: string; value: string }> = [];
      for (const f of customFields.slice(0, 3)) {
        const val = properties[f.id];
        if (val && typeof val === "string" && !val.startsWith("card:") && !val.startsWith("http")) {
          fieldsPreview.push({ label: f.label, value: val });
        }
      }

      const refs = extractCardReferences(card, cards, pages);

      return {
        id: card.id,
        title: card.title,
        category: card.category || tag?.name || "Card",
        tagColor,
        coverImage: card.coverImage,
        icon: card.icon,
        fieldsPreview,
        referenceCount: refs.length,
        onOpenDrawer: (cardId: string) => {
          const found = cards.find((c) => c.id === cardId);
          if (found) setSelectedCardForEdit(found);
        },
        onBringReferences: (cardId: string) => {
          handleBringReferences(cardId);
        },
      };
    },
    [tags, cards, pages]
  );

  // Atualiza visualização dos nós de cards se os dados mudarem
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((n) => {
        if (n.type === "cardNode") {
          const card = cards.find((c) => c.id === n.id);
          if (card) {
            return {
              ...n,
              data: createCardNodeData(card),
            };
          }
        }
        return n;
      })
    );
  }, [cards, tags, pages, createCardNodeData, setNodes]);

  // -------------------------------------------------------------------
  // 8. REGRA 3: O BOARD DEVE ATUALIZAR AUTOMATICAMENTE COM OS NOVOS
  //    RELACIONAMENTOS CRIADOS ENTRE OS CARDS
  // -------------------------------------------------------------------
  useEffect(() => {
    const currentCardNodes = nodes.filter((n) => n.type === "cardNode");
    if (currentCardNodes.length === 0) return;

    const canvasNodeIds = new Set(nodes.map((n) => n.id));

    setEdges((prevEdges) => {
      let changed = false;
      const edgeMap = new Map<string, Edge>();
      for (const e of prevEdges) {
        edgeMap.set(e.id, e);
      }

      for (const node of currentCardNodes) {
        const card = cards.find((c) => c.id === node.id);
        if (!card) continue;

        const refs = extractCardReferences(card, cards, pages);
        const activeRefTargetIds = new Set<string>();

        for (const ref of refs) {
          // Se o destino também está presente no quadro, garante a interligação
          if (canvasNodeIds.has(ref.id)) {
            activeRefTargetIds.add(ref.id);
            const edgeId = `edge-${card.id}-${ref.id}`;

            if (!edgeMap.has(edgeId)) {
              edgeMap.set(edgeId, {
                id: edgeId,
                source: card.id,
                target: ref.id,
                type: "referenceEdge",
                animated: true,
                data: {
                  label: ref.fieldLabel || "Referência",
                  sourceType: ref.sourceType,
                  isContentReference: true,
                },
              });
              changed = true;
            }
          }
        }

        // Se uma aresta automática existia mas o card não tem mais essa referência, remove
        for (const [eId, edge] of Array.from(edgeMap.entries())) {
          if (
            edge.source === card.id &&
            edge.data?.isContentReference &&
            !activeRefTargetIds.has(edge.target)
          ) {
            edgeMap.delete(eId);
            changed = true;
          }
        }
      }

      if (changed) {
        const newEdgesList = Array.from(edgeMap.values());
        triggerAutoSave(nodes, newEdgesList);
        return newEdgesList;
      }
      return prevEdges;
    });
  }, [cards, pages, nodes, triggerAutoSave, setEdges]);

  // -------------------------------------------------------------------
  // 9. REGRA 4: CRIAR NOVO RELACIONAMENTO NO BOARD ARRASTANDO CONEXÃO
  //    O card que iniciou o relacionamento recebe no final do markdown a nova menção!
  // -------------------------------------------------------------------
  const handleConnect = useCallback(
    async (connection: Connection) => {
      const { source, target } = connection;
      if (!source || !target || source === target) return;

      const sourceCard = cards.find((c) => c.id === source);
      if (!sourceCard) {
        // Se a origem não for um card (ex: wiki), apenas cria a conexão visual
        const edgeId = `edge-${source}-${target}-${Date.now().toString().slice(-4)}`;
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              id: edgeId,
              type: "referenceEdge",
              animated: true,
              data: {
                label: "Conexão",
                sourceType: "mention",
                isContentReference: false,
              },
            },
            eds
          )
        );
        return;
      }

      const targetCard = cards.find((c) => c.id === target);
      const targetPage = pages.find((p) => p.id === target);
      if (!targetCard && !targetPage) return;

      const targetTitle = targetCard?.title || targetPage?.title || "Item";
      const targetType = targetCard ? "card" : "wiki";
      const targetId = targetCard ? targetCard.id : targetPage.id;

      // Snippet padronizado de menção compatível com TipTap e Markdown
      const mentionBadgeHtml = `\n\n<p><span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-medium cursor-pointer hover:bg-amber-500/25 transition not-prose mention-badge" data-type="mention" data-id="${targetId}" data-label="${targetTitle}" data-mention-suggestion-char="@" data-entity-type="${targetType}">@${targetTitle}</span></p>`;

      const currentMarkdown = sourceCard.contentMarkdown || "";
      const updatedMarkdown = currentMarkdown + mentionBadgeHtml;

      // 1. Atualiza o card de origem no banco de dados
      try {
        await fetch(`/api/cards/${sourceCard.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentMarkdown: updatedMarkdown,
          }),
        });

        // 2. Atualiza os dados do card em memória
        setCards((prev) =>
          prev.map((c) =>
            c.id === sourceCard.id ? { ...c, contentMarkdown: updatedMarkdown } : c
          )
        );

        if (selectedCardForEdit?.id === sourceCard.id) {
          setSelectedCardForEdit((prev: any) =>
            prev ? { ...prev, contentMarkdown: updatedMarkdown } : prev
          );
        }

        // 3. Adiciona a aresta protegida ao board
        const edgeId = `edge-${sourceCard.id}-${targetId}`;
        const newEdge: Edge = {
          id: edgeId,
          source: sourceCard.id,
          target: targetId,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          type: "referenceEdge",
          animated: true,
          data: {
            label: "Menção @",
            sourceType: "mention",
            isContentReference: true,
          },
        };

        setEdges((eds) => {
          const filtered = eds.filter((e) => e.id !== edgeId);
          const updated = [...filtered, newEdge];
          triggerAutoSave(nodes, updated);
          return updated;
        });

        // 4. Notificação de Sucesso
        setNotificationToast({
          type: "success",
          message: `✨ Novo relacionamento criado! Referência a "${targetTitle}" adicionada ao card "${sourceCard.title}".`,
        });
        setTimeout(() => setNotificationToast(null), 4000);
      } catch (err) {
        console.error("Erro ao salvar referência no card de origem:", err);
      }
    },
    [cards, pages, selectedCardForEdit, nodes, triggerAutoSave, setCards, setEdges]
  );

  // -------------------------------------------------------------------
  // 10. REGRA 5: CRIAR CARD NOVO PELO BOARD E ABRIR IMEDIATAMENTE PARA EDIÇÃO
  // -------------------------------------------------------------------
  const handleCreateNewCard = useCallback(async () => {
    if (isCreatingCard) return;
    setIsCreatingCard(true);

    try {
      const defaultTag = tags[0];
      const category = defaultTag ? defaultTag.name : "Personagem / NPC";
      const tagId = defaultTag ? defaultTag.id : null;

      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worldId: projectId,
          title: "Novo Card",
          category,
          tagId,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao criar novo card");
      }

      const json = await res.json();
      const createdCard = json.card;

      // 1. Adiciona aos cards locais
      setCards((prev) => [createdCard, ...prev]);

      // 2. Calcula posição no centro da tela atual do board
      const centerPos = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      // 3. Insere o nó no board
      const newNode: Node = {
        id: createdCard.id,
        type: "cardNode",
        position: centerPos,
        data: createCardNodeData(createdCard),
      };

      setNodes((prevNodes) => {
        const updated = [...prevNodes, newNode];
        triggerAutoSave(updated, edges);
        return updated;
      });

      // 4. Abre imediatamente a gaveta lateral direita para edição!
      setSelectedCardForEdit(createdCard);

      setNotificationToast({
        type: "success",
        message: `Card criado e adicionado ao board! Editando na lateral direita.`,
      });
      setTimeout(() => setNotificationToast(null), 3500);
    } catch (err) {
      console.error("Erro ao criar card pelo board:", err);
    } finally {
      setIsCreatingCard(false);
    }
  }, [
    isCreatingCard,
    tags,
    projectId,
    reactFlowInstance,
    createCardNodeData,
    edges,
    triggerAutoSave,
    setNodes,
  ]);

  // -------------------------------------------------------------------
  // 11. Modal e Gestão de Múltiplos Boards
  // -------------------------------------------------------------------
  const handleCreateBoardSubmit = useCallback(
    async (formData: { name: string; description: string }) => {
      const res = await fetch(`/api/projects/${projectId}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          data: { nodes: [], edges: [] },
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao criar novo board");
      }

      const json = await res.json();
      const newBoard: BoardItem = json.board;

      // Salva o board atual antes de mudar
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      await saveBoardToDatabase(activeBoardId, nodes, edges);

      setBoards((prev) => [...prev, newBoard]);
      setActiveBoardId(newBoard.id);
      setNodes([]);
      setEdges([]);

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("boardId", newBoard.id);
        window.history.replaceState({}, "", url.toString());
      }

      setNotificationToast({
        type: "success",
        message: `Board "${newBoard.name}" criado com sucesso!`,
      });
      setTimeout(() => setNotificationToast(null), 3000);
    },
    [projectId, activeBoardId, nodes, edges, saveBoardToDatabase, setNodes, setEdges]
  );

  const handleRenameBoardSubmit = useCallback(
    async (formData: { name: string; description: string }) => {
      const res = await fetch(`/api/projects/${projectId}/boards/${activeBoardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao renomear board");
      }

      setBoards((prev) =>
        prev.map((b) =>
          b.id === activeBoardId
            ? { ...b, name: formData.name, description: formData.description }
            : b
        )
      );

      setNotificationToast({
        type: "success",
        message: `Board renomeado para "${formData.name}"!`,
      });
      setTimeout(() => setNotificationToast(null), 3000);
    },
    [projectId, activeBoardId]
  );

  const handleDeleteBoardConfirm = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/boards/${activeBoardId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || "Falha ao excluir board");
    }

    const json = await res.json();
    const nextBoard: BoardItem = json.nextBoard;

    const remainingBoards = boards.filter((b) => b.id !== activeBoardId);
    setBoards(remainingBoards);

    if (nextBoard) {
      const flow = parseBoardData(nextBoard.data);
      setActiveBoardId(nextBoard.id);
      setNodes(flow.nodes);
      setEdges(flow.edges);

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("boardId", nextBoard.id);
        window.history.replaceState({}, "", url.toString());
      }
    }

    setNotificationToast({
      type: "info",
      message: "Board excluído com sucesso.",
    });
    setTimeout(() => setNotificationToast(null), 3000);
  }, [projectId, activeBoardId, boards, parseBoardData, setNodes, setEdges]);

  // -------------------------------------------------------------------
  // 12. Expandir Referências Conectadas a um Card Sob Demanda
  // -------------------------------------------------------------------
  const handleBringReferences = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      const originNode = nodes.find((n) => n.id === cardId);
      const originPos = originNode?.position || { x: 500, y: 300 };

      const refs = extractCardReferences(card, cards, pages);
      if (refs.length === 0) {
        setLockedEdgeWarning(`O card "${card.title}" não possui referências registradas.`);
        setTimeout(() => setLockedEdgeWarning(null), 3000);
        return;
      }

      const existingNodeIds = new Set(nodes.map((n) => n.id));
      const existingEdgeIds = new Set(edges.map((e) => e.id));

      const newNodesToAdd: Node[] = [];
      const newEdgesToAdd: Edge[] = [];

      let angleStep = (2 * Math.PI) / Math.max(refs.length, 1);

      refs.forEach((ref, idx) => {
        const edgeId = `edge-${card.id}-${ref.id}`;

        if (!existingNodeIds.has(ref.id)) {
          const radius = 280;
          const posX = originPos.x + Math.cos(idx * angleStep) * radius;
          const posY = originPos.y + Math.sin(idx * angleStep) * radius;

          if (ref.type === "card") {
            const targetCard = cards.find((c) => c.id === ref.id);
            if (targetCard) {
              newNodesToAdd.push({
                id: targetCard.id,
                type: "cardNode",
                position: { x: posX, y: posY },
                data: createCardNodeData(targetCard),
              });
              existingNodeIds.add(targetCard.id);
            }
          } else {
            const targetPage = pages.find((p) => p.id === ref.id);
            if (targetPage) {
              newNodesToAdd.push({
                id: targetPage.id,
                type: "wikiNode",
                position: { x: posX, y: posY },
                data: {
                  id: targetPage.id,
                  title: targetPage.title,
                  category: targetPage.category,
                  onOpenWiki: (pageId: string) => {
                    window.open(`/project/${projectId}/wiki/${pageId}`, "_blank");
                  },
                },
              });
              existingNodeIds.add(targetPage.id);
            }
          }
        }

        if (!existingEdgeIds.has(edgeId)) {
          newEdgesToAdd.push({
            id: edgeId,
            source: card.id,
            target: ref.id,
            type: "referenceEdge",
            animated: true,
            data: {
              label: ref.fieldLabel || "Referência",
              sourceType: ref.sourceType,
              isContentReference: true,
            },
          });
          existingEdgeIds.add(edgeId);
        }
      });

      const updatedNodes = [...nodes, ...newNodesToAdd];
      const updatedEdges = [...edges, ...newEdgesToAdd];

      setNodes(updatedNodes);
      setEdges(updatedEdges);
      triggerAutoSave(updatedNodes, updatedEdges);
    },
    [cards, pages, nodes, edges, createCardNodeData, projectId, setNodes, setEdges, triggerAutoSave]
  );

  // -------------------------------------------------------------------
  // 13. Drag and Drop no Canvas
  // -------------------------------------------------------------------
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const rawData = e.dataTransfer.getData("application/worldbuild-board-item");
      if (!rawData) return;

      try {
        const item = JSON.parse(rawData);
        const position = reactFlowInstance.screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        });

        if (item.type === "card") {
          const card = cards.find((c) => c.id === item.id);
          if (!card) return;

          const refs = extractCardReferences(card, cards, pages);

          if (refs.length > 0) {
            setPendingDrop({
              card,
              position,
              references: refs,
            });
          } else {
            insertCardNode(card, position, []);
          }
        } else if (item.type === "wiki") {
          const page = pages.find((p) => p.id === item.id);
          if (!page) return;

          const existing = nodes.find((n) => n.id === page.id);
          if (!existing) {
            const newNode: Node = {
              id: page.id,
              type: "wikiNode",
              position,
              data: {
                id: page.id,
                title: page.title,
                category: page.category,
                onOpenWiki: (pageId: string) => {
                  window.open(`/project/${projectId}/wiki/${pageId}`, "_blank");
                },
              },
            };
            const updated = [...nodes, newNode];
            setNodes(updated);
            triggerAutoSave(updated, edges);
          }
        }
      } catch (err) {
        console.error("Erro ao processar drop no board:", err);
      }
    },
    [cards, pages, nodes, edges, reactFlowInstance, projectId, setNodes, triggerAutoSave]
  );

  const insertCardNode = useCallback(
    (
      card: any,
      position: { x: number; y: number },
      selectedRefsToImport: DetectedReference[]
    ) => {
      const existingNodeIds = new Set(nodes.map((n) => n.id));
      const existingEdgeIds = new Set(edges.map((e) => e.id));

      const newNodesToAdd: Node[] = [];
      const newEdgesToAdd: Edge[] = [];

      if (!existingNodeIds.has(card.id)) {
        newNodesToAdd.push({
          id: card.id,
          type: "cardNode",
          position,
          data: createCardNodeData(card),
        });
        existingNodeIds.add(card.id);
      }

      const angleStep = (2 * Math.PI) / Math.max(selectedRefsToImport.length, 1);
      selectedRefsToImport.forEach((ref, idx) => {
        const edgeId = `edge-${card.id}-${ref.id}`;

        if (!existingNodeIds.has(ref.id)) {
          const radius = 290;
          const posX = position.x + Math.cos(idx * angleStep) * radius;
          const posY = position.y + Math.sin(idx * angleStep) * radius;

          if (ref.type === "card") {
            const targetCard = cards.find((c) => c.id === ref.id);
            if (targetCard) {
              newNodesToAdd.push({
                id: targetCard.id,
                type: "cardNode",
                position: { x: posX, y: posY },
                data: createCardNodeData(targetCard),
              });
              existingNodeIds.add(targetCard.id);
            }
          } else {
            const targetPage = pages.find((p) => p.id === ref.id);
            if (targetPage) {
              newNodesToAdd.push({
                id: targetPage.id,
                type: "wikiNode",
                position: { x: posX, y: posY },
                data: {
                  id: targetPage.id,
                  title: targetPage.title,
                  category: targetPage.category,
                  onOpenWiki: (pageId: string) => {
                    window.open(`/project/${projectId}/wiki/${pageId}`, "_blank");
                  },
                },
              });
              existingNodeIds.add(targetPage.id);
            }
          }
        }

        if (!existingEdgeIds.has(edgeId)) {
          newEdgesToAdd.push({
            id: edgeId,
            source: card.id,
            target: ref.id,
            type: "referenceEdge",
            animated: true,
            data: {
              label: ref.fieldLabel || "Referência",
              sourceType: ref.sourceType,
              isContentReference: true,
            },
          });
          existingEdgeIds.add(edgeId);
        }
      });

      const finalNodes = [...nodes, ...newNodesToAdd];
      const finalEdges = [...edges, ...newEdgesToAdd];

      setNodes(finalNodes);
      setEdges(finalEdges);
      triggerAutoSave(finalNodes, finalEdges);
    },
    [nodes, edges, cards, pages, createCardNodeData, projectId, setNodes, setEdges, triggerAutoSave]
  );

  const handleConfirmImportReferences = useCallback(
    ({ bringCardRefs, bringWikiRefs }: { bringCardRefs: boolean; bringWikiRefs: boolean }) => {
      if (!pendingDrop) return;

      const { card, position, references } = pendingDrop;
      const selectedRefs = references.filter((r) => {
        if (r.type === "card" && bringCardRefs) return true;
        if (r.type === "wiki" && bringWikiRefs) return true;
        return false;
      });

      insertCardNode(card, position, selectedRefs);
      setPendingDrop(null);
    },
    [pendingDrop, insertCardNode]
  );

  // -------------------------------------------------------------------
  // 14. REGRA DE PROTEÇÃO: IMPEDIR QUE ARESTAS DE CONTEÚDO SEJAM DELETADAS DIRETAMENTE
  // -------------------------------------------------------------------
  const handleEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      const protectedEdges = edgesToDelete.filter((e) => e.data?.isContentReference);
      if (protectedEdges.length > 0) {
        setLockedEdgeWarning(
          "🔒 Esta interligação é gerada automaticamente pelo conteúdo/campos do card. Para removê-la, edite o card correspondente e retire a referência."
        );
        setTimeout(() => setLockedEdgeWarning(null), 5000);

        setEdges((eds) => {
          const ids = new Set(eds.map((e) => e.id));
          const restored = [...eds];
          for (const pe of protectedEdges) {
            if (!ids.has(pe.id)) restored.push(pe);
          }
          return restored;
        });
      }
    },
    [setEdges]
  );

  // Clique em nó: Se for card, abre gaveta lateral para edição
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "cardNode") {
        const found = cards.find((c) => c.id === node.id);
        if (found) {
          setSelectedCardForEdit(found);
        }
      }
    },
    [cards]
  );

  // Sincronização ao editar o card no Drawer lateral direito
  const handleCardUpdatedInDrawer = useCallback(
    (cardId: string, updatedData: any) => {
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, ...updatedData } : c))
      );
    },
    [setCards]
  );

  const handleAddCardToCenter = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;
      const center = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      const refs = extractCardReferences(card, cards, pages);
      if (refs.length > 0) {
        setPendingDrop({ card, position: center, references: refs });
      } else {
        insertCardNode(card, center, []);
      }
    },
    [cards, pages, reactFlowInstance, insertCardNode]
  );

  const handleAddWikiToCenter = useCallback(
    (pageId: string) => {
      const page = pages.find((p) => p.id === pageId);
      if (!page) return;
      const center = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      if (!nodes.some((n) => n.id === page.id)) {
        const newNode: Node = {
          id: page.id,
          type: "wikiNode",
          position: center,
          data: {
            id: page.id,
            title: page.title,
            category: page.category,
            onOpenWiki: (pid: string) => {
              window.open(`/project/${projectId}/wiki/${pid}`, "_blank");
            },
          },
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        triggerAutoSave(updated, edges);
      }
    },
    [pages, reactFlowInstance, nodes, edges, projectId, setNodes, triggerAutoSave]
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0c10] select-none">
      {/* Barra de Navegação Superior (com Board após Cards) */}
      <ProjectHeader projectId={projectId} projectName={projectName} user={user} />

      {/* Área Principal de Trabalho */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 1. Barra Lateral com Cards e Wiki Arrastáveis + Botão Novo Card */}
        <WhiteboardSidebar
          cards={cards}
          pages={pages}
          tags={tags}
          onAddCardToCenter={handleAddCardToCenter}
          onAddWikiToCenter={handleAddWikiToCenter}
          onCreateNewCard={handleCreateNewCard}
          isCreatingCard={isCreatingCard}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* 2. Canvas do React Flow com Fundo e Controles */}
        <div
          className="flex-1 h-full relative"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Barra Superior Flutuante: Seletor de Boards + Criar Novo Card */}
          <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
            {/* Dropdown de Seleção de Boards */}
            <div className="relative" ref={boardDropdownRef}>
              <button
                type="button"
                onClick={() => setIsBoardDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141724]/90 hover:bg-[#1a1e2e] border border-slate-800 text-xs font-semibold text-white backdrop-blur-md shadow-xl transition"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-purple-400" />
                <span className="max-w-[160px] truncate">{currentBoard?.name || "Quadro Principal"}</span>
                <span className="text-[10px] text-slate-500 font-mono">({boards.length})</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {isBoardDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-64 rounded-2xl bg-[#141724] border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Quadros do Projeto</span>
                    <span className="text-slate-500 font-mono">{boards.length}</span>
                  </div>

                  <div className="my-1 max-h-56 overflow-y-auto space-y-1">
                    {boards.map((b) => {
                      const isActive = b.id === activeBoardId;
                      return (
                        <div
                          key={b.id}
                          className={`flex items-center justify-between gap-1 p-2 rounded-xl text-xs transition cursor-pointer ${
                            isActive
                              ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40"
                              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                          }`}
                          onClick={() => handleSwitchBoard(b.id)}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                            <span className="truncate">{b.name}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {isActive && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsBoardDropdownOpen(false);
                                  setBoardModalState({
                                    isOpen: true,
                                    mode: "rename",
                                    board: b,
                                  });
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-purple-300 hover:bg-slate-700/60 transition"
                                title="Renomear board"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                            )}

                            {boards.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsBoardDropdownOpen(false);
                                  setBoardModalState({
                                    isOpen: true,
                                    mode: "delete",
                                    board: b,
                                  });
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition"
                                title="Excluir board"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBoardDropdownOpen(false);
                        setBoardModalState({
                          isOpen: true,
                          mode: "create",
                        });
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Criar Novo Board</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botão Rápido: Novo Card no Board */}
            <button
              type="button"
              onClick={handleCreateNewCard}
              disabled={isCreatingCard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141724]/90 hover:bg-[#1a1e2e] border border-slate-800 text-xs font-semibold text-sky-400 hover:text-sky-300 backdrop-blur-md shadow-xl transition disabled:opacity-50"
              title="Criar novo card e abrir para edição"
            >
              <Plus className="h-3.5 w-3.5 text-sky-400" />
              <span>{isCreatingCard ? "Criando..." : "Novo Card"}</span>
            </button>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) => {
              onNodesChange(changes);
              triggerAutoSave(nodes, edges);
            }}
            onEdgesChange={(changes) => {
              onEdgesChange(changes);
              triggerAutoSave(nodes, edges);
            }}
            onConnect={handleConnect}
            onEdgesDelete={handleEdgesDelete}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2}
            defaultEdgeOptions={{ type: "referenceEdge" }}
            className="bg-[#0b0d14]"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1.5}
              color="#222838"
            />
            <Controls className="!bg-[#141724] !border-slate-800 !text-slate-300 !rounded-xl !shadow-2xl fill-white" />
            <MiniMap
              nodeColor={(n) => (n.type === "cardNode" ? "#38bdf8" : "#f59e0b")}
              maskColor="rgba(10, 12, 16, 0.75)"
              className="!bg-[#141724] !border-slate-800 !rounded-xl overflow-hidden"
            />
          </ReactFlow>

          {/* Toast / Alerta de Conexão Travada */}
          {lockedEdgeWarning && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs font-semibold backdrop-blur-md shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-150">
              <Lock className="h-4 w-4 text-amber-400 shrink-0" />
              <span>{lockedEdgeWarning}</span>
            </div>
          )}

          {/* Toast de Notificação de Ação (ex: criação de relacionamento ou novo card) */}
          {notificationToast && (
            <div
              className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold backdrop-blur-md shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-150 ${
                notificationToast.type === "success"
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                  : "bg-sky-500/20 border-sky-500/50 text-sky-200"
              }`}
            >
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{notificationToast.message}</span>
            </div>
          )}

          {/* Barra de Status Inferior */}
          <div className="absolute bottom-3 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141724]/90 border border-slate-800 backdrop-blur-md text-[11px] text-slate-400 shadow-xl">
            <span
              className={`h-2 w-2 rounded-full ${
                saveStatus === "saved"
                  ? "bg-emerald-400"
                  : saveStatus === "saving"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-slate-500"
              }`}
            />
            <span>
              {saveStatus === "saved"
                ? "Quadro Salvo"
                : saveStatus === "saving"
                ? "Salvando alterações..."
                : "Alterações pendentes"}
            </span>
            <span className="text-slate-600">•</span>
            <span>
              {nodes.length} nós • {edges.length} interligações
            </span>
          </div>
        </div>

        {/* 3. Gaveta Lateral Direita: Edição Completa do Card Clicado */}
        <WhiteboardSideDrawer
          card={selectedCardForEdit}
          projectId={projectId}
          tags={tags}
          allPages={pages}
          allCards={cards}
          onClose={() => setSelectedCardForEdit(null)}
          onCardUpdated={handleCardUpdatedInDrawer}
          onTagsUpdated={(newTags) => setTags(newTags)}
        />
      </div>

      {/* 4. Modal de Importação de Referências ao Soltar Card */}
      <ImportReferencesModal
        isOpen={!!pendingDrop}
        card={pendingDrop?.card}
        references={pendingDrop?.references || []}
        onClose={() => setPendingDrop(null)}
        onConfirm={handleConfirmImportReferences}
      />

      {/* 5. Modal de Criação / Renomeação / Exclusão de Boards */}
      <BoardModal
        isOpen={boardModalState.isOpen}
        mode={boardModalState.mode}
        initialName={boardModalState.board?.name || currentBoard?.name}
        initialDescription={boardModalState.board?.description || currentBoard?.description || ""}
        boardCount={boards.length}
        onClose={() => setBoardModalState({ isOpen: false, mode: "create" })}
        onSubmit={
          boardModalState.mode === "create"
            ? handleCreateBoardSubmit
            : handleRenameBoardSubmit
        }
        onDeleteConfirm={handleDeleteBoardConfirm}
      />
    </div>
  );
}

export function WhiteboardClientContainer(props: WhiteboardClientContainerProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
