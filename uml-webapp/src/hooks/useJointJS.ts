import { useCallback, useEffect, useRef } from 'react';
import * as joint from 'jointjs';
import { Tool } from '../../components/Toolbox';
import { createUmlNode as createUmlNodeLib, createUmlLink as createUmlLinkLib, getClassDataFromCell, getLinkDataFromCell } from '../../lib/umlTools';
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
  onContextMenu: (menu: { visible: boolean; x: number; y: number; cellId: string | null }) => void
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
          priority: ['right', 'left', 'top', 'bottom']
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
        router: orthogonalRouter
      },
      snapLinks: { radius: 75 },
      linkPinning: false,
      interactive: true,
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
        // Forzar la aplicación del router personalizado
        link.set('router', orthogonalRouter);
        // También aplicar la configuración completa de UML_LINK_CONFIG
        link.set('connectionPoint', {
          name: 'boundary',
          args: {
            sticky: true,
            offset: 3,
            priority: ['right', 'left', 'top', 'bottom']
          }
        });
        // Forzar re-renderizado del enlace
        link.trigger('change:router');
      });
    };

    // Aplicar router personalizado después de cargar desde JSON
    (graph as any).on('batch:stop', () => {
      // Este evento se dispara después de operaciones batch como fromJSON
      setTimeout(() => {
        applyCustomRouterToAllLinks();
      }, 100);
    });

    // También aplicar cuando se agregan enlaces individualmente
    (graph as any).on('add', (cell: any) => {
      if (cell.isLink && cell.isLink()) {
        setTimeout(() => {
          cell.set('router', orthogonalRouter);
          cell.trigger('change:router');
        }, 50);
      }
    });

    // Detectar cuando se carga desde JSON y aplicar router personalizado
    let isFromJSON = false;
    (graph as any).on('batch:start', () => {
      isFromJSON = true;
    });
    
    (graph as any).on('batch:stop', () => {
      if (isFromJSON) {
        setTimeout(() => {
          applyCustomRouterToAllLinks();
          isFromJSON = false;
        }, 150);
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
      
      // Solo crear nodos si estamos en modo de creación y no hay linkSource activo
      if ((currentTool === "uml-class" || currentTool === "uml-interface" || currentTool === "uml-abstract" || currentTool === "uml-enum" || currentTool === "uml-package") && !linkSourceRef.current) {
        if (evt?.data?.startedWithRightClick) return;
        createUmlNodeLib(currentTool as any, graph, x, y);
        return;
      }
      
      if (currentTool === "select") {
        onElementSelect(null);
      }
      
      if (linkSourceRef.current) {
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
        const model = cellView?.model;
        if (!model) return;
        const isLink = model.isLink?.() || model.get?.("type")?.includes("Link");
        if (isLink) {
          const ld = getLinkDataFromCell(model);
          onLinkSelect(ld);
          return;
        }
        const data = getClassDataFromCell(model);
        if (data) {
          onElementSelect(data);
        }
      }
    };

    const onCellContextMenu = (cellView: any, evt: MouseEvent) => {
      evt.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const id = cellView?.model?.id as string | undefined;
      onContextMenu({
        visible: true,
        x: Math.max(0, evt.clientX - rect.left),
        y: Math.max(0, evt.clientY - rect.top),
        cellId: id ?? null,
      });
    };

    const onBlankContextMenu = (evt: MouseEvent) => {
      evt.preventDefault();
      onContextMenu({ visible: false, x: 0, y: 0, cellId: null });
    };

    // Event handlers para herramientas avanzadas
    const onElementPointerClick = (elementView: any) => {
      // Remover herramientas existentes
      paper.removeTools();
      
      const element = elementView.model;
      
      // Agregar herramientas al elemento
      const elementTools = createElementTools(element);
      const elementToolsView = new joint.dia.ToolsView({ tools: elementTools });
      elementView.addTools(elementToolsView);
      
      // Agregar herramientas a los enlaces conectados
      const connectedLinks = graph.getConnectedLinks(element);
      connectedLinks.forEach((link: any) => {
        const linkView = paper.findViewByModel(link);
        if (linkView) {
          const linkTools = createLinkWithLabelsTools(link, element);
          const linkToolsView = new joint.dia.ToolsView({ tools: linkTools });
          linkView.addTools(linkToolsView);
        }
      });
    };

    const onLinkPointerClick = (linkView: any) => {
      // Remover herramientas existentes
      paper.removeTools();
      
      const link = linkView.model;
      
      // Agregar herramientas al enlace
      const linkTools = createLabelEditTools(link);
      const linkToolsView = new joint.dia.ToolsView({ tools: linkTools });
      linkView.addTools(linkToolsView);
      
      // Actualizar posicionamiento de etiquetas
      updateLabelsTextAnchor(link);
    };

    const onBlankPointerDownAdvanced = () => {
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
