import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import * as joint from 'jointjs';

// Hook para manejar la comunicación en tiempo real con Socket.IO
export function useSocketIO(
  diagramId: string,
  graphRef: React.RefObject<joint.dia.Graph | null>,
  suppressRemoteRef: React.MutableRefObject<boolean>,
  setPeerCursors: React.Dispatch<React.SetStateAction<Record<string, { xPct: number; yPct: number; color: string; ts: number }>>>,
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const socketRef = useRef<Socket | null>(null);

  // Inicializar Socket.IO
  useEffect(() => {
    if (!diagramId) return;

    const socket = io("http://localhost:3001", {
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
      console.warn("Socket connect_error: ", err?.message || err);
    });

    // Recibir estado remoto del grafo
    socket.on("graph:state", (state: any) => {
      if (!graphRef.current) return;
      if (state?.from === socket.id) return;
      suppressRemoteRef.current = true;
      try {
        graphRef.current.fromJSON(state.json);
      } finally {
        setTimeout(() => {
          suppressRemoteRef.current = false;
        }, 50);
      }
    });

    // Presencia: cursores de otros usuarios
    socket.on("cursor", ({ cursor, clientId }: { cursor: { xPct: number; yPct: number }; clientId: string }) => {
      setPeerCursors((prev: Record<string, { xPct: number; yPct: number; color: string; ts: number }>) => {
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

  // Transmitir cambios locales (throttled)
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

    (graphRef.current as any)?.on?.("change add remove", handler);

    return () => {
      (graphRef.current as any)?.off?.("change add remove", handler);
      if (timeout) clearTimeout(timeout);
    };
  }, [diagramId]);

  // Emisor de cursor throttled
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

  return { socketRef };
}

// Función auxiliar para generar colores únicos
function colorForClient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 80% 60%)`;
}
