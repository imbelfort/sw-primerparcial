import { useCallback } from 'react';
import * as joint from 'jointjs';
import { createUmlLink as createUmlLinkLib } from '../../lib/umlTools';

// Hook para manejar la lógica del chatbot
export function useChatbotLogic(
  graphRef: React.RefObject<joint.dia.Graph | null>,
  setChatSuggestions: React.Dispatch<React.SetStateAction<any[]>>
) {
  
  const handleApplySuggestion = useCallback((suggestion: any) => {
    if (!graphRef.current) return;

    // Crear la clase/interface/abstract
    const x = Math.random() * 400 + 100;
    const y = Math.random() * 300 + 100;
    
    let nodeType: any = "uml-class";
    if (suggestion.type === "interface") nodeType = "uml-interface";
    else if (suggestion.type === "abstract") nodeType = "uml-abstract";

    // Crear el elemento directamente con los datos
    const umlNs: any = (joint.shapes as any).uml;
    let element: any = null;

    try {
      if (umlNs) {
        if (nodeType === "uml-class") {
          element = new umlNs.Class({
            position: { x: x - 90, y: y - 35 },
            size: { width: 180, height: 70 },
            name: suggestion.name || "NuevaClase",
            attributes: suggestion.attributes || [],
            methods: suggestion.methods || [],
          });
        } else if (nodeType === "uml-interface") {
          element = new umlNs.Interface({
            position: { x: x - 90, y: y - 35 },
            size: { width: 180, height: 70 },
            name: suggestion.name || "NuevaInterfaz",
            attributes: suggestion.attributes || [],
            methods: suggestion.methods || [],
          });
        } else if (nodeType === "uml-abstract") {
          element = new umlNs.Abstract({
            position: { x: x - 90, y: y - 35 },
            size: { width: 180, height: 70 },
            name: suggestion.name || "NuevaAbstracta",
            attributes: suggestion.attributes || [],
            methods: suggestion.methods || [],
          });
        }
      }

      if (element) {
        // Aplicar estilos en blanco y negro
        const typePrefix = nodeType.replace("uml-", "");
        element.attr({
          [`.uml-${typePrefix}-name-rect`]: { fill: '#ffffff', stroke: '#000000', strokeWidth: 2 },
          [`.uml-${typePrefix}-attributes-rect`]: { fill: '#ffffff', stroke: '#000000', strokeWidth: 1 },
          [`.uml-${typePrefix}-methods-rect`]: { fill: '#ffffff', stroke: '#000000', strokeWidth: 1 },
          [`.uml-${typePrefix}-name-text`]: { fill: '#000000', fontSize: 14, fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },
          [`.uml-${typePrefix}-attributes-text`]: { fill: '#000000', fontSize: 12, fontFamily: 'Arial, sans-serif' },
          [`.uml-${typePrefix}-methods-text`]: { fill: '#000000', fontSize: 12, fontFamily: 'Arial, sans-serif' }
        });

        // Agregar al grafo
        element.addTo(graphRef.current);
        
        // Auto-resize
        const autoResizeUmlCell = (cell: any) => {
          if (!cell?.get) return;
          const type = cell.get("type");
          const isUml = typeof type === "string" && type.startsWith("uml.");
          if (isUml) {
            const name: string = cell.get("name") || "";
            const attributes: string[] = cell.get("attributes") || [];
            const methods: string[] = cell.get("methods") || [];

            const lineHeight = 22;
            const headerHeight = 32;
            const sectionGap = 10;
            const paddingV = 24;

            let height = paddingV + headerHeight;
            if (attributes.length > 0) height += sectionGap + attributes.length * lineHeight;
            if (methods.length > 0) height += sectionGap + methods.length * lineHeight;
            height += paddingV;

            const longest = Math.max(
              name.length,
              ...attributes.map((s) => s.length),
              ...methods.map((s) => s.length)
            );
            const width = Math.max(180, Math.min(600, longest * 8 + 40));

            try {
              cell.resize(width, height);
            } catch {}
          }
        };

        autoResizeUmlCell(element);
      } else {
        // Fallback: crear rectángulo estándar
        const rect = new (joint.shapes as any).standard.Rectangle();
        rect.position(x - 90, y - 35);
        rect.resize(180, 70);
        rect.attr({ 
          body: { fill: "#ffffff", stroke: "#000000", strokeWidth: 2 }, 
          label: { text: suggestion.name || "NuevaClase", fill: "#000000", fontSize: 14, fontFamily: "Arial, sans-serif", fontWeight: "bold" } 
        });
        rect.addTo(graphRef.current);
      }

    } catch (error) {
      console.error('Error al crear elemento:', error);
    }

    // Crear relaciones si las hay
    if (suggestion.relationships && suggestion.relationships.length > 0) {
      setTimeout(() => {
        const cells = graphRef.current?.getCells() || [];
        const sourceCell = cells.find(cell => 
          (cell as any).get?.("name") === suggestion.name
        );
        
        if (sourceCell) {
          suggestion.relationships.forEach((rel: any) => {
            const targetCell = cells.find(cell => 
              (cell as any).get?.("name") === rel.target
            );
            
            if (targetCell) {
              let linkType: any = "assoc";
              if (rel.type === "generalization") linkType = "generalization";
              else if (rel.type === "composition") linkType = "composition";
              else if (rel.type === "aggregation") linkType = "aggregation";
              else if (rel.type === "dependency") linkType = "dependency";

              try {
                // Crear el enlace con el tipo correcto
                const link = createUmlLinkLib(linkType, graphRef.current!, String(sourceCell.id), String(targetCell.id));
                
                // Aplicar etiquetas y multiplicidades si están disponibles
                if (link && (rel.label || rel.multiplicity || rel.sourceMultiplicity)) {
                  const labels: any[] = [];
                  
                  // Etiqueta de la relación (en el medio)
                  if (rel.label) {
                    labels.push({
                      position: 0.5,
                      attrs: {
                        text: {
                          text: rel.label,
                          fill: '#000000',
                          fontSize: 12,
                          fontFamily: 'Arial, sans-serif',
                          textAnchor: 'middle',
                          yAlignment: 'middle'
                        },
                        rect: {
                          fill: '#ffffff',
                          fillOpacity: 0.9,
                          stroke: '#000000',
                          strokeWidth: 1,
                          refWidth: 1.2,
                          refHeight: 1.4,
                          refX: 0,
                          refY: -10,
                          xAlignment: 'middle',
                          yAlignment: 'middle',
                          rx: 3,
                          ry: 3
                        }
                      }
                    });
                  }
                  
                  // Multiplicidad del origen (cerca del nodo origen)
                  if (rel.sourceMultiplicity) {
                    labels.push({
                      position: 0.1,
                      attrs: {
                        text: {
                          text: rel.sourceMultiplicity,
                          fill: '#000000',
                          fontSize: 11,
                          fontFamily: 'Arial, sans-serif',
                          textAnchor: 'middle',
                          yAlignment: 'middle'
                        },
                        rect: {
                          fill: '#ffffff',
                          fillOpacity: 0.9,
                          stroke: '#000000',
                          strokeWidth: 1,
                          refWidth: 1.1,
                          refHeight: 1.2,
                          refX: 0,
                          refY: -8,
                          xAlignment: 'middle',
                          yAlignment: 'middle',
                          rx: 2,
                          ry: 2
                        }
                      }
                    });
                  }
                  
                  // Multiplicidad del destino (cerca del nodo destino)
                  if (rel.multiplicity) {
                    labels.push({
                      position: 0.9,
                      attrs: {
                        text: {
                          text: rel.multiplicity,
                          fill: '#000000',
                          fontSize: 11,
                          fontFamily: 'Arial, sans-serif',
                          textAnchor: 'middle',
                          yAlignment: 'middle'
                        },
                        rect: {
                          fill: '#ffffff',
                          fillOpacity: 0.9,
                          stroke: '#000000',
                          strokeWidth: 1,
                          refWidth: 1.1,
                          refHeight: 1.2,
                          refX: 0,
                          refY: -8,
                          xAlignment: 'middle',
                          yAlignment: 'middle',
                          rx: 2,
                          ry: 2
                        }
                      }
                    });
                  }
                  
                  // Aplicar las etiquetas al enlace
                  if (labels.length > 0) {
                    link.labels(labels);
                  }
                }
                
                console.log('Relación creada:', rel.type, 'entre', suggestion.name, 'y', rel.target, 'con etiquetas:', rel.label, rel.multiplicity);
              } catch (error) {
                console.error('Error al crear relación:', error);
              }
            }
          });
        }
      }, 500);
    }

    setChatSuggestions((prev: any[]) => prev.filter((s: any) => s !== suggestion));
  }, [graphRef, setChatSuggestions]);

  const handleChatResponse = useCallback((response: any) => {
    if (response.suggestions && response.suggestions.length > 0) {
      setChatSuggestions(response.suggestions);
    }
  }, [setChatSuggestions]);

  const handleApplyAllSuggestions = useCallback((suggestions: any[]) => {
    if (!graphRef.current) return;

    // Crear un mapa para rastrear las relaciones ya creadas
    const createdRelationships = new Set<string>();
    
    // Función para generar una clave única para una relación
    const getRelationshipKey = (source: string, target: string, type: string) => {
      return `${source}-${target}-${type}`;
    };

    // Aplicar todas las sugerencias con posiciones organizadas
    const gridCols = Math.ceil(Math.sqrt(suggestions.length));
    const cellWidth = 250;
    const cellHeight = 180;
    const startX = 150;
    const startY = 150;

    // Primero crear todos los nodos
    suggestions.forEach((suggestion, index) => {
      const row = Math.floor(index / gridCols);
      const col = index % gridCols;
      const x = startX + col * cellWidth;
      const y = startY + row * cellHeight;
      
      // Crear el nodo con posición específica
      createNodeWithPosition(suggestion, x, y);
    });

    // Luego crear las relaciones de manera organizada
    setTimeout(() => {
      suggestions.forEach((suggestion) => {
        if (suggestion.relationships && suggestion.relationships.length > 0) {
          const cells = graphRef.current?.getCells() || [];
          const sourceCell = cells.find(cell => 
            (cell as any).get?.("name") === suggestion.name
          );
          
          if (sourceCell) {
            suggestion.relationships.forEach((rel: any) => {
              const targetCell = cells.find(cell => 
                (cell as any).get?.("name") === rel.target
              );
              
              if (targetCell) {
                // Verificar si la relación ya fue creada
                const relationshipKey = getRelationshipKey(suggestion.name, rel.target, rel.type);
                const reverseKey = getRelationshipKey(rel.target, suggestion.name, rel.type);
                
                if (!createdRelationships.has(relationshipKey) && !createdRelationships.has(reverseKey)) {
                  let linkType: any = "assoc";
                  if (rel.type === "generalization") linkType = "generalization";
                  else if (rel.type === "composition") linkType = "composition";
                  else if (rel.type === "aggregation") linkType = "aggregation";
                  else if (rel.type === "dependency") linkType = "dependency";

                  try {
                    // Crear el enlace con el tipo correcto
                    const link = createUmlLinkLib(linkType, graphRef.current!, String(sourceCell.id), String(targetCell.id));
                    
                    if (link) {
                      // Asegurar que el link sea seleccionable
                      link.set('selectable', true);
                      link.set('interactive', true);
                      
                      // Aplicar etiquetas y multiplicidades si están disponibles
                      if (rel.label || rel.multiplicity || rel.sourceMultiplicity) {
                        const labels: any[] = [];
                        
                        // Etiqueta de la relación (en el medio)
                        if (rel.label) {
                          labels.push({
                            id: 'relationship-name',
                            position: 0.5,
                            attrs: {
                              text: {
                                text: rel.label,
                                fill: '#000000',
                                fontSize: 12,
                                fontFamily: 'Arial, sans-serif',
                                textAnchor: 'middle',
                                yAlignment: 'middle'
                              },
                              rect: {
                                fill: '#ffffff',
                                fillOpacity: 0.9,
                                stroke: '#000000',
                                strokeWidth: 1,
                                refWidth: 1.2,
                                refHeight: 1.4,
                                refX: 0,
                                refY: -10,
                                xAlignment: 'middle',
                                yAlignment: 'middle',
                                rx: 3,
                                ry: 3
                              }
                            }
                          });
                        }
                        
                        // Multiplicidad del origen (cerca del nodo origen)
                        if (rel.sourceMultiplicity) {
                          labels.push({
                            id: 'source-multiplicity',
                            position: 0.1,
                            attrs: {
                              text: {
                                text: rel.sourceMultiplicity,
                                fill: '#000000',
                                fontSize: 11,
                                fontFamily: 'Arial, sans-serif',
                                textAnchor: 'middle',
                                yAlignment: 'middle'
                              },
                              rect: {
                                fill: '#ffffff',
                                fillOpacity: 0.9,
                                stroke: '#000000',
                                strokeWidth: 1,
                                refWidth: 1.1,
                                refHeight: 1.2,
                                refX: 0,
                                refY: -8,
                                xAlignment: 'middle',
                                yAlignment: 'middle',
                                rx: 2,
                                ry: 2
                              }
                            }
                          });
                        }
                        
                        // Multiplicidad del destino (cerca del nodo destino)
                        if (rel.multiplicity) {
                          labels.push({
                            id: 'target-multiplicity',
                            position: 0.9,
                            attrs: {
                              text: {
                                text: rel.multiplicity,
                                fill: '#000000',
                                fontSize: 11,
                                fontFamily: 'Arial, sans-serif',
                                textAnchor: 'middle',
                                yAlignment: 'middle'
                              },
                              rect: {
                                fill: '#ffffff',
                                fillOpacity: 0.9,
                                stroke: '#000000',
                                strokeWidth: 1,
                                refWidth: 1.1,
                                refHeight: 1.2,
                                refX: 0,
                                refY: -8,
                                xAlignment: 'middle',
                                yAlignment: 'middle',
                                rx: 2,
                                ry: 2
                              }
                            }
                          });
                        }
                        
                        // Aplicar las etiquetas al enlace
                        if (labels.length > 0) {
                          link.labels(labels);
                        }
                      }
                      
                      // Marcar la relación como creada
                      createdRelationships.add(relationshipKey);
                      
                      console.log('Relación creada:', rel.type, 'entre', suggestion.name, 'y', rel.target);
                    }
                  } catch (error) {
                    console.error('Error al crear relación:', error);
                  }
                }
              }
            });
          }
        }
      });
    }, 1000); // Esperar más tiempo para que todos los nodos se creen

    // Limpiar las sugerencias después de aplicarlas
    setChatSuggestions([]);
  }, [graphRef, setChatSuggestions]);

  // Función auxiliar para crear nodos con posición específica
  const createNodeWithPosition = (suggestion: any, x: number, y: number) => {
    if (!graphRef.current) return;

    let nodeType: any = "uml-class";
    if (suggestion.type === "interface") nodeType = "uml-interface";
    else if (suggestion.type === "abstract") nodeType = "uml-abstract";
    else if (suggestion.type === "enum") nodeType = "uml-enum";
    else if (suggestion.type === "package") nodeType = "uml-package";

    // Crear el elemento directamente con los datos
    const umlNs: any = (joint.shapes as any).uml;
    let element: any = null;

    try {
      if (umlNs) {
        if (nodeType === "uml-class") {
          element = new umlNs.Class({
            position: { x: x - 90, y: y - 35 },
            size: { width: 180, height: 70 },
            name: suggestion.name || "NuevaClase",
            attributes: suggestion.attributes || [],
            methods: suggestion.methods || [],
            z: 10, // Asegurar que esté por encima de los links
          });
        } else if (nodeType === "uml-interface") {
          element = new umlNs.Interface({
            position: { x: x - 90, y: y - 35 },
            size: { width: 180, height: 70 },
            name: suggestion.name || "NuevaInterfaz",
            attributes: suggestion.attributes || [],
            methods: suggestion.methods || [],
            z: 10,
          });
        } else if (nodeType === "uml-abstract") {
          element = new umlNs.Abstract({
            position: { x: x - 90, y: y - 35 },
            size: { width: 180, height: 70 },
            name: suggestion.name || "NuevaAbstracta",
            attributes: suggestion.attributes || [],
            methods: suggestion.methods || [],
            z: 10,
          });
        } else if (nodeType === "uml-enum") {
          element = new umlNs.Class({
            position: { x: x - 90, y: y - 35 },
            size: { width: 180, height: 70 },
            name: suggestion.name || "NuevaEnum",
            attributes: suggestion.attributes || [],
            methods: suggestion.methods || [],
            z: 10,
          });
        }
      }

      if (element) {
        // Aplicar estilos mejorados
        const typePrefix = nodeType.replace("uml-", "");
        element.attr({
          [`.uml-${typePrefix}-name-rect`]: { 
            fill: '#ffffff', 
            stroke: '#000000', 
            strokeWidth: 2,
            rx: 2,
            ry: 2
          },
          [`.uml-${typePrefix}-attributes-rect`]: { 
            fill: '#f8f9fa', 
            stroke: '#000000', 
            strokeWidth: 1,
            rx: 1,
            ry: 1
          },
          [`.uml-${typePrefix}-methods-rect`]: { 
            fill: '#f8f9fa', 
            stroke: '#000000', 
            strokeWidth: 1,
            rx: 1,
            ry: 1
          },
          [`.uml-${typePrefix}-name-text`]: { 
            fill: '#000000', 
            fontSize: 15, 
            fontFamily: 'Arial, sans-serif', 
            fontWeight: 'bold',
            textAnchor: 'middle'
          },
          [`.uml-${typePrefix}-attributes-text`]: { 
            fill: '#000000', 
            fontSize: 13, 
            fontFamily: 'Arial, sans-serif',
            textAnchor: 'start'
          },
          [`.uml-${typePrefix}-methods-text`]: { 
            fill: '#000000', 
            fontSize: 13, 
            fontFamily: 'Arial, sans-serif',
            textAnchor: 'start'
          }
        });

        // Agregar al grafo
        element.addTo(graphRef.current);
        
        // Auto-resize
        const autoResizeUmlCell = (cell: any) => {
          if (!cell?.get) return;
          const type = cell.get("type");
          const isUml = typeof type === "string" && type.startsWith("uml.");
          if (isUml) {
            const name: string = cell.get("name") || "";
            const attributes: string[] = cell.get("attributes") || [];
            const methods: string[] = cell.get("methods") || [];

            const lineHeight = 22;
            const headerHeight = 32;
            const sectionGap = 10;
            const paddingV = 24;

            let height = paddingV + headerHeight;
            if (attributes.length > 0) height += sectionGap + attributes.length * lineHeight;
            if (methods.length > 0) height += sectionGap + methods.length * lineHeight;
            height += paddingV;

            const longest = Math.max(
              name.length,
              ...attributes.map((s) => s.length),
              ...methods.map((s) => s.length)
            );
            const width = Math.max(180, Math.min(600, longest * 8 + 40));

            try {
              cell.resize(width, height);
            } catch {}
          }
        };

        autoResizeUmlCell(element);
      } else {
        // Fallback: crear rectángulo estándar
        const rect = new (joint.shapes as any).standard.Rectangle();
        rect.position(x - 90, y - 35);
        rect.resize(180, 70);
        rect.set('z', 10);
        rect.attr({ 
          body: { fill: "#ffffff", stroke: "#000000", strokeWidth: 2 }, 
          label: { text: suggestion.name || "NuevaClase", fill: "#000000", fontSize: 14, fontFamily: "Arial, sans-serif", fontWeight: "bold" } 
        });
        rect.addTo(graphRef.current);
      }

    } catch (error) {
      console.error('Error al crear elemento:', error);
    }
  };

  return {
    handleApplySuggestion,
    handleApplyAllSuggestions,
    handleChatResponse,
  };
}
