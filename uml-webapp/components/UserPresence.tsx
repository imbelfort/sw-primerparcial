import React from 'react';

interface UserPresenceProps {
  connectedUsers: string[];
  className?: string;
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

// Función para obtener las iniciales del usuario (basado en su ID)
function getInitials(userId: string): string {
  // Tomar los primeros 2 caracteres del ID y convertirlos a mayúsculas
  return userId.substring(0, 2).toUpperCase();
}

export function UserPresence({ connectedUsers, className = '' }: UserPresenceProps) {
  if (connectedUsers.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-xs text-gray-500">
        {connectedUsers.length} {connectedUsers.length === 1 ? 'usuario' : 'usuarios'} conectado{connectedUsers.length === 1 ? '' : 's'}
      </span>
      <div className="flex -space-x-1">
        {connectedUsers.slice(0, 5).map((userId) => (
          <div
            key={userId}
            className="relative"
            title={`Usuario ${userId.substring(0, 8)}...`}
          >
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: getColorForUser(userId) }}
            >
              {getInitials(userId)}
            </div>
            {/* Indicador de actividad */}
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white"></div>
          </div>
        ))}
        {connectedUsers.length > 5 && (
          <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
            +{connectedUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
