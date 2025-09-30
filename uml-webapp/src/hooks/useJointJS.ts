import { useCallback, useEffect, useRef } from 'react';
import * as joint from 'jointjs';
import { Tool } from '../../components/Toolbox';
import { createUmlNode as createUmlNodeLib, getClassDataFromCell } from '../../lib/umlTools';
import { createUmlLink as createUmlLinkLib, getLinkDataFromCell } from '../../lib/umlAdvancedTools';
import { 
  updateLabelsTextAnchor, 
  createElementTools, 
  createLinkWithLabelsTools,
  createLabelEditTools,
  orthogonalRouter,
  scaleToFit
} from '../../lib/umlAdvancedTools';

// Hook para manejar la inicialización y configuración de JointJS
export function useJointJS(
  canvasRef: React.RefObject<HTMLDivElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  tool: Tool,
  toolRef: React.MutableRefObject<Tool>,
  linkSourceId: string | null,
  linkSourceRef: React.MutableRefObject<string | null>,
  onElementSelect: (data: any) => void,
  onLinkSelect: (data: any) => void,
  onLinkSourceChange: (id: string | null) => void,
  onPendingAnchorChange: (anchor: { x: number; y: number } | null) => void,
  onContextMenu: (menu: { visible: boolean; x: number; y: number; cellId: string | null }) => void,
  sendSelection?: ((selection: { cellId: string; type: 'class' | 'link' } | null) => void) | null
) {
  const graphRef = useRef<joint.dia.Graph | null>(null);
  const paperRef = useRef<joint.dia.Paper | null>(null);

  // Inicializar JointJS
  useEffect(() => {
    if (!canvasRef.current) return;

    const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
    const paper = new joint.dia.Paper({
      el: canvasRef.current,
      model: graph,
      width: '100%',
      height: '100%',
      gridSize: 1,
      drawGrid: { name: "dot", args: { color: "#d0d0d0" } },
      background: { color: "#ffffff" },
      cellViewNamespace: joint.shapes,
      defaultConnectionPoint: {
        name: "boundary",
        args: {
          sticky: true,
          offset: 3,
          priority: ['right', 'left', 'top', 'bottom'],
          selector: 'body'
        }
      },
      defaultConnector: { 
        name: "rounded",
        args: {
          radius: 15
        }
      },
      defaultConnectionArgs: { 
        attrs: { 
          line: { 
            stroke: "#000000", 
            strokeWidth: 1,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round'
          } 
        },
        router: {
          name: 'orthogonal',
          args: {
            padding: 20,
            step: 20
          }
        }
      },
      snapLinks: { radius: 75 },
      linkPinning: false,
      interactive: true,
      // Deshabilitar herramientas de enlaces por defecto
      linkTools: false,
      // Configurar el orden de capas para que los nodos estén por encima de los links
      // defaultLink: { z: 1 },
      // defaultElement: { z: 10 },
      // Configurar el orden de renderizado
      sorting: joint.dia.Paper.sorting.APPROX,
      mousewheel: {
        enabled: true,
        modifiers: [],
        minScale: 0.1,
        maxScale: 4,
        factor: 1.1,
        invert: false,
      },
      async: true,
      frozen: false,
      guard: (evt, view) => {
        // Permitir navegación del canvas cuando se está en modo select
        if (toolRef.current === "select") {
          // Solo bloquear eventos en elementos específicos, no en el fondo
          if (view && (view as any).model) {
            return false; // Permitir interacción con elementos
          }
          return false; // Permitir navegación en el fondo
        }
        return false;
      },
    });
    
    paper.translate(100, 100);
    graphRef.current = graph;
    paperRef.current = paper;

    // Configurar el orden de capas después de la inicialización
    paper.on('cell:add', (cell: any) => {
      if (cell.isElement && cell.isElement()) {
        // Asegurar que los elementos tengan z-index alto
        cell.set('z', 10);
      } else if (cell.isLink && cell.isLink()) {
        // Asegurar que los links tengan z-index bajo pero sean seleccionables
        cell.set('z', 1);
        cell.set('selectable', true);
        cell.set('interactive', true);
        cell.set('movable', false); // Deshabilitar movimiento de enlaces
        
        // Aplicar router personalizado a todos los enlaces
        cell.set('router', orthogonalRouter);
      }
    });

    // Bandera para controlar el ajuste automático del canvas
    let isKeyboardNavigating = false;
    let adjustTimeout: NodeJS.Timeout | null = null;

    // Función para ajustar automáticamente el tamaño del canvas
    const adjustCanvasSize = () => {
      // No ajustar si se está navegando con teclado
      if (isKeyboardNavigating) return;
      
      try {
        const bbox = graph.getBBox();
        if (bbox) {
          // Agregar margen alrededor del contenido
          const margin = 100;
          
          // Ajustar el viewport del paper para incluir todo el contenido
          paper.scaleContentToFit({
            padding: margin,
            scaleGrid: 0.1,
            preserveAspectRatio: true
          });
        }
      } catch (error) {
        console.warn('Error ajustando tamaño del canvas:', error);
      }
    };

    // Escuchar cambios en el grafo para ajustar el tamaño automáticamente
    (graph as any).on('change:position change:size add remove', () => {
      // Cancelar timeout anterior si existe
      if (adjustTimeout) {
        clearTimeout(adjustTimeout);
      }
      
      // Usar setTimeout para evitar múltiples ajustes durante operaciones rápidas
      adjustTimeout = setTimeout(() => {
        // Usar scaleToFit para mejor ajuste automático
        scaleToFit(paper, graph);
        adjustTimeout = null;
      }, 200); // Aumentado el delay para evitar ajustes durante navegación rápida
    });

    // Función para aplicar router personalizado a todos los enlaces existentes
    const applyCustomRouterToAllLinks = () => {
      const links = graph.getLinks();
      links.forEach((link: any) => {
        // Solo aplicar si no tiene el router correcto para evitar parpadeo
        if (link.get('router') !== orthogonalRouter) {
          link.set('router', orthogonalRouter);
          link.set('movable', false); // Deshabilitar movimiento de enlaces
          // También aplicar la configuración completa de UML_LINK_CONFIG
          link.set('connectionPoint', {
            name: 'boundary',
            args: {
              sticky: true,
              offset: 3,
              priority: ['right', 'left', 'top', 'bottom']
            }
          });
        }
      });
    };

    // Aplicar router cuando se agregan enlaces individualmente
    (graph as any).on('add', (cell: any) => {
      if (cell.isLink && cell.isLink()) {
        // Aplicar inmediatamente sin timeout para evitar parpadeo
        cell.set('router', orthogonalRouter);
        cell.set('movable', false); // Deshabilitar movimiento de enlaces
        cell.set('connectionPoint', {
          name: 'boundary',
          args: {
            sticky: true,
            offset: 3,
            priority: ['right', 'left', 'top', 'bottom']
          }
        });
      }
    });

    // Detectar cuando se carga desde JSON y aplicar router personalizado solo una vez
    let isFromJSON = false;
    let routerApplied = false;
    (graph as any).on('batch:start', () => {
      isFromJSON = true;
      routerApplied = false;
    });
    
    (graph as any).on('batch:stop', () => {
      if (isFromJSON && !routerApplied) {
        setTimeout(() => {
          applyCustomRouterToAllLinks();
          routerApplied = true;
          isFromJSON = false;
        }, 100);
      }
    });

    // Exponer función para controlar la navegación con teclado
    (paper as any).setKeyboardNavigating = (navigating: boolean) => {
      isKeyboardNavigating = navigating;
    };

    // Exponer función para aplicar router personalizado (para usar desde Socket.IO)
    (paper as any).applyCustomRouterToAllLinks = applyCustomRouterToAllLinks;

    // Canvas limpio - sin elementos de ejemplo

    // Eventos del papel
    const pAny: any = paper;
    
    const onBlankPointerDown = (evt: any, x: number, y: number) => {
      const currentTool = toolRef.current;
      
      if (evt?.button === 2 || evt?.button === 1) return;
      
      // Solo deseleccionar elementos cuando se hace clic en el canvas
      if (currentTool === "select") {
        console.log('🔍 [SELECT] Deseleccionando elementos');
        onElementSelect(null);
        // Enviar deselección
        const currentSendSelection = sendSelection || (paper as any)?.updateSendSelection;
        if (currentSendSelection) {
          console.log('🔍 [SELECT] Enviando deselección');
          currentSendSelection(null);
        }
      }
      
      // Cancelar creación de enlaces si hay un linkSource activo
      if (linkSourceRef.current) {
        console.log('🔍 [SELECT] Cancelando creación de enlace');
        onLinkSourceChange(null);
        onPendingAnchorChange(null);
      }
    };

    const onCellPointerDown = (cellView: any, evt?: MouseEvent, ex?: number, ey?: number) => {
      const currentTool = toolRef.current;
      
      if (evt && (evt.button === 2 || evt.button === 1)) return;
      
      if (currentTool === "assoc" || currentTool === "generalization" || 
          currentTool === "aggregation" || currentTool === "composition" || 
          currentTool === "dependency") {
        
        const model = cellView?.model;
        const isLink = model?.isLink?.() || model?.get?.("type")?.includes("Link");
        
        if (isLink) return;
        
        const id = model?.id;
        if (!id) return;
        
        if (!linkSourceRef.current) {
          onLinkSourceChange(id);
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const cx = typeof ex === "number" ? ex : (evt ? evt.clientX - rect.left : rect.width / 2);
            const cy = typeof ey === "number" ? ey : (evt ? evt.clientY - rect.top : rect.height / 2);
            onPendingAnchorChange({ x: cx, y: cy });
          }
        } else {
          const sourceId = linkSourceRef.current;
          if (sourceId !== id) {
            createUmlLinkLib(currentTool as any, graph, sourceId, id);
          }
          onLinkSourceChange(null);
          onPendingAnchorChange(null);
        }
        return;
      }
      
      if (currentTool === "select") {
        console.log('🔍 [SELECT] Herramienta de selección activada');
        const model = cellView?.model;
        if (!model) {
          console.log('🔍 [SELECT] No hay modelo en cellView');
          return;
        }
        
        const isLink = model.isLink?.() || model.get?.("type")?.includes("Link");
        console.log('🔍 [SELECT] Tipo de elemento:', isLink ? 'enlace' : 'elemento', 'ID:', model.id);
        
        if (isLink) {
          console.log('🔍 [SELECT] Procesando selección de enlace');
          const ld = getLinkDataFromCell(model);
          console.log('🔍 [SELECT] Datos del enlace:', ld);
          onLinkSelect(ld);
          
          // Enviar selección de enlace
          const currentSendSelection = sendSelection || (paper as any)?.updateSendSelection;
          if (currentSendSelection) {
            console.log('🔍 [SELECT] Enviando selección de enlace:', { cellId: model.id, type: 'link' });
            currentSendSelection({ cellId: model.id, type: 'link' });
          }
          return;
        }
        
        console.log('🔍 [SELECT] Procesando selección de elemento');
        const data = getClassDataFromCell(model);
        console.log('🔍 [SELECT] Datos del elemento:', data);
        
        if (data) {
          onElementSelect(data);
          // Enviar selección de clase
          const currentSendSelection = sendSelection || (paper as any)?.updateSendSelection;
          if (currentSendSelection) {
            console.log('🔍 [SELECT] Enviando selección de clase:', { cellId: model.id, type: 'class' });
            currentSendSelection({ cellId: model.id, type: 'class' });
          }
        } else {
          console.log('🔍 [SELECT] No se pudieron obtener datos del elemento');
        }
      }
    };

    const onCellContextMenu = (cellView: any, evt: MouseEvent) => {
      console.log('🔍 [SELECT] Menú contextual activado');
      evt.preventDefault();
      const container = containerRef.current;
      if (!container) {
        console.log('🔍 [SELECT] No hay contenedor para el menú contextual');
        return;
      }
      const rect = container.getBoundingClientRect();
      const id = cellView?.model?.id as string | undefined;
      console.log('🔍 [SELECT] Mostrando menú contextual para elemento:', id);
      onContextMenu({
        visible: true,
        x: Math.max(0, evt.clientX - rect.left),
        y: Math.max(0, evt.clientY - rect.top),
        cellId: id ?? null,
      });
    };

    const onBlankContextMenu = (evt: MouseEvent) => {
      console.log('🔍 [SELECT] Menú contextual en área en blanco');
      evt.preventDefault();
      onContextMenu({ visible: false, x: 0, y: 0, cellId: null });
    };

    // Event handlers para herramientas avanzadas
    const onElementPointerClick = (elementView: any) => {
      console.log('🔍 [SELECT] Clic en elemento:', elementView?.model?.id);
      // Remover herramientas existentes
      paper.removeTools();
      
      const element = elementView.model;
      
      // Agregar herramientas al elemento
      const elementTools = createElementTools(element);
      console.log('🔍 [SELECT] Herramientas del elemento:', elementTools.length);
      const elementToolsView = new joint.dia.ToolsView({ tools: elementTools });
      elementView.addTools(elementToolsView);
      console.log('🔍 [SELECT] Herramientas agregadas al elemento');
      
      // Agregar herramientas a los enlaces conectados
      const connectedLinks = graph.getConnectedLinks(element);
      console.log('🔍 [SELECT] Enlaces conectados:', connectedLinks.length);
      connectedLinks.forEach((link: any) => {
        const linkView = paper.findViewByModel(link);
        if (linkView) {
          const linkTools = createLinkWithLabelsTools(link, element);
          const linkToolsView = new joint.dia.ToolsView({ tools: linkTools });
          linkView.addTools(linkToolsView);
          console.log('🔍 [SELECT] Herramientas agregadas al enlace:', link.id);
        }
      });
    };

    const onLinkPointerClick = (linkView: any) => {
      console.log('🔍 [SELECT] Clic en enlace:', linkView?.model?.id);
      // Remover herramientas existentes
      paper.removeTools();
      
      const link = linkView.model;
      
      // NO agregar herramientas al enlace - solo seleccionar para editar en el inspector
      // Las herramientas de JointJS permiten mover el enlace, lo cual no queremos
      
      // Actualizar posicionamiento de etiquetas
      updateLabelsTextAnchor(link);
      console.log('🔍 [SELECT] Etiquetas actualizadas');
      
      // Asegurar que el enlace sea seleccionable pero no movible
      link.set('selectable', true);
      link.set('interactive', true);
      link.set('movable', false); // Deshabilitar movimiento del enlace
      
      console.log('🔍 [SELECT] Enlace seleccionado para edición en inspector (sin herramientas de movimiento)');
    };

    const onBlankPointerDownAdvanced = () => {
      console.log('🔍 [SELECT] Clic en área en blanco - removiendo herramientas');
      // Remover herramientas cuando se hace clic en el fondo
      paper.removeTools();
    };

    pAny.on("element:pointerclick", onElementPointerClick);
    pAny.on("link:pointerclick", onLinkPointerClick);
    pAny.on("blank:pointerdown", onBlankPointerDownAdvanced);
    pAny.on("cell:pointerdown", onCellPointerDown);
    pAny.on("cell:contextmenu", onCellContextMenu);
    pAny.on("blank:contextmenu", onBlankContextMenu);

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
      pAny.off?.("element:pointerclick", onElementPointerClick);
      pAny.off?.("link:pointerclick", onLinkPointerClick);
      pAny.off?.("blank:pointerdown", onBlankPointerDownAdvanced);
      pAny.off?.("cell:pointerdown", onCellPointerDown);
      pAny.off?.("cell:contextmenu", onCellContextMenu);
      pAny.off?.("blank:contextmenu", onBlankContextMenu);
    };
  }, []);

  return { graphRef, paperRef };
}
