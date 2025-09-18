"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import * as joint from "jointjs";
import "jointjs/dist/joint.css";

// Simple UML Class element using JointJS element (can be extended later)

export default function DiagramPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<joint.dia.Graph | null>(null);
  const paperRef = useRef<joint.dia.Paper | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const suppressRemoteRef = useRef(false);
  const [peerCursors, setPeerCursors] = useState<Record<string, { xPct: number; yPct: number; color: string; ts: number }>>({});

  const [diagramId] = useState<string>(() => {
    // In a real app, take from route or query string
    // For now, use a fixed demo id
    return "demo-uml";
  });

  // Init JointJS
  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
    const paper = new joint.dia.Paper({
      el: containerRef.current,
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
    };
  }, []);

  // Init Socket.IO and real-time sync
  useEffect(() => {
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
    if (!graphRef.current) return;

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
    if (!container) return;

    let lastSent = 0;
    const intervalMs = 50; // ~20fps
    const onMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSent < intervalMs) return;
      lastSent = now;
      const rect = container.getBoundingClientRect();
      const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
      const clientId = socketRef.current?.id;
      if (!clientId || !diagramId) return;
      socketRef.current?.emit("cursor", { diagramId, cursor: { xPct, yPct }, clientId });
    };

    container.addEventListener("mousemove", onMove);
    return () => {
      container.removeEventListener("mousemove", onMove);
    };
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

  function colorForClient(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 80% 60%)`;
  }

  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="p-3 border-b flex items-center gap-3">
        <h1 className="text-lg font-semibold">UML Diagram (ID: {diagramId})</h1>
        <span className="text-sm text-gray-500">Colaboración en tiempo real</span>
      </div>
      <div className="flex-1 relative" ref={containerRef}>
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
    </div>
  );
}
