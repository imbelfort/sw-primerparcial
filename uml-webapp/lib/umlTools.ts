import * as joint from "jointjs";

export type NodeToolKind = "uml-class" | "uml-interface" | "uml-abstract" | "uml-enum" | "uml-package";
export type LinkToolKind = "assoc" | "aggregation" | "composition" | "dependency" | "generalization";

function estimateTextWidthPx(text: string) {
  // Simple heuristic: average 8px per character + padding
  const avgChar = 8;
  return text.length * avgChar + 40; // padding
}

export type LinkData = {
  id: string;
  kind: LinkToolKind | "standard";
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
  sourceRole?: string;
  targetRole?: string;
};

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
    sourceRole: findLabel('relationship-name'),
    targetRole: findLabel('target-role'),
  };
}

export function applyLinkDataToCell(cell: any, data: Partial<LinkData>) {
  // Verificación más estricta del objeto cell
  if (!cell || typeof cell !== 'object') {
    console.warn('applyLinkDataToCell: cell no es un objeto válido', cell);
    return;
  }

  // Verificar si el objeto está completamente inicializado
  if (!cell.isLink || !cell.isLink()) {
    console.warn('applyLinkDataToCell: cell no es un enlace de JointJS válido', cell);
    return;
  }
  
  // Asegurarnos de que el objeto tenga la propiedad 'markup' necesaria
  if (!cell.markup && cell.initializeMarkup) {
    try {
      cell.initializeMarkup();
    } catch (e) {
      console.error('Error al inicializar el markup del enlace:', e);
      return;
    }
  }

  // Usar requestAnimationFrame para asegurar que el DOM esté listo
  requestAnimationFrame(() => {
    try {
      // Obtener los labels existentes o crear un array vacío
      const existingLabels = (cell.get('labels') || []) as Array<{id?: string, attrs?: any}>;
      const labelsMap = new Map<string, any>();
      
      // Mapear los labels existentes por su ID para actualizarlos
      existingLabels.forEach(label => {
        if (label.id) {
          labelsMap.set(label.id, label);
        }
      });

      // Función para actualizar o crear un label
      const updateOrCreateLabel = (id: string, text: string | undefined, position: any, fontSize: number = 10) => {
        if (text === undefined) return;
        
        const baseLabel = labelsMap.get(id) || { id, attrs: {} };
        
        labelsMap.set(id, {
          ...baseLabel,
          position,
          attrs: {
            ...baseLabel.attrs,
            text: {
              ...baseLabel.attrs?.text,
              text,
              fontSize,
              fill: '#000',
            },
          },
        });
      };

      // Actualizar o crear cada label según corresponda
      updateOrCreateLabel('relationship-name', data.sourceRole, 0.5, 12); // Nombre de la relación
      updateOrCreateLabel('source-multiplicity', data.sourceMultiplicity, { distance: 0.1, offset: -10 });
      updateOrCreateLabel('target-multiplicity', data.targetMultiplicity, { distance: 0.9, offset: -10 });
      
      // Convertir el mapa de vuelta a un array
      const newLabels = Array.from(labelsMap.values());

      // Actualizar el tipo de enlace si es necesario
      if (data.kind) {
        cell.set('type', `link.${data.kind}`);
      }

      // Aplicar los labels al modelo solo si hay algo que actualizar
      if (newLabels.length > 0) {
        try {
          // Usar el método prop() en lugar de set() si está disponible
          if (cell.prop) {
            cell.prop('labels', newLabels);
          } else if (cell.set) {
            cell.set('labels', newLabels);
          } else {
            console.warn('applyLinkDataToCell: cell no tiene métodos set ni prop', cell);
          }
          
          // Forzar una actualización del renderizado
          if (cell.trigger) {
            cell.trigger('change:labels');
          }
        } catch (error) {
          console.error('Error al actualizar los labels:', error);
        }
      }
      
    } catch (error) {
      console.error('Error en applyLinkDataToCell:', error, { cell, data });
    }
  });
}

function autoResizeUmlCell(cell: any) {
  if (!cell?.get) return;
  const type = cell.get("type");
  const isUml = typeof type === "string" && type.startsWith("uml.");
  if (isUml) {
    const name: string = cell.get("name") || "";
    const attributes: string[] = cell.get("attributes") || [];
    const methods: string[] = cell.get("methods") || [];

    const lineHeight = 22; // Aumentado de 18 a 22
    const headerHeight = 32; // Aumentado de 26 a 32
    const sectionGap = 10; // Aumentado de 8 a 10
    const paddingV = 24; // Aumentado de 20 a 24

    let height = paddingV + headerHeight;
    if (attributes.length > 0) height += sectionGap + attributes.length * lineHeight;
    if (methods.length > 0) height += sectionGap + methods.length * lineHeight;
    height += paddingV;

    const longest = Math.max(
      name.length,
      ...attributes.map((s) => s.length),
      ...methods.map((s) => s.length)
    );
    const width = Math.max(180, Math.min(600, estimateTextWidthPx("X".repeat(longest)))); // Aumentado mínimo de 160 a 180

    try {
      cell.resize(width, height);
    } catch {}
  } else {
    // Fallback: standard rectangle width based on label
    const label = cell.attr?.("label/text") || "";
    const width = Math.max(140, Math.min(500, estimateTextWidthPx(String(label)))); // Aumentado mínimo de 120 a 140
    try {
      cell.resize(width, 70); // Aumentado altura de 60 a 70
    } catch {}
  }
}

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
          z: 10, // Asegurar que esté por encima de los links
        });
        // Aplicar estilos mejorados con mejor contraste y legibilidad
        el.attr({
          '.uml-class-name-rect': { 
            fill: '#ffffff', 
            stroke: '#000000', 
            strokeWidth: 2,
            rx: 2,
            ry: 2
          },
          '.uml-class-attributes-rect': { 
            fill: '#f8f9fa', 
            stroke: '#000000', 
            strokeWidth: 1,
            rx: 1,
            ry: 1
          },
          '.uml-class-methods-rect': { 
            fill: '#f8f9fa', 
            stroke: '#000000', 
            strokeWidth: 1,
            rx: 1,
            ry: 1
          },
          '.uml-class-name-text': { 
            fill: '#000000', 
            fontSize: 15, 
            fontFamily: 'Arial, sans-serif', 
            fontWeight: 'bold',
            textAnchor: 'middle'
          },
          '.uml-class-attributes-text': { 
            fill: '#000000', 
            fontSize: 13, 
            fontFamily: 'Arial, sans-serif',
            textAnchor: 'start'
          },
          '.uml-class-methods-text': { 
            fill: '#000000', 
            fontSize: 13, 
            fontFamily: 'Arial, sans-serif',
            textAnchor: 'start'
          }
        });
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
          z: 10, // Asegurar que esté por encima de los links
        });
        // Aplicar estilos mejorados para interfaces con indicador visual distintivo
        el.attr({
          '.uml-interface-name-rect': { 
            fill: '#ffffff', 
            stroke: '#000000', 
            strokeWidth: 2,
            rx: 2,
            ry: 2,
            strokeDasharray: '5,5' // Línea punteada para indicar interfaz
          },
          '.uml-interface-attributes-rect': { 
            fill: '#f0f8ff', 
            stroke: '#000000', 
            strokeWidth: 1,
            rx: 1,
            ry: 1
          },
          '.uml-interface-methods-rect': { 
            fill: '#f0f8ff', 
            stroke: '#000000', 
            strokeWidth: 1,
            rx: 1,
            ry: 1
          },
          '.uml-interface-name-text': { 
            fill: '#000000', 
            fontSize: 15, 
            fontFamily: 'Arial, sans-serif', 
            fontWeight: 'bold',
            textAnchor: 'middle'
          },
          '.uml-interface-attributes-text': { 
            fill: '#000000', 
            fontSize: 13, 
            fontFamily: 'Arial, sans-serif',
            textAnchor: 'start'
          },
          '.uml-interface-methods-text': { 
            fill: '#000000', 
            fontSize: 13, 
            fontFamily: 'Arial, sans-serif',
            textAnchor: 'start'
          }
        });
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
          z: 10, // Asegurar que esté por encima de los links
        });
        // Aplicar estilos mejorados para clases abstractas con indicador visual distintivo
        el.attr({
          '.uml-abstract-name-rect': { 
            fill: '#fff8dc', 
            stroke: '#000000', 
            strokeWidth: 2,
            rx: 2,
            ry: 2
          },
          '.uml-abstract-attributes-rect': { 
            fill: '#f5f5dc', 
            stroke: '#000000', 
            strokeWidth: 1,
            rx: 1,
            ry: 1
          },
          '.uml-abstract-methods-rect': { 
            fill: '#f5f5dc', 
            stroke: '#000000', 
            strokeWidth: 1,
            rx: 1,
            ry: 1
          },
          '.uml-abstract-name-text': { 
            fill: '#000000', 
            fontSize: 15, 
            fontFamily: 'Arial, sans-serif', 
            fontWeight: 'bold',
            textAnchor: 'middle',
            fontStyle: 'italic' // Texto en cursiva para indicar abstracta
          },
          '.uml-abstract-attributes-text': { 
            fill: '#000000', 
            fontSize: 13, 
            fontFamily: 'Arial, sans-serif',
            textAnchor: 'start'
          },
          '.uml-abstract-methods-text': { 
            fill: '#000000', 
            fontSize: 13, 
            fontFamily: 'Arial, sans-serif',
            textAnchor: 'start'
          }
        });
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
          z: 10, // Asegurar que esté por encima de los links
        });
        // Aplicar estilos para enumeraciones
        el.attr({
          '.uml-class-name-rect': { 
            fill: '#e8f5e8', 
            stroke: '#000000', 
            strokeWidth: 2,
            rx: 2,
            ry: 2
          },
          '.uml-class-attributes-rect': { 
            fill: '#f0f8f0', 
            stroke: '#000000', 
            strokeWidth: 1,
            rx: 1,
            ry: 1
          },
          '.uml-class-methods-rect': { 
            fill: '#f0f8f0', 
            stroke: '#000000', 
            strokeWidth: 1,
            rx: 1,
            ry: 1
          },
          '.uml-class-name-text': { 
            fill: '#000000', 
            fontSize: 15, 
            fontFamily: 'Arial, sans-serif', 
            fontWeight: 'bold',
            textAnchor: 'middle'
          },
          '.uml-class-attributes-text': { 
            fill: '#000000', 
            fontSize: 13, 
            fontFamily: 'Arial, sans-serif',
            textAnchor: 'start'
          },
          '.uml-class-methods-text': { 
            fill: '#000000', 
            fontSize: 13, 
            fontFamily: 'Arial, sans-serif',
            textAnchor: 'start'
          }
        });
        el.addTo(graph);
        autoResizeUmlCell(el);
        return;
      }
      if (kind === "uml-package") {
        // Crear un paquete usando un rectángulo con etiqueta
        const rect = new (joint.shapes as any).standard.Rectangle();
        rect.position(x - 90, y - 35);
        rect.resize(180, 70);
        rect.set('z', 10); // Asegurar que esté por encima de los links
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
            fontSize: 15, 
            fontFamily: "Arial, sans-serif", 
            fontWeight: "bold",
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
    rect.set('z', 10); // Asegurar que esté por encima de los links
    rect.attr({ 
      body: { fill: "#ffffff", stroke: "#000000", strokeWidth: 2 }, 
      label: { text: kind.replace("uml-", ""), fill: "#000000", fontSize: 14, fontFamily: "Arial, sans-serif", fontWeight: "bold" } 
    });
    rect.addTo(graph);
    autoResizeUmlCell(rect);
  } catch (e) {
    console.error("createUmlNode error", e);
  }
}

export function createUmlLink(
  kind: LinkToolKind,
  graph: joint.dia.Graph,
  sourceId: string,
  targetId: string
) {
  if (sourceId === targetId) return;
  const umlNs: any = (joint.shapes as any).uml;
  try {
    let link: any;
    
      // Configuración mejorada para todas las conexiones
      const defaultLinkOptions: any = {
        // Asegurar que la conexión se dibuje por debajo de los nodos
        z: 1,
        // Ajustar el punto de conexión para que no se superponga con el borde del nodo
        connector: { 
          name: 'rounded',
          args: {
            radius: 10
          }
        },
        router: { 
          name: 'manhattan',
          args: {
            padding: 20,
            step: 20,
            startDirection: 'right',
            endDirection: 'left',
            excludeEnds: ['top', 'bottom'],
            excludeStart: ['top', 'bottom']
          }
        },
        // Configuración mejorada de etiquetas
        defaultLabel: {
          markup: [
            { tagName: 'rect', selector: 'body' },
            { tagName: 'text', selector: 'label' }
          ],
          attrs: {
            text: {
              text: '',
              'font-size': 14,
              'text-anchor': 'middle',
              'y-alignment': 'middle',
              'fill': '#2c3e50',
              'font-family': 'Arial, sans-serif',
              'font-weight': 'bold'
            },
            rect: {
              fill: '#ffffff',
              'fill-opacity': 0.98,
              stroke: '#2c3e50',
              'stroke-width': 1.5,
              'ref-width': 1.3,
              'ref-height': 1.5,
              'ref-x': 0,
              'ref-y': -12,
              'x-alignment': 'middle',
              'y-alignment': 'middle',
              rx: 4,
              ry: 4
            }
          },
          position: {
            distance: 0.5,
            args: {
              keepGradient: true,
              ensureLegibility: true
            }
          }
        },
        // Configuración de puntos de conexión
        connectionPoint: {
          name: 'boundary',
          args: {
            sticky: true,
            offset: 8,
            priority: ['right', 'left', 'top', 'bottom']
          }
        },
        // Configuración adicional para evitar superposición
        connectionStrategy: {
          name: 'boundary',
          args: {
            offset: 8,
            padding: 8
          }
        }
      };
    
    if (umlNs) {
      const baseOptions = {
        source: { id: sourceId },
        target: { id: targetId },
        ...defaultLinkOptions
      };
      
      if (kind === "assoc") {
        link = new umlNs.Association(baseOptions);
      } else if (kind === "aggregation") {
        link = new umlNs.Aggregation(baseOptions);
      } else if (kind === "composition") {
        link = new umlNs.Composition(baseOptions);
      } else if (kind === "dependency") {
        // JointJS UML has Dependency in some builds; if not, fallback below
        if (umlNs.Dependency) {
          link = new umlNs.Dependency(baseOptions);
        }
      } else if (kind === "generalization") {
        link = new umlNs.Generalization(baseOptions);
      }
    }
    if (!link) {
      // Estilos mejorados para relaciones UML con marcadores más claros
      const base: any = {
        stroke: "#2c3e50",
        'stroke-width': 2.5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      };
      
      // Marcadores mejorados para cada tipo de relación
      let targetMarker: any = { 
        type: "path", 
        d: "M 12 -6 0 0 12 6 z", 
        fill: "#2c3e50",
        'stroke': 'none',
        'stroke-width': 0
      };
      
      let sourceMarker: any | undefined;
      let strokeDasharray: string | undefined;
      
      if (kind === "generalization") {
        // Flecha hueca para herencia
        targetMarker = { 
          type: "path", 
          d: "M 20 0 L 0 10 L 20 20 z", 
          fill: "#ffffff", 
          stroke: "#2c3e50", 
          'stroke-width': 2.5 
        };
      } else if (kind === "aggregation") {
        // Diamante hueco para agregación
        sourceMarker = { 
          type: "path", 
          d: "M 20 0 L 10 10 L 0 0 L 10 -10 z", 
          fill: "#ffffff", 
          stroke: "#2c3e50", 
          'stroke-width': 2.5 
        };
        targetMarker = { 
          type: "path", 
          d: "M 12 -6 0 0 12 6 z", 
          fill: "#2c3e50",
          'stroke': 'none'
        };
      } else if (kind === "composition") {
        // Diamante relleno para composición
        sourceMarker = { 
          type: "path", 
          d: "M 20 0 L 10 10 L 0 0 L 10 -10 z", 
          fill: "#2c3e50", 
          stroke: "#2c3e50", 
          'stroke-width': 2.5 
        };
        targetMarker = { 
          type: "path", 
          d: "M 12 -6 0 0 12 6 z", 
          fill: "#2c3e50",
          'stroke': 'none'
        };
      } else if (kind === "dependency") {
        // Línea punteada con flecha abierta
        strokeDasharray = "8,4";
        targetMarker = { 
          type: "path", 
          d: "M 12 -6 0 0 12 6 z", 
          fill: "#2c3e50",
          'stroke': 'none'
        };
      } else if (kind === "assoc") {
        // Asociación simple con flecha
        targetMarker = { 
          type: "path", 
          d: "M 12 -6 0 0 12 6 z", 
          fill: "#2c3e50",
          'stroke': 'none'
        };
      }

      // Crear el enlace con las opciones base y los estilos personalizados
      link = new joint.dia.Link({
        ...defaultLinkOptions,
        source: { id: sourceId },
        target: { id: targetId },
        // Configurar puntos de conexión específicos
        sourcePoint: { x: 0, y: 0 },
        targetPoint: { x: 0, y: 0 },
        attrs: {
          line: {
            ...base,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            targetMarker,
            sourceMarker,
            strokeDasharray,
          },
        },
        // Asegurar que el link esté por debajo de los elementos
        z: 1,
        // Configuración adicional para evitar superposiciones
        smooth: true,
        // Aplicar router personalizado para evitar superposiciones
        router: {
          name: 'manhattan',
          args: {
            padding: 15,
            step: 15,
            startDirection: 'right',
            endDirection: 'left',
            excludeEnds: ['top', 'bottom'],
            excludeStart: ['top', 'bottom'],
            // Configuración para evitar superposiciones
            maxAllowedDirectionChange: 90,
            maximumLoops: 2
          }
        },
        // Asegurar que el link sea seleccionable
        selectable: true,
        interactive: true
      });
    }
    link.addTo(graph);
    return link; // Retornar el enlace creado
  } catch (e) {
    console.error("createUmlLink error", e);
    return null;
  }
}

export type BasicClassData = {
  id: string;
  kind: "uml-class" | "uml-interface" | "uml-abstract" | "uml-enum" | "uml-package" | "standard";
  name?: string;
  attributes?: string[];
  methods?: string[];
};

export function getClassDataFromCell(cell: any): BasicClassData | null {
  if (!cell) return null;
  const type = cell.get?.("type");
  const id = cell.id as string;
  if (!id) return null;
  if (typeof type === "string" && type.startsWith("uml.")) {
    let kind: BasicClassData["kind"] = "uml-class";
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

export function applyClassDataToCell(cell: any, data: Partial<BasicClassData>) {
  if (!cell || !data) return;
  const type = cell.get?.("type");
  const isUml = typeof type === "string" && type.startsWith("uml.");
  if (isUml) {
    if (data.name !== undefined) cell.set("name", data.name);
    if (data.attributes !== undefined) cell.set("attributes", data.attributes);
    if (data.methods !== undefined) cell.set("methods", data.methods);
    
    // Aplicar estilos en blanco y negro con letras más grandes
    const typePrefix = type.replace("uml.", "");
    cell.attr({
      [`.uml-${typePrefix}-name-rect`]: { fill: '#ffffff', stroke: '#000000', strokeWidth: 2 },
      [`.uml-${typePrefix}-attributes-rect`]: { fill: '#ffffff', stroke: '#000000', strokeWidth: 1 },
      [`.uml-${typePrefix}-methods-rect`]: { fill: '#ffffff', stroke: '#000000', strokeWidth: 1 },
      [`.uml-${typePrefix}-name-text`]: { fill: '#000000', fontSize: 14, fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },
      [`.uml-${typePrefix}-attributes-text`]: { fill: '#000000', fontSize: 12, fontFamily: 'Arial, sans-serif' },
      [`.uml-${typePrefix}-methods-text`]: { fill: '#000000', fontSize: 12, fontFamily: 'Arial, sans-serif' }
    });
    
    // Auto-resize after applying updates
    autoResizeUmlCell(cell);
  } else {
    if (data.name !== undefined) {
      cell.attr("label/text", data.name);
      cell.attr("label/fill", "#000000");
      cell.attr("label/fontSize", 14);
      cell.attr("label/fontFamily", "Arial, sans-serif");
      cell.attr("label/fontWeight", "bold");
    }
    cell.attr("body/fill", "#ffffff");
    cell.attr("body/stroke", "#000000");
    cell.attr("body/strokeWidth", 2);
    autoResizeUmlCell(cell);
  }
}
