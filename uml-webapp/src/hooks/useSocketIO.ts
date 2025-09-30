import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import * as joint from 'jointjs';

// Hook para manejar la comunicación en tiempo real con Socket.IO
export function useSocketIO(
  diagramId: string,
  graphRef: React.RefObject<joint.dia.Graph | null> | null,
  suppressRemoteRef: React.MutableRefObject<boolean>,
  setPeerCursors: React.Dispatch<React.SetStateAction<Record<string, { xPct: number; yPct: number; color: string; ts: number }>>>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  paperRef?: React.RefObject<joint.dia.Paper | null> | null,
  setConnectedUsers?: React.Dispatch<React.SetStateAction<string[]>>,
  setPeerSelections?: React.Dispatch<React.SetStateAction<Record<string, { cellId: string; type: 'class' | 'link'; ts: number }>>>
) {
  const socketRef = useRef<Socket | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);

  // Inicializar Socket.IO
  useEffect(() => {
    if (!diagramId) return;

    const socket = io(
      process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_SOCKET_URL || 'https://uml-socket-server.onrender.com'
        : "http://localhost:3001", 
      {
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 3000,
        timeout: 20000,
      }
    );
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("room:join", { diagramId });
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connect_error: ", err?.message || err);
    });

    // Recibir estado remoto del grafo
    socket.on("graph:state", (state: any) => {
      if (!graphRef?.current) return;
      if (state?.from === socket.id) return;
      
      // Verificar si ya estamos procesando un cambio remoto
      if (suppressRemoteRef.current) return;
      
      // Detectar bucles: si recibimos muchas actualizaciones en poco tiempo
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < 1000) {
        updateCountRef.current++;
        if (updateCountRef.current > 10) {
          console.warn('[socket] Detected potential loop, suppressing updates for 2 seconds');
          suppressRemoteRef.current = true;
          setTimeout(() => {
            suppressRemoteRef.current = false;
            updateCountRef.current = 0;
          }, 2000);
          return;
        }
      } else {
        updateCountRef.current = 0;
      }
      lastUpdateTimeRef.current = now;
      
      suppressRemoteRef.current = true;
      try {
        // Usar batch para evitar múltiples eventos
        graphRef.current.startBatch('remote-update');
        graphRef.current.fromJSON(state.json);
        graphRef.current.stopBatch('remote-update');
        
        // Aplicar router personalizado después de cargar desde JSON
        setTimeout(() => {
          if (paperRef?.current && (paperRef.current as any).applyCustomRouterToAllLinks) {
            (paperRef.current as any).applyCustomRouterToAllLinks();
          }
        }, 200);
      } finally {
        // Aumentar el tiempo de supresión para evitar bucles
        setTimeout(() => {
          suppressRemoteRef.current = false;
        }, 300);
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

    // Presencia: usuarios conectados en la sala
    socket.on("room:users", ({ users, count }: { users: string[]; count: number }) => {
      if (setConnectedUsers) {
        // Filtrar el usuario actual de la lista
        const otherUsers = users.filter(id => id !== socket.id);
        setConnectedUsers(otherUsers);
      }
    });

    // Presencia: selecciones de otros usuarios
    socket.on("selection", ({ selection, clientId }: { selection: { cellId: string; type: 'class' | 'link' } | null; clientId: string }) => {
      if (setPeerSelections) {
        setPeerSelections((prev: Record<string, { cellId: string; type: 'class' | 'link'; ts: number }>) => {
          if (!selection) {
            // Remover selección
            const { [clientId]: removed, ...rest } = prev;
            return rest;
          } else {
            // Agregar/actualizar selección
            return {
              ...prev,
              [clientId]: { ...selection, ts: Date.now() },
            };
          }
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [diagramId]);

  // Transmitir cambios locales (throttled)
  useEffect(() => {
    if (!graphRef?.current || !diagramId) return;

    let timeout: any = null;
    let lastSentJson: string | null = null;
    let isProcessing = false;
    
    const handler = () => {
      if (suppressRemoteRef.current) return;
      if (isProcessing) return;
      
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (suppressRemoteRef.current) return;
        if (isProcessing) return;
        
        isProcessing = true;
        try {
          const json = graphRef?.current?.toJSON();
          const jsonString = JSON.stringify(json);
          
          // Solo enviar si el JSON ha cambiado realmente
          if (jsonString !== lastSentJson) {
            lastSentJson = jsonString;
            const clientId = socketRef.current?.id;
            socketRef.current?.emit("graph:update", { diagramId, json, clientId });
          }
        } finally {
          isProcessing = false;
        }
      }, 300); // Aumentar el debounce para reducir frecuencia
    };

    (graphRef.current as any)?.on?.("change add remove", handler);

    return () => {
      (graphRef?.current as any)?.off?.("change add remove", handler);
      if (timeout) clearTimeout(timeout);
    };
  }, [diagramId, graphRef]);

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

  // Función para enviar selección
  const sendSelection = (selection: { cellId: string; type: 'class' | 'link' } | null) => {
    if (socketRef.current && diagramId) {
      socketRef.current.emit("selection", { 
        diagramId, 
        selection, 
        clientId: socketRef.current.id 
      });
    }
  };

  return { 
    socketRef,
    sendSelection,
  };
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
