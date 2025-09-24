// uml-webapp/lib/umlTools.ts
// Herramientas avanzadas para edición de enlaces UML

import * as joint from "jointjs";

/**
 * Actualiza la posición de las etiquetas de enlaces basándose en la posición del ancla
 * Esto permite que las etiquetas se posicionen correctamente sin necesidad de renderizar
 */
export function updateLabelsTextAnchor(link: joint.dia.Link) {
  const labels = joint.util.cloneDeep(link.labels()).map((label: any) => {
    let anchorDef: any, element: any;
    
    if (label.position.distance < 0) {
      element = link.getTargetCell();
      anchorDef = link.target().anchor;
    } else {
      element = link.getSourceCell();
      anchorDef = link.source().anchor;
    }
    
    const bbox = element.getBBox();
    const { name = "topLeft", args = {} } = anchorDef;
    const anchorName = joint.util.toKebabCase(name) as any;
    const anchorOffset = { x: args.dx || 0, y: args.dy || 0 };
    const anchor = joint.util
      .getRectPoint(bbox, anchorName)
      .offset(anchorOffset);
    
    label.attrs.text.textAnchor = getTextAnchor(
      bbox.sideNearestToPoint(anchor)
    );
    
    return label;
  });
  
  link.labels(labels);
}

/**
 * Router ortogonal personalizado simplificado
 */
export function orthogonalRouter(vertices: any[], opt: any, linkView: any): any[] {
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

  // Casos principales de enrutamiento
  if (sourceSide === "left" && targetSide === "right") {
    const y = (sourceOutsidePoint.y + targetOutsidePoint.y) / 2;
    return [
      { x: sourceOutsidePoint.x, y: sourceOutsidePoint.y },
      { x: sourceOutsidePoint.x, y },
      { x: targetOutsidePoint.x, y },
      { x: targetOutsidePoint.x, y: targetOutsidePoint.y }
    ];
  } else if (sourceSide === "right" && targetSide === "left") {
    const y = (sourceOutsidePoint.y + targetOutsidePoint.y) / 2;
    return [
      { x: sourceOutsidePoint.x, y: sourceOutsidePoint.y },
      { x: sourceOutsidePoint.x, y },
      { x: targetOutsidePoint.x, y },
      { x: targetOutsidePoint.x, y: targetOutsidePoint.y }
    ];
  } else if (sourceSide === "top" && targetSide === "bottom") {
    const x = (sourceOutsidePoint.x + targetOutsidePoint.x) / 2;
    return [
      { x: sourceOutsidePoint.x, y: sourceOutsidePoint.y },
      { x, y: sourceOutsidePoint.y },
      { x, y: targetOutsidePoint.y },
      { x: targetOutsidePoint.x, y: targetOutsidePoint.y }
    ];
  } else if (sourceSide === "bottom" && targetSide === "top") {
    const x = (sourceOutsidePoint.x + targetOutsidePoint.x) / 2;
    return [
      { x: sourceOutsidePoint.x, y: sourceOutsidePoint.y },
      { x, y: sourceOutsidePoint.y },
      { x, y: targetOutsidePoint.y },
      { x: targetOutsidePoint.x, y: targetOutsidePoint.y }
    ];
  }

  // Casos de lados iguales
  if (sourceSide === targetSide) {
    if (sourceSide === "top" || sourceSide === "bottom") {
      const y = sourceSide === "top" ? 
        Math.min(sourceOutsidePoint.y, targetOutsidePoint.y) : 
        Math.max(sourceOutsidePoint.y, targetOutsidePoint.y);
      return [
        { x: sourceOutsidePoint.x, y },
        { x: targetOutsidePoint.x, y }
      ];
    } else {
      const x = sourceSide === "left" ? 
        Math.min(sourceOutsidePoint.x, targetOutsidePoint.x) : 
        Math.max(sourceOutsidePoint.x, targetOutsidePoint.x);
      return [
        { x, y: sourceOutsidePoint.y },
        { x, y: targetOutsidePoint.y }
      ];
    }
  }

  // Casos diagonales - simplificados
  const x = (sourceOutsidePoint.x + targetOutsidePoint.x) / 2;
  const y = (sourceOutsidePoint.y + targetOutsidePoint.y) / 2;
  
  return [
    { x: sourceOutsidePoint.x, y: sourceOutsidePoint.y },
    { x, y },
    { x: targetOutsidePoint.x, y: targetOutsidePoint.y }
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
export function createElementTools(element: joint.dia.Element) {
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
export function createLabelEditTools(link: joint.dia.Link) {
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
export function createLinkWithLabelsTools(link: joint.dia.Link, element: joint.dia.Element) {
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
