import { useEffect } from 'react';

// Hook para limpiar cursores obsoletos
export function useCursorCleanup(
  setPeerCursors: React.Dispatch<React.SetStateAction<Record<string, { xPct: number; yPct: number; color: string; ts: number }>>>
) {
  
  useEffect(() => {
    const timer = setInterval(() => {
      const cutoff = Date.now() - 5000;
      setPeerCursors((prev: Record<string, { xPct: number; yPct: number; color: string; ts: number }>) => {
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
  }, [setPeerCursors]);
}
