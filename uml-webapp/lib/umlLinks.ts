// uml-webapp/lib/umlLinks.ts
// Funciones para crear y configurar enlaces UML

import * as joint from "jointjs";
import { orthogonalRouter } from "./umlAdvancedTools";

export type LinkToolKind = "assoc" | "aggregation" | "composition" | "dependency" | "generalization";

export type LinkData = {
  id: string;
  kind: LinkToolKind | "standard";
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
  sourceRole?: string;
  targetRole?: string;
};

/**
 * Configuración por defecto para enlaces UML
 */
export const UML_LINK_CONFIG = {
  z: 1,
  connector: { 
    name: 'rounded',
    args: { radius: 15 }
  },
  router: orthogonalRouter,
  connectionPoint: {
    name: 'boundary',
    args: {
      sticky: true,
      offset: 3,
      priority: ['right', 'left', 'top', 'bottom']
    }
  },
  defaultLabel: {
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' }
    ],
    attrs: {
      text: {
        text: '',
        'font-size': 16,
        'text-anchor': 'middle',
        'y-alignment': 'middle',
        'fill': '#000000',
        'font-family': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'font-weight': '500'
      },
      body: {
        fill: '#ffffff',
        stroke: '#000000',
        'stroke-width': 1,
        rx: 4,
        ry: 4,
        padding: 8
      }
    },
    position: {
      distance: 0.5,
      args: {
        keepGradient: true,
        ensureLegibility: true
      }
    }
  }
} as const;

/**
 * Configuración de marcadores para diferentes tipos de enlaces
 */
export const UML_MARKERS = {
  base: {
    stroke: "#000000",
    'stroke-width': 1,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  },
  generalization: {
    targetMarker: { 
      type: "path", 
      d: "M 7 -4 0 0 7 4", 
      fill: "none", 
      stroke: "#000000", 
      'stroke-width': 1 
    }
  },
  aggregation: {
    sourceMarker: { 
      type: "path", 
      d: "M 10 -4 0 0 10 4 20 0 z", 
      fill: "#ffffff", 
      stroke: "#000000", 
      'stroke-width': 1 
    },
    targetMarker: { 
      type: "path", 
      d: "M 7 -4 0 0 7 4", 
      fill: "none",
      stroke: "#000000",
      'stroke-width': 1
    }
  },
  composition: {
    sourceMarker: { 
      type: "path", 
      d: "M 10 -4 0 0 10 4 20 0 z", 
      fill: "#000000", 
      stroke: "#000000", 
      'stroke-width': 1 
    },
    targetMarker: { 
      type: "path", 
      d: "M 7 -4 0 0 7 4", 
      fill: "none",
      stroke: "#000000",
      'stroke-width': 1
    }
  },
  dependency: {
    strokeDasharray: "5,3",
    targetMarker: { 
      type: "path", 
      d: "M 7 -4 0 0 7 4", 
      fill: "none",
      stroke: "#000000",
      'stroke-width': 1
    }
  },
  association: {
    targetMarker: { 
      type: "path", 
      d: "M 7 -4 0 0 7 4", 
      fill: "none",
      stroke: "#000000",
      'stroke-width': 1
    }
  }
} as const;

/**
 * Obtiene los datos de un enlace desde una celda
 */
export function getLinkDataFromCell(cell: any): LinkData | null {
  if (!cell?.isLink?.()) return null;
  const id = cell.id as string;
  const type = cell.get?.("type") as string | undefined;
  let kind: LinkData["kind"] = "standard";
  if (type?.startsWith("uml.")) {
    if (type === "uml.Association") kind = "assoc";
    else if (type === "uml.Aggregation") kind = "aggregation";
    else if (type === "uml.Composition") kind = "composition";
    else if (type === "uml.Dependency") kind = "dependency";
    else if (type === "uml.Generalization") kind = "generalization";
  }
  
  // Obtener todos los labels y mapearlos por su tipo
  const labels = (cell.get("labels") || []) as Array<{id?: string, attrs?: any}>;
  
  // Función para encontrar un label por su id
  const findLabel = (id: string) => {
    const label = labels.find(l => l.id === id);
    return label?.attrs?.text?.text;
  };
  
  return {
    id,
    kind,
    sourceMultiplicity: findLabel('source-multiplicity'),
    targetMultiplicity: findLabel('target-multiplicity'),
    sourceRole: findLabel('source-role'),
    targetRole: findLabel('target-role')
  };
}

/**
 * Aplica datos a una celda de enlace
 */
export function applyLinkDataToCell(cell: any, data: Partial<LinkData>) {
  if (!cell?.isLink?.()) return;
  
  try {
    const labels: any[] = [];
    
    if (data.sourceMultiplicity) {
      labels.push({
        id: 'source-multiplicity',
        position: 0.1,
        attrs: {
          text: {
            text: data.sourceMultiplicity,
            fill: '#000000',
            fontSize: 16,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: '500',
            textAnchor: 'middle',
            yAlignment: 'middle'
          },
          body: {
            fill: '#ffffff',
            stroke: '#000000',
            'stroke-width': 1,
            rx: 4,
            ry: 4,
            padding: 8
          }
        }
      });
    }
    
    if (data.targetMultiplicity) {
      labels.push({
        id: 'target-multiplicity',
        position: 0.9,
        attrs: {
          text: {
            text: data.targetMultiplicity,
            fill: '#000000',
            fontSize: 16,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: '500',
            textAnchor: 'middle',
            yAlignment: 'middle'
          },
          body: {
            fill: '#ffffff',
            stroke: '#000000',
            'stroke-width': 1,
            rx: 4,
            ry: 4,
            padding: 8
          }
        }
      });
    }
    
    if (data.sourceRole) {
      labels.push({
        id: 'source-role',
        position: 0.1,
        attrs: {
          text: {
            text: data.sourceRole,
            fill: '#000000',
            fontSize: 16,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: '500',
            textAnchor: 'middle',
            yAlignment: 'middle'
          },
          body: {
            fill: '#ffffff',
            stroke: '#000000',
            'stroke-width': 1,
            rx: 4,
            ry: 4,
            padding: 8
          }
        }
      });
    }
    
    if (data.targetRole) {
      labels.push({
        id: 'target-role',
        position: 0.9,
        attrs: {
          text: {
            text: data.targetRole,
            fill: '#000000',
            fontSize: 16,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: '500',
            textAnchor: 'middle',
            yAlignment: 'middle'
          },
          body: {
            fill: '#ffffff',
            stroke: '#000000',
            'stroke-width': 1,
            rx: 4,
            ry: 4,
            padding: 8
          }
        }
      });
    }
    
    if (labels.length > 0) {
      cell.set('labels', labels);
    }
    
    // Asegurar que el link sea seleccionable
    cell.set('selectable', true);
    cell.set('interactive', true);
  } catch (error) {
    console.error('Error en applyLinkDataToCell:', error, { cell, data });
  }
}

/**
 * Crea un enlace UML entre dos elementos
 */
export function createUmlLink(kind: LinkToolKind, graph: joint.dia.Graph, sourceId: string, targetId: string) {
  if (sourceId === targetId) return;
  const umlNs: any = (joint.shapes as any).uml;
  try {
    let link: any;

    if (umlNs) {
      const baseOptions = { 
        source: { id: sourceId }, 
        target: { id: targetId }, 
        ...UML_LINK_CONFIG 
      };
      
      if (kind === "assoc") { 
        link = new umlNs.Association(baseOptions); 
      } else if (kind === "aggregation") { 
        link = new umlNs.Aggregation(baseOptions); 
      } else if (kind === "composition") { 
        link = new umlNs.Composition(baseOptions); 
      } else if (kind === "dependency") { 
        if (umlNs.Dependency) { 
          link = new umlNs.Dependency(baseOptions); 
        } 
      } else if (kind === "generalization") { 
        link = new umlNs.Generalization(baseOptions); 
      }
    }
    
    if (!link) {
      // Fallback para tipos no soportados
      const base: any = { 
        stroke: "#000000", 
        'stroke-width': 1, 
        'stroke-linecap': 'round', 
        'stroke-linejoin': 'round' 
      };
      
      let targetMarker: any = { 
        type: "path", 
        d: "M 7 -4 0 0 7 4", 
        fill: "none",
        stroke: "#000000",
        'stroke-width': 1
      };
      let sourceMarker: any | undefined;
      let strokeDasharray: string | undefined;

      if (kind === "generalization") {
        targetMarker = UML_MARKERS.generalization.targetMarker;
      } else if (kind === "aggregation") {
        sourceMarker = UML_MARKERS.aggregation.sourceMarker;
        targetMarker = UML_MARKERS.aggregation.targetMarker;
      } else if (kind === "composition") {
        sourceMarker = UML_MARKERS.composition.sourceMarker;
        targetMarker = UML_MARKERS.composition.targetMarker;
      } else if (kind === "dependency") {
        strokeDasharray = UML_MARKERS.dependency.strokeDasharray;
        targetMarker = UML_MARKERS.dependency.targetMarker;
      } else if (kind === "assoc") {
        targetMarker = UML_MARKERS.association.targetMarker;
      }

      link = new joint.dia.Link({
        source: { id: sourceId },
        target: { id: targetId },
        attrs: {
          line: {
            ...UML_MARKERS.base,
            strokeDasharray: strokeDasharray,
            targetMarker: targetMarker,
            sourceMarker: sourceMarker
          }
        },
        ...UML_LINK_CONFIG
      });
    }
    
    link.addTo(graph);
    return link;
  } catch (e) {
    console.error("createUmlLink error", e);
    return null;
  }
}
