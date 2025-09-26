import React from 'react';
import * as joint from 'jointjs';

interface PeerSelectionOverlayProps {
  peerSelections: Record<string, { cellId: string; type: 'class' | 'link'; ts: number }>;
  paper: joint.dia.Paper | null;
  connectedUsers: string[];
}

// Función para generar colores consistentes basados en el ID del usuario
function getColorForUser(userId: string): string {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#ec4899', // pink
    '#6b7280', // gray
  ];
  
  // Generar un hash simple del userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Función para obtener las iniciales del usuario
function getInitials(userId: string): string {
  return userId.substring(0, 2).toUpperCase();
}

export function PeerSelectionOverlay({ peerSelections, paper, connectedUsers }: PeerSelectionOverlayProps) {
  if (!paper) return null;

  const now = Date.now();
  const validSelections = Object.entries(peerSelections).filter(([_, selection]) => {
    // Solo mostrar selecciones de los últimos 10 segundos
    return now - selection.ts < 10000;
  });

  if (validSelections.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {validSelections.map(([userId, selection]) => {
        const cell = (paper as any).model.getCell(selection.cellId);
        if (!cell) return null;

        const cellView = paper.findViewByModel(cell);
        if (!cellView) return null;

        const bbox = cellView.getBBox();
        const color = getColorForUser(userId);
        const initials = getInitials(userId);

        return (
          <div
            key={`${userId}-${selection.cellId}`}
            className="absolute pointer-events-none"
            style={{
              left: bbox.x - 2,
              top: bbox.y - 2,
              width: bbox.width + 4,
              height: bbox.height + 4,
              border: `2px solid ${color}`,
              borderRadius: '4px',
              backgroundColor: `${color}20`, // 20% opacity
            }}
          >
            {/* Badge con iniciales del usuario */}
            <div
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {initials}
            </div>
            
            {/* Indicador de tipo de elemento */}
            <div
              className="absolute -bottom-2 -left-2 px-2 py-1 rounded text-xs font-medium text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              {selection.type === 'class' ? 'Clase' : 'Enlace'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
