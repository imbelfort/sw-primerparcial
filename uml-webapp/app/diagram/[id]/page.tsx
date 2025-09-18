"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Toolbox, type Tool } from "../../../components/Toolbox";
import { Inspector, type ClassData } from "../../../components/Inspector";
import {
  createUmlNode as createUmlNodeLib,
  createUmlLink as createUmlLinkLib,
  getClassDataFromCell,
  applyClassDataToCell,
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

  // Init JointJS
  useEffect(() => {
    if (!canvasRef.current) return;

    const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
    const paper = new joint.dia.Paper({
      el: canvasRef.current,
      model: graph,
      width: "100%",
      height: "100%",
      gridSize: 10,
      drawGrid: true,
      interactive: true,
      cellViewNamespace: joint.shapes,
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
      if (tool === "uml-class" || tool === "uml-interface" || tool === "uml-abstract") {
        createUmlNode(tool, x, y);
        return;
      }
      if (tool === "select") {
        setSelected(null);
      }
    };
    // Link creation via two clicks on cells
    const onCellPointerDown = (cellView: any) => {
      if (tool === "assoc" || tool === "generalization") {
        const id = cellView?.model?.id;
        if (!id) return;
        if (!linkSourceId) {
          setLinkSourceId(id);
        } else {
          const sourceId = linkSourceId;
          setLinkSourceId(null);
          createLink(tool, sourceId, id);
        }
        return;
      }
      if (tool === "select") {
        const model = cellView?.model;
        if (!model) return;
        // Ignore links in inspector for now
        const isLink = model.isLink?.() || model.get?.("type")?.includes("Link");
        if (isLink) return;
        const data = getClassDataFromCell(model);
        if (data) setSelected({
          id: data.id,
          kind: data.kind,
          name: data.name,
          attributes: data.attributes,
          methods: data.methods,
        });
      }
    };
    pAny.on("blank:pointerdown", onBlankPointerDown);
    pAny.on("cell:pointerdown", onCellPointerDown);

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
    };
  }, []);

  // Init Socket.IO and real-time sync
  useEffect(() => {
    if (!diagramId) return;

    const socket = io("http://localhost:3001", { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("room:join", { diagramId });
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
    if (!container) return;

    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("text/uml-tool")) {
        e.preventDefault();
      }
    };
    const onDrop = (e: DragEvent) => {
      const kind = e.dataTransfer?.getData("text/uml-tool");
      if (!kind) return;
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const g = graphRef.current;
      if (!g) return;
      createUmlNodeLib(kind as any, g, x, y);
    };

    container.addEventListener("dragover", onDragOver as any);
    container.addEventListener("drop", onDrop as any);
    return () => {
      container.removeEventListener("dragover", onDragOver as any);
      container.removeEventListener("drop", onDrop as any);
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
        </div>
      </div>
      <div className="flex-1 flex min-h-0">
        {/* Toolbox */}
        <Toolbox
          tool={tool}
          linkSourceId={linkSourceId}
          onSelectTool={(t) => { setTool(t); setLinkSourceId(null); }}
        />
        {/* Canvas + presence overlay */}
        <div className="flex-1 relative" ref={containerRef}>
          <div className="absolute inset-0" ref={canvasRef} />
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
        {/* Inspector panel */}
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
      </div>
    </div>
  );
}
