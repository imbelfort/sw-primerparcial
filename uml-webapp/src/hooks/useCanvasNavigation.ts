import { useCallback, useEffect } from 'react';
import { Tool } from '../../components/Toolbox';
import * as joint from 'jointjs';

// Hook para manejar la navegación del canvas (pan y zoom)
export function useCanvasNavigation(
  containerRef: React.RefObject<HTMLDivElement | null>,
  canvasRef: React.RefObject<HTMLDivElement | null>,
  paperRef: React.RefObject<joint.dia.Paper | null>,
  tool: Tool,
  isPanning: boolean,
  setIsPanning: (panning: boolean) => void,
  lastPos: { x: number; y: number },
  setLastPos: (pos: { x: number; y: number }) => void
) {
  
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (tool === "select") {
      const target = e.target as HTMLElement;
      
      // Detectar si es clic en el fondo del canvas
      const isBackground = target.classList.contains('joint-paper') || 
                          target.classList.contains('joint-paper-svg') ||
                          target.tagName === 'svg' ||
                          target.classList.contains('joint-paper-background') ||
                          target.classList.contains('joint-paper-grid') ||
                          target.classList.contains('joint-paper-viewport') ||
                          (target.parentElement && target.parentElement.classList.contains('joint-paper'));
      
      // Permitir pan con botón izquierdo en el fondo, botón medio o botón derecho con Ctrl
      if ((e.button === 0 && isBackground) || 
          e.button === 1 || 
          (e.button === 2 && e.ctrlKey)) {
        setIsPanning(true);
        setLastPos({ x: e.clientX, y: e.clientY });
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  }, [tool, setIsPanning, setLastPos]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning && paperRef.current) {
      const scale = paperRef.current.scale().sx || 1;
      const dx = (e.clientX - lastPos.x) / scale;
      const dy = (e.clientY - lastPos.y) / scale;
      
      // Aplicar la traslación de manera más suave
      const currentTranslate = paperRef.current.translate();
      paperRef.current.translate(currentTranslate.tx + dx, currentTranslate.ty + dy);
      setLastPos({ x: e.clientX, y: e.clientY });
      
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isPanning, lastPos, paperRef, setLastPos]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isPanning, setIsPanning]);

  // Función para navegación con teclado
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (tool !== "select" || !paperRef.current) return;
    
    // Reducir el paso para movimiento más suave
    const step = 10; // Reducido de 20 a 10 píxeles
    const currentTranslate = paperRef.current.translate();
    
    // Verificar si se está presionando Shift para movimiento más rápido
    const fastStep = e.shiftKey ? step * 3 : step;
    
    // Activar bandera de navegación con teclado
    const paperAny = paperRef.current as any;
    if (paperAny.setKeyboardNavigating) {
      paperAny.setKeyboardNavigating(true);
    }
    
    switch (e.key) {
      case 'ArrowUp':
        paperRef.current.translate(currentTranslate.tx, currentTranslate.ty - fastStep);
        e.preventDefault();
        break;
      case 'ArrowDown':
        paperRef.current.translate(currentTranslate.tx, currentTranslate.ty + fastStep);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        paperRef.current.translate(currentTranslate.tx - fastStep, currentTranslate.ty);
        e.preventDefault();
        break;
      case 'ArrowRight':
        paperRef.current.translate(currentTranslate.tx + fastStep, currentTranslate.ty);
        e.preventDefault();
        break;
    }
    
    // Desactivar bandera después de un breve delay
    setTimeout(() => {
      if (paperAny.setKeyboardNavigating) {
        paperAny.setKeyboardNavigating(false);
      }
    }, 100);
  }, [tool, paperRef]);

  // Configurar eventos del mouse y teclado
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container) return;
    
    const preventContextMenu = (e: Event) => {
      if (tool === "select") {
        e.preventDefault();
      }
    };
    
    const handleMouseDownWrapper = (e: MouseEvent) => {
      handleMouseDown(e);
    };
    
    const handleMouseMoveWrapper = (e: MouseEvent) => {
      handleMouseMove(e);
    };
    
    const handleMouseUpWrapper = (e: MouseEvent) => {
      handleMouseUp(e);
    };
    
    const handleKeyDownWrapper = (e: KeyboardEvent) => {
      handleKeyDown(e);
    };
    
    container.addEventListener('mousedown', handleMouseDownWrapper, { passive: false });
    window.addEventListener('mousemove', handleMouseMoveWrapper, { passive: false });
    window.addEventListener('mouseup', handleMouseUpWrapper, { passive: false });
    window.addEventListener('keydown', handleKeyDownWrapper, { passive: false });
    
    if (canvas) {
      canvas.addEventListener('contextmenu', preventContextMenu);
    }
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDownWrapper);
      window.removeEventListener('mousemove', handleMouseMoveWrapper);
      window.removeEventListener('mouseup', handleMouseUpWrapper);
      window.removeEventListener('keydown', handleKeyDownWrapper);
      if (canvas) {
        canvas.removeEventListener('contextmenu', preventContextMenu);
      }
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown, tool, containerRef, canvasRef]);
}
