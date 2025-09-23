import { useEffect } from 'react';
import { createUmlNode as createUmlNodeLib } from '../../lib/umlTools';

// Hook para manejar drag and drop desde el toolbox
export function useDragAndDrop(
  containerRef: React.RefObject<HTMLDivElement | null>,
  canvasRef: React.RefObject<HTMLDivElement | null>,
  graphRef: React.RefObject<joint.dia.Graph | null>
) {
  
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container) return;

    const allowIfUml = (e: DragEvent) => {
      const isUml = e.dataTransfer?.types?.includes("text/uml-tool");
      if (isUml) {
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

    // Adjuntar a ambos contenedores
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
  }, [containerRef, canvasRef, graphRef]);
}
