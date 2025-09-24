// uml-webapp/lib/umlRenderer.ts
// Funciones para renderizar y redimensionar elementos UML

import * as joint from "jointjs";
import { calculateUmlCellDimensions, calculateStandardCellDimensions } from "./umlDimensions";
import { getUmlElementStyles, getStandardElementStyles } from "./umlStyles";

export type NodeToolKind = "uml-class" | "uml-interface" | "uml-abstract" | "uml-enum" | "uml-package";

/**
 * Redimensiona automáticamente una celda UML
 */
export function autoResizeUmlCell(cell: any) {
  if (!cell?.get) return;
  const type = cell.get("type");
  const isUml = typeof type === "string" && type.startsWith("uml.");
  
  if (isUml) {
    const name: string = cell.get("name") || "";
    const attributes: string[] = cell.get("attributes") || [];
    const methods: string[] = cell.get("methods") || [];

    const { width, height } = calculateUmlCellDimensions(name, attributes, methods);

    try {
      cell.resize(width, height);
      
      // Aplicar estilos mejorados después del resize
      const typePrefix = type.replace("uml.", "");
      const styles = getUmlElementStyles(typePrefix);
      cell.attr(styles);
    } catch (error) {
      console.warn('Error resizing UML cell:', error);
    }
  } else {
    // Fallback: standard rectangle width based on label
    const label = cell.attr?.("label/text") || "";
    const { width, height } = calculateStandardCellDimensions(label);
    
    try {
      cell.resize(width, height);
      
      // Aplicar estilos mejorados
      const styles = getStandardElementStyles();
      cell.attr(styles);
    } catch (error) {
      console.warn('Error resizing standard cell:', error);
    }
  }
}

/**
 * Crea un nodo UML con estilos aplicados
 */
export function createUmlNode(kind: NodeToolKind, graph: joint.dia.Graph, x: number, y: number) {
  const umlNs: any = (joint.shapes as any).uml;
  try {
    if (umlNs) {
      if (kind === "uml-class") {
        const el = new umlNs.Class({
          position: { x: x - 90, y: y - 35 },
          size: { width: 180, height: 70 },
          name: "Class",
          attributes: [],
          methods: [],
          z: 10,
        });
        applyUmlElementStyles(el, "class");
        el.addTo(graph);
        autoResizeUmlCell(el);
        return;
      }
      
      if (kind === "uml-interface") {
        const el = new umlNs.Interface({
          position: { x: x - 90, y: y - 35 },
          size: { width: 180, height: 70 },
          name: "Interface",
          attributes: [],
          methods: [],
          z: 10,
        });
        applyUmlElementStyles(el, "interface");
        el.addTo(graph);
        autoResizeUmlCell(el);
        return;
      }
      
      if (kind === "uml-abstract") {
        const el = new umlNs.Abstract({
          position: { x: x - 90, y: y - 35 },
          size: { width: 180, height: 70 },
          name: "AbstractClass",
          attributes: [],
          methods: [],
          z: 10,
        });
        applyUmlElementStyles(el, "abstract");
        el.addTo(graph);
        autoResizeUmlCell(el);
        return;
      }
      
      if (kind === "uml-enum") {
        const el = new umlNs.Class({
          position: { x: x - 90, y: y - 35 },
          size: { width: 180, height: 70 },
          name: "Enum",
          attributes: [],
          methods: [],
          z: 10,
        });
        applyUmlElementStyles(el, "enum");
        el.addTo(graph);
        autoResizeUmlCell(el);
        return;
      }
      
      if (kind === "uml-package") {
        // Crear un paquete usando un rectángulo con etiqueta
        const rect = new (joint.shapes as any).standard.Rectangle();
        rect.position(x - 90, y - 35);
        rect.resize(180, 70);
        rect.set('z', 10);
        rect.attr({ 
          body: { 
            fill: "#f0f0f0", 
            stroke: "#2c3e50", 
            strokeWidth: 2,
            rx: 5,
            ry: 5
          }, 
          label: { 
            text: "Package", 
            fill: "#2c3e50", 
            fontSize: 18, 
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
            fontWeight: "600",
            textAnchor: 'middle'
          } 
        });
        rect.addTo(graph);
        autoResizeUmlCell(rect);
        return;
      }
    }
    
    // Fallback rectangle con estilos mejorados
    const rect = new (joint.shapes as any).standard.Rectangle();
    rect.position(x - 90, y - 35);
    rect.resize(180, 70);
    rect.set('z', 10);
    rect.attr({ 
      body: { fill: "#ffffff", stroke: "#000000", strokeWidth: 2 }, 
      label: { text: kind.replace("uml-", ""), fill: "#000000", fontSize: 18, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontWeight: "600" } 
    });
    rect.addTo(graph);
    autoResizeUmlCell(rect);
  } catch (e) {
    console.error("createUmlNode error", e);
  }
}

/**
 * Aplica estilos específicos a un elemento UML
 */
function applyUmlElementStyles(element: any, type: string) {
  const styles = getUmlElementStyles(type);
  element.attr(styles);
}

/**
 * Obtiene datos de una celda UML
 */
export function getClassDataFromCell(cell: any): any | null {
  if (!cell) return null;
  const type = cell.get?.("type");
  const id = cell.id as string;
  if (!id) return null;
  if (typeof type === "string" && type.startsWith("uml.")) {
    let kind: any = "uml-class";
    if (type === "uml.Interface") kind = "uml-interface";
    else if (type === "uml.Abstract") kind = "uml-abstract";
    else if (type === "uml.Enum") kind = "uml-enum";
    else if (type === "uml.Package") kind = "uml-package";
    return {
      id,
      kind,
      name: cell.get("name"),
      attributes: cell.get("attributes") || [],
      methods: cell.get("methods") || [],
    };
  }
  // Fallback for standard rectangle
  const label = cell.attr?.("label/text");
  return { id, kind: "standard", name: label };
}

/**
 * Aplica datos a una celda UML
 */
export function applyClassDataToCell(cell: any, data: any) {
  if (!cell || !data) return;
  const type = cell.get?.("type");
  const isUml = typeof type === "string" && type.startsWith("uml.");
  if (isUml) {
    if (data.name !== undefined) cell.set("name", data.name);
    if (data.attributes !== undefined) cell.set("attributes", data.attributes);
    if (data.methods !== undefined) cell.set("methods", data.methods);
    
    // Aplicar estilos mejorados
    const typePrefix = type.replace("uml.", "");
    const styles = getUmlElementStyles(typePrefix);
    cell.attr(styles);
    
    // Auto-resize after applying updates
    autoResizeUmlCell(cell);
  } else {
    if (data.name !== undefined) {
      cell.attr("label/text", data.name);
      const styles = getStandardElementStyles();
      cell.attr(styles);
    }
    cell.attr("body/fill", "#ffffff");
    cell.attr("body/stroke", "#000000");
    cell.attr("body/strokeWidth", 2);
    autoResizeUmlCell(cell);
  }
}
