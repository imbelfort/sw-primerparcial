import * as joint from "jointjs";

export type NodeToolKind = "uml-class" | "uml-interface" | "uml-abstract";
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

    const lineHeight = 18;
    const headerHeight = 26;
    const sectionGap = 8;
    const paddingV = 20;

    let height = paddingV + headerHeight;
    if (attributes.length > 0) height += sectionGap + attributes.length * lineHeight;
    if (methods.length > 0) height += sectionGap + methods.length * lineHeight;
    height += paddingV;

    const longest = Math.max(
      name.length,
      ...attributes.map((s) => s.length),
      ...methods.map((s) => s.length)
    );
    const width = Math.max(160, Math.min(600, estimateTextWidthPx("X".repeat(longest))));

    try {
      cell.resize(width, height);
    } catch {}
  } else {
    // Fallback: standard rectangle width based on label
    const label = cell.attr?.("label/text") || "";
    const width = Math.max(120, Math.min(500, estimateTextWidthPx(String(label))));
    try {
      cell.resize(width, 60);
    } catch {}
  }
}

export function createUmlNode(kind: NodeToolKind, graph: joint.dia.Graph, x: number, y: number) {
  const umlNs: any = (joint.shapes as any).uml;
  try {
    if (umlNs) {
      if (kind === "uml-class") {
        const el = new umlNs.Class({
          position: { x: x - 80, y: y - 30 },
          size: { width: 160, height: 60 },
          name: "Class",
          attributes: [],
          methods: [],
        });
        el.addTo(graph);
        autoResizeUmlCell(el);
        return;
      }
      if (kind === "uml-interface") {
        const el = new umlNs.Interface({
          position: { x: x - 80, y: y - 30 },
          size: { width: 160, height: 60 },
          name: "Interface",
          attributes: [],
          methods: [],
        });
        el.addTo(graph);
        autoResizeUmlCell(el);
        return;
      }
      if (kind === "uml-abstract") {
        const el = new umlNs.Abstract({
          position: { x: x - 80, y: y - 30 },
          size: { width: 160, height: 60 },
          name: "AbstractClass",
          attributes: [],
          methods: [],
        });
        el.addTo(graph);
        autoResizeUmlCell(el);
        return;
      }
    }
    // Fallback rectangle
    const rect = new (joint.shapes as any).standard.Rectangle();
    rect.position(x - 80, y - 30);
    rect.resize(160, 60);
    rect.attr({ body: { fill: "#fff" }, label: { text: kind.replace("uml-", "") } });
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
    
    // Configuración común para todas las conexiones
    const defaultLinkOptions: any = {
      // Asegurar que la conexión se dibuje por encima de los nodos
      z: 10,
      // Ajustar el punto de conexión para que no se superponga con el borde del nodo
      connector: { name: 'rounded' },
      router: { name: 'manhattan' },
      // Ajustar la distancia de las etiquetas desde los nodos
      defaultLabel: {
        markup: [
          { tagName: 'rect', selector: 'body' },
          { tagName: 'text', selector: 'label' }
        ],
        attrs: {
          text: {
            text: '',
            'font-size': 12,
            'text-anchor': 'middle',
            'y-alignment': 'middle',
            'fill': '#000000'
          },
          rect: {
            fill: '#ffffff',
            'fill-opacity': 0.9,
            stroke: 'none',
            'stroke-width': 0,
            'ref-width': 1.2,
            'ref-height': 1.4,
            'ref-x': 0,
            'ref-y': -10,
            'x-alignment': 'middle',
            'y-alignment': 'middle',
            rx: 3,
            ry: 3
          }
        },
        position: {
          distance: 0.5, // Posición a lo largo de la línea (0-1)
          args: {
            keepGradient: true,
            ensureLegibility: true
          }
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
      // Fallback styles approximating UML notations
      const base: any = {
        stroke: "#111827",
        'stroke-width': 2
      };
      
      // Ajustar marcadores para que no se superpongan con los nodos
      let targetMarker: any = { 
        type: "path", 
        d: "M 10 -5 0 0 10 5 z", 
        fill: "#111827",
        'stroke': 'none',
        'stroke-width': 0
      };
      
      let sourceMarker: any | undefined;
      let strokeDasharray: string | undefined;
      if (kind === "generalization") {
        targetMarker = { type: "path", d: "M 20 0 L 0 10 L 20 20 z", fill: "#fff", stroke: "#111827" };
      } else if (kind === "aggregation") {
        // hollow diamond at source
        sourceMarker = { type: "path", d: "M 20 0 L 10 10 L 0 0 L 10 -10 z", fill: "#fff", stroke: "#111827" };
      } else if (kind === "composition") {
        // filled diamond at source
        sourceMarker = { type: "path", d: "M 20 0 L 10 10 L 0 0 L 10 -10 z", fill: "#111827", stroke: "#111827" };
      } else if (kind === "dependency") {
        // dashed line with open arrow
        strokeDasharray = "5,5";
        targetMarker = { type: "path", d: "M 10 -5 0 0 10 5 z", fill: "#111827" };
      }

      // Crear el enlace con las opciones base y los estilos personalizados
      link = new joint.dia.Link({
        ...defaultLinkOptions,
        source: { id: sourceId },
        target: { id: targetId },
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
      });
    }
    link.addTo(graph);
  } catch (e) {
    console.error("createUmlLink error", e);
  }
}

export type BasicClassData = {
  id: string;
  kind: "uml-class" | "uml-interface" | "uml-abstract" | "standard";
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
    // Auto-resize after applying updates
    autoResizeUmlCell(cell);
  } else {
    if (data.name !== undefined) cell.attr("label/text", data.name);
    autoResizeUmlCell(cell);
  }
}
