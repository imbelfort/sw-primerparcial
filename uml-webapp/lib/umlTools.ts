// uml-webapp/lib/umlTools.ts
// Archivo principal que re-exporta todas las funciones UML organizadas en módulos separados

import * as joint from "jointjs";
import { autoResizeUmlCell, createUmlNode, getClassDataFromCell, applyClassDataToCell } from "./umlRenderer";
import { getLinkDataFromCell, applyLinkDataToCell, createUmlLink } from "./umlLinks";

// Tipos principales
export type NodeToolKind = "uml-class" | "uml-interface" | "uml-abstract" | "uml-enum" | "uml-package";
export type LinkToolKind = "assoc" | "aggregation" | "composition" | "dependency" | "generalization";

// Re-exportar tipos de otros módulos
export type LinkData = import("./umlLinks").LinkData;

// Re-exportar todas las funciones principales para mantener compatibilidad
export { 
  // Funciones de renderizado
  autoResizeUmlCell, 
  createUmlNode, 
  getClassDataFromCell, 
  applyClassDataToCell,
  
  // Funciones de enlaces
  getLinkDataFromCell,
  applyLinkDataToCell,
  createUmlLink
};