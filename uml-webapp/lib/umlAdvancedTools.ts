// uml-webapp/lib/umlAdvancedTools.ts
// Herramientas avanzadas para edición de enlaces UML

import * as joint from "jointjs";

// Tipos para enlaces UML
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
 * Actualiza la posición de las etiquetas de enlaces basándose en la posición del ancla
 * Esto permite que las etiquetas se posicionen correctamente sin necesidad de renderizar
 */
export function updateLabelsTextAnchor(link: joint.dia.Link) {
  const currentLabels = link.labels();
  if (!currentLabels || currentLabels.length === 0) return;
  
  const labels = joint.util.cloneDeep(currentLabels).map((label: any) => {
    let anchorDef: any, element: any;
    
    if (label.position.distance < 0) {
      element = link.getTargetCell();
      anchorDef = link.target().anchor;
    } else {
      element = link.getSourceCell();
      anchorDef = link.source().anchor;
    }
    
    // Verificar que tenemos los datos necesarios
    if (!element || !anchorDef || !element.getBBox) {
      return label; // Retornar label sin modificar si faltan datos
    }
    
    const bbox = element.getBBox();
    if (!bbox) {
      return label; // Retornar label sin modificar si no hay bbox
    }
    
    const { name = "topLeft", args = {} } = anchorDef;
    const anchorName = joint.util.toKebabCase(name) as any;
    const anchorOffset = { x: args.dx || 0, y: args.dy || 0 };
    const anchor = joint.util
      .getRectPoint(bbox, anchorName)
      .offset(anchorOffset);
    
    const newTextAnchor = getTextAnchor(bbox.sideNearestToPoint(anchor));
    
    // Solo actualizar si el textAnchor ha cambiado para evitar parpadeo
    if (label.attrs.text.textAnchor !== newTextAnchor) {
      label.attrs.text.textAnchor = newTextAnchor;
    }
    
    return label;
  });
  
  // Solo actualizar si hay cambios reales
  const hasChanges = labels.some((label: any, index: number) => {
    const currentLabel = currentLabels[index];
    return currentLabel && 
           currentLabel.attrs && 
           currentLabel.attrs.text && 
           label.attrs.text.textAnchor !== currentLabel.attrs.text.textAnchor;
  });
  
  if (hasChanges) {
  link.labels(labels);
  }
}

/**
 * Router ortogonal personalizado simplificado
 */
export function orthogonalRouter(vertices: any[], opt: any, linkView: any): any[] {
  // Verificar que tenemos los datos necesarios
  if (!linkView || !linkView.sourceBBox || !linkView.targetBBox || 
      !linkView.sourceAnchor || !linkView.targetAnchor) {
    // Fallback a router básico si faltan datos
    return [];
  }
  
  // Si ya hay vértices definidos, usarlos para evitar recálculos
  if (vertices && vertices.length > 0) {
    return vertices;
  }

  const sourceBBox = linkView.sourceBBox;
  const targetBBox = linkView.targetBBox;
  const sourcePoint = linkView.sourceAnchor;
  const targetPoint = linkView.targetAnchor;
  
  const spacing = 28;
  
  // Calcular puntos fuera de los elementos
  const sourceOutsidePoint = sourcePoint.clone();
  const targetOutsidePoint = targetPoint.clone();
  
  const sourceSide = sourceBBox.sideNearestToPoint(sourcePoint);
  const targetSide = targetBBox.sideNearestToPoint(targetPoint);
  
  // Ajustar puntos según el lado
  switch (sourceSide) {
    case "left":
      sourceOutsidePoint.x = sourceBBox.x - spacing;
      break;
    case "right":
      sourceOutsidePoint.x = sourceBBox.x + sourceBBox.width + spacing;
      break;
    case "top":
      sourceOutsidePoint.y = sourceBBox.y - spacing;
      break;
    case "bottom":
      sourceOutsidePoint.y = sourceBBox.y + sourceBBox.height + spacing;
      break;
  }
  
  switch (targetSide) {
    case "left":
      targetOutsidePoint.x = targetBBox.x - spacing;
      break;
    case "right":
      targetOutsidePoint.x = targetBBox.x + targetBBox.width + spacing;
      break;
    case "top":
      targetOutsidePoint.y = targetBBox.y - spacing;
      break;
    case "bottom":
      targetOutsidePoint.y = targetBBox.y + targetBBox.height + spacing;
      break;
  }

  const { x: sox, y: soy } = sourceOutsidePoint;
  const { x: tox, y: toy } = targetOutsidePoint;
  const tx1 = targetBBox.x + targetBBox.width;
  const ty1 = targetBBox.y + targetBBox.height;
  const tcx = (targetBBox.x + tx1) / 2;
  const tcy = (targetBBox.y + ty1) / 2;
  const sx1 = sourceBBox.x + sourceBBox.width;
  const sy1 = sourceBBox.y + sourceBBox.height;

  // Casos principales de routing ortogonal
  if (sourceSide === "left" && targetSide === "right") {
    if (sox < tox) {
      let y = (soy + toy) / 2;
      if (sox < targetBBox.x) {
        if (y > tcy && y < ty1 + spacing) {
          y = targetBBox.y - spacing;
        } else if (y <= tcy && y > targetBBox.y - spacing) {
          y = ty1 + spacing;
        }
      }
      return [
        { x: sox, y: soy },
        { x: sox, y },
        { x: tox, y },
        { x: tox, y: toy }
      ];
    } else {
      const x = (sox + tox) / 2;
    return [
        { x, y: soy },
        { x, y: toy }
      ];
    }
  } else if (sourceSide === "right" && targetSide === "left") {
    if (sox > tox) {
      let y = (soy + toy) / 2;
      if (sox > tx1) {
        if (y > tcy && y < ty1 + spacing) {
          y = targetBBox.y - spacing;
        } else if (y <= tcy && y > targetBBox.y - spacing) {
          y = ty1 + spacing;
        }
      }
      return [
        { x: sox, y: soy },
        { x: sox, y },
        { x: tox, y },
        { x: tox, y: toy }
      ];
    } else {
      const x = (sox + tox) / 2;
    return [
        { x, y: soy },
        { x, y: toy }
      ];
    }
  } else if (sourceSide === "top" && targetSide === "bottom") {
    if (soy < toy) {
      let x = (sox + tox) / 2;
      if (soy < targetBBox.y) {
        if (x > tcx && x < tx1 + spacing) {
          x = targetBBox.x - spacing;
        } else if (x <= tcx && x > targetBBox.x - spacing) {
          x = tx1 + spacing;
        }
      }
      return [
        { x: sox, y: soy },
        { x, y: soy },
        { x, y: toy },
        { x: tox, y: toy }
      ];
    }
    const y = (soy + toy) / 2;
    return [
      { x: sox, y },
      { x: tox, y }
    ];
  } else if (sourceSide === "bottom" && targetSide === "top") {
    if (soy >= toy) {
      let x = (sox + tox) / 2;
      if (soy > ty1) {
        if (x > tcx && x < tx1 + spacing) {
          x = targetBBox.x - spacing;
        } else if (x <= tcx && x > targetBBox.x - spacing) {
          x = tx1 + spacing;
        }
      }
      return [
        { x: sox, y: soy },
        { x, y: soy },
        { x, y: toy },
        { x: tox, y: toy }
      ];
    }
    const y = (soy + toy) / 2;
    return [
      { x: sox, y },
      { x: tox, y }
    ];
  } else if (sourceSide === "top" && targetSide === "top") {
    const y = Math.min(soy, toy);
    return [
      { x: sox, y },
      { x: tox, y }
    ];
  } else if (sourceSide === "bottom" && targetSide === "bottom") {
    const y = Math.max(soy, toy);
    return [
      { x: sox, y },
      { x: tox, y }
    ];
  } else if (sourceSide === "left" && targetSide === "left") {
    const x = Math.min(sox, tox);
    return [
      { x, y: soy },
      { x, y: toy }
    ];
  } else if (sourceSide === "right" && targetSide === "right") {
    const x = Math.max(sox, tox);
    return [
      { x, y: soy },
      { x, y: toy }
    ];
  }
  
  // Casos diagonales - routing más complejo
  if (sourceSide === "top" && targetSide === "right") {
    if (soy > toy) {
      if (sox < tox) {
        let y = (sourceBBox.y + toy) / 2;
        if (y > tcy && y < ty1 + spacing && sox < targetBBox.x - spacing) {
          y = targetBBox.y - spacing;
        }
        return [
          { x: sox, y },
          { x: tox, y },
          { x: tox, y: toy }
        ];
      }
      return [{ x: sox, y: toy }];
    }
    const x = (sourceBBox.x + tox) / 2;
    if (x > sourceBBox.x - spacing && soy < ty1) {
      const y = Math.min(sourceBBox.y, targetBBox.y) - spacing;
      const x = Math.max(sx1, tx1) + spacing;
      return [
        { x: sox, y },
        { x, y },
        { x, y: toy }
      ];
    }
    return [
      { x: sox, y: soy },
      { x: x, y: soy },
      { x: x, y: toy }
    ];
  } else if (sourceSide === "top" && targetSide === "left") {
    if (soy > toy) {
      if (sox > tox) {
        let y = (sourceBBox.y + toy) / 2;
        if (y > tcy && y < ty1 + spacing && sox > tx1 + spacing) {
          y = targetBBox.y - spacing;
        }
        return [
          { x: sox, y },
          { x: tox, y },
          { x: tox, y: toy }
        ];
      }
      return [{ x: sox, y: toy }];
    }
    const x = (sx1 + tox) / 2;
    if (x < sx1 + spacing && soy < ty1) {
      const y = Math.min(sourceBBox.y, targetBBox.y) - spacing;
      const x = Math.min(sourceBBox.x, targetBBox.x) - spacing;
      return [
        { x: sox, y },
        { x, y },
        { x, y: toy }
      ];
    }
    return [
      { x: sox, y: soy },
      { x: x, y: soy },
      { x: x, y: toy }
    ];
  } else if (sourceSide === "bottom" && targetSide === "right") {
    if (soy < toy) {
      if (sox < tox) {
        let y = (sy1 + targetBBox.y) / 2;
        if (y < tcy && y > targetBBox.y - spacing && sox < targetBBox.x - spacing) {
          y = ty1 + spacing;
        }
        return [
          { x: sox, y },
          { x: tox, y },
          { x: tox, y: toy }
        ];
      }
      return [
        { x: sox, y: soy },
        { x: sox, y: toy },
        { x: tox, y: toy }
      ];
    }
    const x = (sourceBBox.x + tox) / 2;
    if (x > sourceBBox.x - spacing && sy1 > toy) {
      const y = Math.max(sy1, ty1) + spacing;
      const x = Math.max(sx1, tx1) + spacing;
      return [
        { x: sox, y },
        { x, y },
        { x, y: toy }
      ];
    }
    return [
      { x: sox, y: soy },
      { x: x, y: soy },
      { x: x, y: toy },
      { x: tox, y: toy }
    ];
  } else if (sourceSide === "bottom" && targetSide === "left") {
    if (soy < toy) {
      if (sox > tox) {
        let y = (sy1 + targetBBox.y) / 2;
        if (y < tcy && y > targetBBox.y - spacing && sox > tx1 + spacing) {
          y = ty1 + spacing;
        }
        return [
          { x: sox, y },
          { x: tox, y },
          { x: tox, y: toy }
        ];
      }
      return [
        { x: sox, y: soy },
        { x: sox, y: toy },
        { x: tox, y: toy }
      ];
    }
    const x = (sx1 + tox) / 2;
    if (x < sx1 + spacing && sy1 > toy) {
      const y = Math.max(sy1, ty1) + spacing;
      const x = Math.min(sourceBBox.x, targetBBox.x) - spacing;
      return [
        { x: sox, y },
        { x, y },
        { x, y: toy }
      ];
    }
    return [
      { x: sox, y: soy },
      { x: x, y: soy },
      { x: x, y: toy },
      { x: tox, y: toy }
    ];
  } else if (sourceSide === "left" && targetSide === "bottom") {
    if (sox > tox) {
      if (soy < toy) {
        let x = (sourceBBox.x + tx1) / 2;
        if (x > tcx && x < tx1 + spacing && soy < targetBBox.y - spacing) {
          x = Math.max(sx1, tx1) + spacing;
        }
        return [
          { x, y: soy },
          { x, y: toy },
          { x: tox, y: toy }
        ];
      }
      return [{ x: tox, y: soy }];
    }
    const y = (sourceBBox.y + ty1) / 2;
    if (y > sourceBBox.y - spacing) {
      const x = Math.min(sourceBBox.x, targetBBox.x) - spacing;
      const y = Math.max(sy1, ty1) + spacing;
      return [
        { x, y: soy },
        { x, y },
        { x: tox, y }
      ];
    }
    return [
      { x: sox, y: soy },
      { x: sox, y: y },
      { x: tox, y },
      { x: tox, y: toy }
    ];
  } else if (sourceSide === "left" && targetSide === "top") {
    if (sox > tox) {
      if (soy > toy) {
        let x = (sourceBBox.x + tx1) / 2;
        if (x > tcx && x < tx1 + spacing && soy > ty1 + spacing) {
          x = Math.max(sx1, tx1) + spacing;
        }
        return [
          { x, y: soy },
          { x, y: toy },
          { x: tox, y: toy }
        ];
      }
      return [{ x: tox, y: soy }];
    }
    const y = (sy1 + targetBBox.y) / 2;
    if (y < sy1 + spacing) {
      const x = Math.min(sourceBBox.x, targetBBox.x) - spacing;
      const y = Math.min(sourceBBox.y, targetBBox.y) - spacing;
      return [
        { x, y: soy },
        { x, y },
        { x: tox, y }
      ];
    }
    return [
      { x: sox, y: soy },
      { x: sox, y: y },
      { x: tox, y },
      { x: tox, y: toy }
    ];
  } else if (sourceSide === "right" && targetSide === "top") {
    if (sox < tox) {
      if (soy > toy) {
        let x = (sx1 + targetBBox.x) / 2;
        if (x < tcx && x > targetBBox.x - spacing && soy > ty1 + spacing) {
          x = Math.max(sx1, tx1) + spacing;
        }
        return [
          { x, y: soy },
          { x, y: toy },
          { x: tox, y: toy }
        ];
      }
      return [{ x: tox, y: soy }];
    }
    const y = (sy1 + targetBBox.y) / 2;
    if (y < sy1 + spacing) {
      const x = Math.max(sx1, tx1) + spacing;
      const y = Math.min(sourceBBox.y, targetBBox.y) - spacing;
      return [
        { x, y: soy },
        { x, y },
        { x: tox, y }
      ];
    }
    return [
      { x: sox, y: soy },
      { x: sox, y: y },
      { x: tox, y },
      { x: tox, y: toy }
    ];
  } else if (sourceSide === "right" && targetSide === "bottom") {
    if (sox < tox) {
      if (soy < toy) {
        let x = (sx1 + targetBBox.x) / 2;
        if (x < tcx && x > targetBBox.x - spacing && soy < targetBBox.y - spacing) {
          x = Math.min(sourceBBox.x, targetBBox.x) - spacing;
        }
        return [
          { x, y: soy },
          { x, y: toy },
          { x: tox, y: toy }
        ];
      }
      return [
        { x: sox, y: soy },
        { x: tox, y: soy },
        { x: tox, y: toy }
      ];
    }
    const y = (sourceBBox.y + ty1) / 2;
    if (y > sourceBBox.y - spacing) {
      const x = Math.max(sx1, tx1) + spacing;
      const y = Math.max(sy1, ty1) + spacing;
      return [
        { x, y: soy },
        { x, y },
        { x: tox, y }
      ];
    }
    return [
      { x: sox, y: soy },
      { x: sox, y: y },
      { x: tox, y },
      { x: tox, y: toy }
    ];
  }
  
  // Fallback para casos no cubiertos
  return [
    sourceOutsidePoint,
    { x: sourceOutsidePoint.x, y: targetOutsidePoint.y },
    targetOutsidePoint
  ];
}

/**
 * Función mejorada para determinar el ancla de texto basándose en el lado del elemento
 */
export function getTextAnchor(side: string): string {
  return side === "left" || side === "bottom" ? "end" : "start";
}

/**
 * Crea etiquetas de enlaces más elegantes
 */
export function createLabels(comments: Array<{type: string, content: string}>): any[] {
  const UNIT = 10;
  const MARGIN = 10;
  
  return comments.map((comment) => {
    const { type, content } = comment;
    const [commentType, position] = type.split("-");
    
    const isSource = position === "source";
    const isLabel = commentType === "label";
    
    return {
      attrs: {
        text: {
          text: content,
          fontSize: 12,
          fill: "#000000",
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textVerticalAnchor: "middle",
          pointerEvents: "none"
        },
        rect: {
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 1,
          rx: 4,
          ry: 4,
          padding: 8
        }
      },
      position: {
        distance: isSource ? MARGIN : -MARGIN,
        offset: UNIT * (isLabel ? 1 : -1),
        args: {
          keepGradient: true,
          ensureLegibility: true
        }
      }
    };
  });
}

/**
 * Ajusta el canvas para que todo el contenido sea visible
 */
export function scaleToFit(paper: joint.dia.Paper, graph: joint.dia.Graph): void {
  try {
    const graphBBox = graph.getBBox();
    if (!graphBBox) return;
    
    paper.scaleContentToFit({
      padding: 50,
      contentArea: graphBBox
    });
    
    const { sy } = paper.scale();
    const area = paper.getArea();
    const yTop = area.height / 2 - graphBBox.y - graphBBox.height / 2;
    const xLeft = area.width / 2 - graphBBox.x - graphBBox.width / 2;
    paper.translate(xLeft * sy, yTop * sy);
  } catch (error) {
    console.warn('Error en scaleToFit:', error);
  }
}

/**
 * Ajusta el ancla a la cuadrícula y al centro del elemento si está lo suficientemente cerca
 */
export function snapAnchorToGrid(coords: joint.g.Point, endView: joint.dia.ElementView): joint.g.Point {
  const UNIT = 10; // Tamaño de cuadrícula
  coords.snapToGrid(UNIT);
  
  const bbox = (endView as any).model.getBBox();
  // Encontrar el punto más cercano en el borde del bbox
  return bbox.pointNearestToPoint(coords);
}

/**
 * Obtiene el ancla absoluto basándose en las coordenadas
 */
export function getAbsoluteAnchor(coords: joint.g.Point, view: joint.dia.ElementView, magnet: SVGElement): any {
  // Calcular el offset del ancla desde la esquina superior izquierda del imán
  return (joint.connectionStrategies as any).pinAbsolute({}, view, magnet, coords);
}

/**
 * Configuración de herramientas para elementos UML
 */
export function createElementTools(element: joint.dia.Element): any[] {
  const tools = [
    new joint.elementTools.Boundary({
      attributes: {
        rx: 5,
        ry: 5,
        fill: "none",
        stroke: "#000000",
        "stroke-dasharray": "6,2",
        "stroke-width": 1,
        "pointer-events": "none"
      }
    })
  ];
  
  return tools;
}

/**
 * Configuración de herramientas para enlaces UML
 */
export function createLinkTools(link: joint.dia.Link, element: joint.dia.Element) {
  const tools: any[] = [];
  
  if (link.source().id === element.id) {
    tools.push(
      new joint.linkTools.SourceAnchor({
        resetAnchor: false,
        restrictArea: false,
        customAnchorAttributes: {
          "stroke-width": 2,
          fill: "#f8f9fa",
          stroke: "#000000",
          r: 6
        }
      })
    );
  }
  
  if (link.target().id === element.id) {
    tools.push(
      new joint.linkTools.TargetAnchor({
        resetAnchor: false,
        restrictArea: false,
        customAnchorAttributes: {
          "stroke-width": 2,
          fill: "#f8f9fa",
          stroke: "#000000",
          r: 6
        }
      })
    );
  }
  
  return tools;
}

/**
 * Configuración de herramientas para etiquetas de enlaces
 */
export function createLabelTools(link: joint.dia.Link) {
  const tools = [
    new joint.linkTools.Vertices(),
    new joint.linkTools.Segments(),
    new joint.linkTools.SourceArrowhead(),
    new joint.linkTools.TargetArrowhead()
  ];
  
  return tools;
}

/**
 * Configuración de herramientas para edición de etiquetas
 */
export function createLabelEditTools(link: joint.dia.Link): any[] {
  const tools = [
    new joint.linkTools.Remove({
      distance: 20
    })
  ];
  
  return tools;
}

/**
 * Configuración de herramientas para enlaces con etiquetas
 */
export function createLinkWithLabelsTools(link: joint.dia.Link, element: joint.dia.Element): any[] {
  const tools = [
    new joint.linkTools.Remove({
      distance: 20
    }),
    new joint.linkTools.Vertices(),
    new joint.linkTools.Segments()
  ];
  
  // Agregar herramientas de ancla si el elemento está conectado
  if (link.source().id === element.id) {
    tools.push(
      new joint.linkTools.SourceAnchor({
        resetAnchor: false,
        restrictArea: false,
        customAnchorAttributes: {
          "stroke-width": 2,
          fill: "#f8f9fa",
          stroke: "#000000",
          r: 6
        }
      })
    );
  }
  
  if (link.target().id === element.id) {
    tools.push(
      new joint.linkTools.TargetAnchor({
        resetAnchor: false,
        restrictArea: false,
        customAnchorAttributes: {
          "stroke-width": 2,
          fill: "#f8f9fa",
          stroke: "#000000",
          r: 6
        }
      })
    );
  }
  
  return tools;
}

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