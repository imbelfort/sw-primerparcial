"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Toolbox, type Tool } from "../../../components/Toolbox";
import { Inspector, type ClassData } from "../../../components/Inspector";
import { LinkInspector } from "../../../components/LinkInspector";
import { ZoomControls } from "../../../components/ZoomControls";
import {
  createUmlNode as createUmlNodeLib,
  createUmlLink as createUmlLinkLib,
  getClassDataFromCell,
  applyClassDataToCell,
  getLinkDataFromCell,
  applyLinkDataToCell,
} from "../../../lib/umlTools";
import io, { Socket } from "socket.io-client";
import * as joint from "jointjs";
import "jointjs/dist/joint.css";

export default function DiagramByIdPage() {
  const params = useParams<{ id: string }>();
  const diagramId = params?.id as string;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<joint.dia.Graph | null>(null);
  const paperRef = useRef<joint.dia.Paper | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const suppressRemoteRef = useRef(false);
  const [peerCursors, setPeerCursors] = useState<Record<string, { xPct: number; yPct: number; color: string; ts: number }>>({});
  const [tool, setTool] = useState<Tool>("select");
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ClassData | null>(null);
  const [linkSelected, setLinkSelected] = useState<ReturnType<typeof getLinkDataFromCell> | null>(null);
  // Refs to avoid stale closures inside JointJS event handlers
  const toolRef = useRef<Tool>("select");
  useEffect(() => { toolRef.current = tool; }, [tool]);
  const linkSourceRef = useRef<string | null>(null);
  useEffect(() => { linkSourceRef.current = linkSourceId; }, [linkSourceId]);
  const [pendingLinkAnchor, setPendingLinkAnchor] = useState<{ x: number; y: number } | null>(null);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ visible: boolean; x: number; y: number; cellId: string | null }>({
    visible: false,
    x: 0,
    y: 0,
    cellId: null,
  });

  // Delete handler available to UI and keyboard
  const handleDeleteSelected = useCallback(() => {
    // Delete node
    if (selected) {
      const cell = graphRef.current?.getCell(selected.id) as any;
      if (cell && typeof cell.remove === "function") {
        cell.remove();
        setSelected(null);
      }
      return;
    }
    // Delete link
    if (linkSelected) {
      const cell = graphRef.current?.getCell(linkSelected.id) as any;
      if (cell && typeof cell.remove === "function") {
        cell.remove();
        setLinkSelected(null);
      }
      return;
    }
  }, [selected?.id]);

  // Keyboard delete support (Delete / Backspace outside inputs)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selected) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      const isEditable = el?.isContentEditable;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || isEditable;
      if (typing) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected?.id, handleDeleteSelected]);

  // Init JointJS
  useEffect(() => {
    if (!canvasRef.current) return;

    const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
    const paper = new joint.dia.Paper({
      el: canvasRef.current,
      model: graph,
      width: "100%",
      height: "100%",
      gridSize: 1,
      drawGrid: { name: "dot", args: { color: "#e0e0e0" } },
      background: { color: "#f8fafc" },
      cellViewNamespace: joint.shapes,
      defaultConnectionPoint: { name: "boundary", args: { sticky: true } },
      defaultConnector: { name: "rounded" },
      defaultConnectionArgs: { attrs: { line: { stroke: "#64748b", strokeWidth: 2 } } },
      snapLinks: { radius: 75 },
      linkPinning: false,
      // Habilitar interacciones táctiles y de ratón
      interactive: true,
      // Habilitar el zoom con la rueda del ratón
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
        minScale: 0.1,
        maxScale: 4,
      },
      // Configuración del zoom con gestos
      guard: () => false, // Evita la selección de texto al hacer zoom
    });

    graphRef.current = graph;
    paperRef.current = paper;

    // Toolbox interactions using helpers
    const createUmlNode = (kind: string, x: number, y: number) => {
      const g = graphRef.current;
      if (!g) return;
      createUmlNodeLib(kind as any, g, x, y);
    };

    const createLink = (kind: string, sourceId: string, targetId: string) => {
      const g = graphRef.current;
      if (!g) return;
      createUmlLinkLib(kind as any, g, sourceId, targetId);
    };

    const pAny: any = paper;
    // Add node on blank click if a node tool is active
    const onBlankPointerDown = (_evt: any, x: number, y: number) => {
      const currentTool = toolRef.current;
      if (currentTool === "uml-class" || currentTool === "uml-interface" || currentTool === "uml-abstract") {
        createUmlNode(currentTool, x, y);
        return;
      }
      if (currentTool === "select") {
        setSelected(null);
      }
      // Cancel pending link if any
      if (linkSourceRef.current) {
        setLinkSourceId(null);
        setPendingLinkAnchor(null);
      }
    };
    // Link creation via two clicks on cells
    const onCellPointerDown = (cellView: any, evt?: MouseEvent, ex?: number, ey?: number) => {
      const currentTool = toolRef.current;
      if (currentTool === "assoc" || currentTool === "generalization" || currentTool === "aggregation" || currentTool === "composition" || currentTool === "dependency") {
        const model = cellView?.model;
        const isLink = model?.isLink?.() || model?.get?.("type")?.includes("Link");
        if (isLink) {
          // Ignore links as endpoints; show a short hint
          setBannerMsg("Haz clic sobre un nodo (no un enlace)");
          setTimeout(() => setBannerMsg((m) => (m === "Haz clic sobre un nodo (no un enlace)" ? null : m)), 1200);
          return;
        }
        const id = model?.id;
        if (!id) return;
        if (!linkSourceRef.current) {
          setLinkSourceId(id);
          // Compute anchor position in canvas coords for visual hint
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const cx = typeof ex === "number" ? ex : (evt ? evt.clientX - rect.left : rect.width / 2);
            const cy = typeof ey === "number" ? ey : (evt ? evt.clientY - rect.top : rect.height / 2);
            setPendingLinkAnchor({ x: cx, y: cy });
          }
        } else {
          const sourceId = linkSourceRef.current!;
          setLinkSourceId(null);
          createLink(currentTool, sourceId, id);
          setPendingLinkAnchor(null);
        }
        return;
      }
      if (currentTool === "select") {
        const model = cellView?.model;
        if (!model) return;
        const isLink = model.isLink?.() || model.get?.("type")?.includes("Link");
        if (isLink) {
          const ld = getLinkDataFromCell(model);
          setLinkSelected(ld);
          setSelected(null);
          return;
        }
        const data = getClassDataFromCell(model);
        if (data) {
          setSelected({
            id: data.id,
            kind: data.kind,
            name: data.name,
            attributes: data.attributes,
            methods: data.methods,
          });
          setLinkSelected(null);
        }
      }
    };
    pAny.on("blank:pointerdown", onBlankPointerDown);
    pAny.on("cell:pointerdown", onCellPointerDown);
    // Context menu for delete on nodes and links
    const onCellContextMenu = (cellView: any, evt: MouseEvent) => {
      evt.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const id = cellView?.model?.id as string | undefined;
      setCtxMenu({
        visible: true,
        x: Math.max(0, evt.clientX - rect.left),
        y: Math.max(0, evt.clientY - rect.top),
        cellId: id ?? null,
      });
    };
    const onBlankContextMenu = (evt: MouseEvent) => {
      // Hide menu on blank right-click
      evt.preventDefault();
      setCtxMenu((m) => ({ ...m, visible: false }));
    };
    pAny.on("cell:contextmenu", onCellContextMenu);
    pAny.on("blank:contextmenu", onBlankContextMenu);

    // Add a demo class element if empty
    if (graph.getCells().length === 0) {
      const rect = new joint.shapes.standard.Rectangle();
      rect.position(100, 60);
      rect.resize(160, 60);
      rect.attr({
        body: { fill: "#EFF6FF", stroke: "#3B82F6" },
        label: { text: "Clase", fill: "#111827" },
      });
      rect.addTo(graph);
    }

    return () => {
      const anyPaper = paper as any;
      if (typeof anyPaper?.remove === "function") {
        anyPaper.remove();
      } else {
        anyPaper?.el?.remove?.();
      }
      graph.clear();
      graphRef.current = null;
      paperRef.current = null;
      pAny.off?.("blank:pointerdown", onBlankPointerDown);
      pAny.off?.("cell:pointerdown", onCellPointerDown);
      pAny.off?.("cell:contextmenu", onCellContextMenu);
      pAny.off?.("blank:contextmenu", onBlankContextMenu);
    };
  }, []);

  // Init Socket.IO and real-time sync
  useEffect(() => {
    if (!diagramId) return;

    const socket = io("http://localhost:3001", {
      // Allow default transport negotiation (polling -> websocket)
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("room:join", { diagramId });
    });

    socket.on("connect_error", (err) => {
      // Log and let automatic reconnection handle it
      console.warn("Socket connect_error: ", err?.message || err);
    });

    // Receive remote graph state
    socket.on("graph:state", (state: any) => {
      if (!graphRef.current) return;
      // Prevent feedback loop if we are applying our own change
      if (state?.from === socket.id) return;
      suppressRemoteRef.current = true;
      try {
        graphRef.current.fromJSON(state.json);
      } finally {
        // Small timeout to avoid immediate echo
        setTimeout(() => {
          suppressRemoteRef.current = false;
        }, 50);
      }
    });

    // Presence: other users' cursors
    socket.on("cursor", ({ cursor, clientId }: { cursor: { xPct: number; yPct: number }; clientId: string }) => {
      setPeerCursors((prev) => {
        const color = prev[clientId]?.color || colorForClient(clientId);
        return {
          ...prev,
          [clientId]: { xPct: cursor.xPct, yPct: cursor.yPct, color, ts: Date.now() },
        };
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [diagramId]);

  // Broadcast local changes (throttled)
  useEffect(() => {
    if (!graphRef.current || !diagramId) return;

    let timeout: any = null;
    const handler = () => {
      if (suppressRemoteRef.current) return;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        const json = graphRef.current?.toJSON();
        const clientId = socketRef.current?.id;
        socketRef.current?.emit("graph:update", { diagramId, json, clientId });
      }, 200);
    };

    // Subscribe to graph changes. JointJS Graph mixes in Backbone.Events at
    // runtime; use optional chaining to avoid TS type issues.
    (graphRef.current as any)?.on?.("change add remove", handler);

    return () => {
      // JointJS Graph inherits Backbone.Events at runtime, which provides `off`,
      // but the TypeScript typings for Graph may not declare it. Cast to `any`
      // and guard the call to avoid type errors while still unsubscribing.
      (graphRef.current as any)?.off?.("change add remove", handler);
      if (timeout) clearTimeout(timeout);
    };
  }, [diagramId]);

  // Throttled cursor emitter
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !diagramId) return;

    let lastSent = 0;
    const intervalMs = 50;
    const onMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSent < intervalMs) return;
      lastSent = now;
      const rect = container.getBoundingClientRect();
      const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
      const clientId = socketRef.current?.id;
      if (!clientId) return;
      socketRef.current?.emit("cursor", { diagramId, cursor: { xPct, yPct }, clientId });
    };

    container.addEventListener("mousemove", onMove);
    return () => container.removeEventListener("mousemove", onMove);
  }, [diagramId]);

  // Cleanup stale cursors
  useEffect(() => {
    const timer = setInterval(() => {
      const cutoff = Date.now() - 5000;
      setPeerCursors((prev) => {
        const next = { ...prev } as typeof prev;
        let changed = false;
        for (const [id, c] of Object.entries(prev)) {
          if (c.ts < cutoff) {
            delete next[id as keyof typeof next];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Drag-and-drop from toolbox to canvas
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container) return;

    const allowIfUml = (e: DragEvent) => {
      const isUml = e.dataTransfer?.types?.includes("text/uml-tool");
      if (isUml) {
        // Required in some browsers (Edge) to allow dropping
        e.preventDefault();
        e.stopPropagation();
        try {
          if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
        } catch {}
      }
      return Boolean(isUml);
    };

    const onDragEnter = (e: DragEvent) => {
      allowIfUml(e);
    };
    const onDragOver = (e: DragEvent) => {
      allowIfUml(e);
    };
    const onDrop = (e: DragEvent) => {
      const kind = e.dataTransfer?.getData("text/uml-tool") || e.dataTransfer?.getData("text/plain");
      if (!kind) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const g = graphRef.current;
      if (!g) return;
      createUmlNodeLib(kind as any, g, x, y);
    };

    // Attach to both container and canvas (some browsers fire on the top-most element)
    container.addEventListener("dragenter", onDragEnter as any);
    container.addEventListener("dragover", onDragOver as any);
    container.addEventListener("drop", onDrop as any);
    canvas?.addEventListener("dragenter", onDragEnter as any);
    canvas?.addEventListener("dragover", onDragOver as any);
    canvas?.addEventListener("drop", onDrop as any);
    return () => {
      container.removeEventListener("dragenter", onDragEnter as any);
      container.removeEventListener("dragover", onDragOver as any);
      container.removeEventListener("drop", onDrop as any);
      canvas?.removeEventListener("dragenter", onDragEnter as any);
      canvas?.removeEventListener("dragover", onDragOver as any);
      canvas?.removeEventListener("drop", onDrop as any);
    };
  }, []);

  function colorForClient(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 80% 60%)`;
  }

  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Clipboard error", e);
    }
  };
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(String(diagramId ?? ""));
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1500);
    } catch (e) {
      console.error("Clipboard error", e);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="p-3 border-b flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">UML Diagram (ID: {diagramId})</h1>
          <span className="text-sm text-gray-500">Colaboración en tiempo real</span>
          <span className="ml-2 text-xs rounded-full border px-2 py-0.5 text-gray-700 bg-gray-50">
            {tool === "select" && "Herramienta: Selección"}
            {tool === "uml-class" && "Herramienta: Clase (clic en la pizarra o arrastre)"}
            {tool === "uml-interface" && "Herramienta: Interfaz (clic en la pizarra o arrastre)"}
            {tool === "uml-abstract" && "Herramienta: Abstracta (clic en la pizarra o arrastre)"}
            {tool === "assoc" && "Herramienta: Asociación (clic origen y luego destino)"}
            {tool === "aggregation" && "Herramienta: Agregación (clic origen y luego destino)"}
            {tool === "composition" && "Herramienta: Composición (clic origen y luego destino)"}
            {tool === "dependency" && "Herramienta: Dependencia (clic origen y luego destino)"}
            {tool === "generalization" && "Herramienta: Generalización (clic origen y luego destino)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            {copied ? "Enlace copiado" : "Copiar enlace"}
          </button>
          <button
            onClick={copyId}
            className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            {copiedId ? "ID copiado" : "Copiar ID"}
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={!selected && !linkSelected}
            className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm ${selected || linkSelected ? "hover:bg-red-50" : "opacity-50 cursor-not-allowed"}`}
            title={selected || linkSelected ? "Eliminar elemento seleccionado (Supr/Backspace)" : "No hay selección"}
          >
            Eliminar seleccionado
          </button>
        </div>
      </div>
      <div className="flex-1 flex min-h-0">
        {/* Toolbox */}
        <Toolbox
          tool={tool}
          linkSourceId={linkSourceId}
          onSelectTool={(t) => { setTool(t); setLinkSourceId(null); setPendingLinkAnchor(null); }}
        />
        {/* Canvas + presence overlay */}
        <div className="flex-1 relative" ref={containerRef}>
          <div ref={canvasRef} className="w-full h-full" />
          {/* Controles de zoom */}
          <ZoomControls paper={paperRef.current} className="absolute bottom-4 right-4" />
          {/* Pending link hint */}
          {linkSourceId && (
            <>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 rounded-md border bg-white px-3 py-1 text-xs shadow">
                Seleccione el destino…
              </div>
              {pendingLinkAnchor && (
                <div
                  className="absolute z-40 w-3 h-3 rounded-full ring-2 ring-white shadow"
                  style={{ left: pendingLinkAnchor.x, top: pendingLinkAnchor.y, transform: "translate(-50%, -50%)", backgroundColor: "#2563eb" }}
                  title="Origen"
                />
              )}
            </>
          )}
          {/* Custom context menu */}
          {ctxMenu.visible && (
            <div
              className="absolute z-50 bg-white border rounded-md shadow text-sm select-none"
              style={{ left: ctxMenu.x, top: ctxMenu.y }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <button
                className="block w-full text-left px-3 py-2 hover:bg-red-50"
                onClick={() => {
                  const id = ctxMenu.cellId;
                  if (id) {
                    const cell = graphRef.current?.getCell(id) as any;
                    if (cell && typeof cell.remove === "function") {
                      cell.remove();
                      if (selected?.id === id) setSelected(null);
                    }
                  }
                  setCtxMenu((m) => ({ ...m, visible: false }));
                }}
              >
                Eliminar
              </button>
            </div>
          )}
          {/* Presence cursors overlay */}
          {Object.entries(peerCursors).map(([id, c]) => (
            <div
              key={id}
              className="pointer-events-none absolute"
              style={{ left: `${c.xPct}%`, top: `${c.yPct}%`, transform: "translate(-50%, -50%)" }}
            >
              <div
                style={{ backgroundColor: c.color }}
                className="w-3 h-3 rounded-full shadow ring-2 ring-white"
                title={id}
              />
            </div>
          ))}
        </div>
        {/* Inspectors */}
        {selected ? (
          <Inspector
            selected={selected}
            onChange={(updated) => {
              if (!selected) return;
              const cell = graphRef.current?.getCell(selected.id) as any;
              if (!cell) return;
              applyClassDataToCell(cell, updated as any);
              // Update local selected state to reflect immediate UI changes
              setSelected((prev) => (prev ? { ...prev, ...updated } as ClassData : prev));
            }}
            onClear={() => setSelected(null)}
          />
        ) : (
          <LinkInspector
            selected={linkSelected}
            onChange={(updated) => {
              if (!linkSelected) return;
              
              // Get the cell from the graph
              const cell = graphRef.current?.getCell(linkSelected.id);
              if (!cell) return;
              
              // Update the link data in the model
              applyLinkDataToCell(cell, updated);
              
              // Update the local state to reflect the changes
              setLinkSelected(prev => prev ? { ...prev, ...updated } : null);
              
              // Find the view and update it
              const paper = paperRef.current;
              if (paper) {
                const linkView = paper.findViewByModel(cell);
                if (linkView) {
                  // Update the view to reflect the changes
                  linkView.update();
                }
              }
            }}
            onClear={() => setLinkSelected(null)}
          />
        )}
      </div>
    </div>
  );
}
