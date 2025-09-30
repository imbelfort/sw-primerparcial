import * as joint from 'jointjs';

export interface CanvasElement {
  id: string;
  name: string;
  type: 'class' | 'interface' | 'abstract' | 'enum' | 'package' | 'unknown';
  attributes: string[];
  methods: string[];
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface CanvasRelationship {
  id: string;
  type: 'association' | 'generalization' | 'composition' | 'aggregation' | 'dependency';
  source: string;
  target: string;
  label?: string;
  multiplicity?: string;
  sourceMultiplicity?: string;
  sourceRole?: string;
  targetRole?: string;
}

export interface CanvasAnalysis {
  elements: CanvasElement[];
  relationships: CanvasRelationship[];
  summary: {
    totalElements: number;
    totalRelationships: number;
    elementTypes: Record<string, number>;
    relationshipTypes: Record<string, number>;
  };
}

export class CanvasAnalysisService {
  static analyzeCanvas(paper: joint.dia.Paper | null): CanvasAnalysis {
    if (!paper) {
      return {
        elements: [],
        relationships: [],
        summary: {
          totalElements: 0,
          totalRelationships: 0,
          elementTypes: {},
          relationshipTypes: {}
        }
      };
    }

    const graph = paper.model;
    const cells = graph.getCells();
    
    const elements: CanvasElement[] = [];
    const relationships: CanvasRelationship[] = [];
    const elementTypes: Record<string, number> = {};
    const relationshipTypes: Record<string, number> = {};

    cells.forEach(cell => {
      if (cell.isElement && cell.isElement()) {
        // Es un elemento (clase, interfaz, etc.)
        const element = this.analyzeElement(cell);
        if (element) {
          elements.push(element);
          elementTypes[element.type] = (elementTypes[element.type] || 0) + 1;
        }
      } else if (cell.isLink && cell.isLink()) {
        // Es una relación
        const relationship = this.analyzeRelationship(cell);
        if (relationship) {
          relationships.push(relationship);
          relationshipTypes[relationship.type] = (relationshipTypes[relationship.type] || 0) + 1;
        }
      }
    });

    return {
      elements,
      relationships,
      summary: {
        totalElements: elements.length,
        totalRelationships: relationships.length,
        elementTypes,
        relationshipTypes
      }
    };
  }

  private static analyzeElement(cell: joint.dia.Cell): CanvasElement | null {
    try {
      const position = cell.position();
      const bbox = cell.getBBox();
      const type = cell.get('type') || '';
      
      // Determinar el tipo de elemento
      let elementType: CanvasElement['type'] = 'unknown';
      if (type.includes('uml.Class')) elementType = 'class';
      else if (type.includes('uml.Interface')) elementType = 'interface';
      else if (type.includes('uml.Abstract')) elementType = 'abstract';
      else if (type.includes('uml.Enum')) elementType = 'enum';
      else if (type.includes('uml.Package')) elementType = 'package';

      // Obtener nombre, atributos y métodos
      const name = cell.get('name') || 'Sin nombre';
      const attributes = cell.get('attributes') || [];
      const methods = cell.get('methods') || [];

      return {
        id: cell.id.toString(),
        name,
        type: elementType,
        attributes: Array.isArray(attributes) ? attributes : [],
        methods: Array.isArray(methods) ? methods : [],
        position: { x: position.x, y: position.y },
        size: { width: bbox.width, height: bbox.height }
      };
    } catch (error) {
      console.warn('Error al analizar elemento:', error);
      return null;
    }
  }

  private static analyzeRelationship(cell: joint.dia.Cell): CanvasRelationship | null {
    try {
      const type = cell.get('type') || '';
      const source = cell.getSourceCell();
      const target = cell.getTargetCell();
      
      if (!source || !target) return null;

      // Determinar el tipo de relación
      let relationshipType: CanvasRelationship['type'] = 'association';
      if (type.includes('generalization')) relationshipType = 'generalization';
      else if (type.includes('composition')) relationshipType = 'composition';
      else if (type.includes('aggregation')) relationshipType = 'aggregation';
      else if (type.includes('dependency')) relationshipType = 'dependency';

      // Obtener etiquetas y multiplicidades
      const labels = cell.get('labels') || [];
      let label: string | undefined;
      let multiplicity: string | undefined;
      let sourceMultiplicity: string | undefined;
      let sourceRole: string | undefined;
      let targetRole: string | undefined;

      if (Array.isArray(labels)) {
        labels.forEach((l: any) => {
          if (l.attrs?.text?.text) {
            const text = l.attrs.text.text;
            const position = l.position || 0;
            
            if (position === 0.5) {
              // Etiqueta central
              label = text;
            } else if (position === 0.1) {
              // Multiplicidad del origen
              sourceMultiplicity = text;
            } else if (position === 0.9) {
              // Multiplicidad del destino
              multiplicity = text;
            } else if (position === 0.2) {
              // Rol del origen
              sourceRole = text;
            } else if (position === 0.8) {
              // Rol del destino
              targetRole = text;
            }
          }
        });
      }

      return {
        id: cell.id.toString(),
        type: relationshipType,
        source: source.id.toString(),
        target: target.id.toString(),
        label,
        multiplicity,
        sourceMultiplicity,
        sourceRole,
        targetRole
      };
    } catch (error) {
      console.warn('Error al analizar relación:', error);
      return null;
    }
  }

  static generateAnalysisPrompt(analysis: CanvasAnalysis): string {
    if (analysis.elements.length === 0) {
      return "El lienzo está vacío. ¿Te gustaría que te sugiera un diagrama completo para empezar?";
    }

    let prompt = `Analiza el siguiente diagrama UML y sugiere mejoras, elementos faltantes o relaciones adicionales:\n\n`;

    // Resumen del diagrama
    prompt += `**Resumen del diagrama actual:**\n`;
    prompt += `- Total de elementos: ${analysis.summary.totalElements}\n`;
    prompt += `- Total de relaciones: ${analysis.summary.totalRelationships}\n`;
    prompt += `- Tipos de elementos: ${Object.entries(analysis.summary.elementTypes).map(([type, count]) => `${type} (${count})`).join(', ')}\n`;
    prompt += `- Tipos de relaciones: ${Object.entries(analysis.summary.relationshipTypes).map(([type, count]) => `${type} (${count})`).join(', ')}\n\n`;

    // Elementos existentes
    prompt += `**Elementos existentes:**\n`;
    analysis.elements.forEach(element => {
      prompt += `- ${element.name} (${element.type})`;
      if (element.attributes.length > 0) {
        prompt += `\n  Atributos: ${element.attributes.slice(0, 3).join(', ')}${element.attributes.length > 3 ? '...' : ''}`;
      }
      if (element.methods.length > 0) {
        prompt += `\n  Métodos: ${element.methods.slice(0, 3).join(', ')}${element.methods.length > 3 ? '...' : ''}`;
      }
      prompt += `\n`;
    });

    // Relaciones existentes
    if (analysis.relationships.length > 0) {
      prompt += `\n**Relaciones existentes:**\n`;
      analysis.relationships.forEach(rel => {
        const sourceElement = analysis.elements.find(e => e.id === rel.source);
        const targetElement = analysis.elements.find(e => e.id === rel.target);
        prompt += `- ${sourceElement?.name || 'Elemento'} --[${rel.type}]--> ${targetElement?.name || 'Elemento'}`;
        if (rel.label) prompt += ` (${rel.label})`;
        if (rel.multiplicity || rel.sourceMultiplicity) {
          prompt += ` [${rel.sourceMultiplicity || '1'}..${rel.multiplicity || '1'}]`;
        }
        prompt += `\n`;
      });
    }

    prompt += `\n**Por favor, sugiere:**\n`;
    prompt += `1. Elementos faltantes que podrían completar el modelo\n`;
    prompt += `2. Atributos o métodos adicionales para los elementos existentes\n`;
    prompt += `3. Relaciones que podrían mejorar la coherencia del diagrama\n`;
    prompt += `4. Mejoras en el diseño o estructura del modelo\n`;
    prompt += `5. Patrones de diseño que podrían aplicarse\n\n`;
    prompt += `Responde con sugerencias específicas y prácticas que se puedan implementar directamente en el diagrama.`;

    return prompt;
  }

  static generateQuickSuggestions(analysis: CanvasAnalysis): string[] {
    const suggestions: string[] = [];

    if (analysis.elements.length === 0) {
      suggestions.push("Crear un sistema básico con clases principales");
      suggestions.push("Diseñar un sistema de gestión con entidades principales");
      suggestions.push("Modelar un sistema de e-commerce con productos y usuarios");
    } else if (analysis.elements.length < 3) {
      suggestions.push("Agregar clases de servicio o controlador");
      suggestions.push("Incluir interfaces para desacoplar componentes");
      suggestions.push("Añadir clases de excepción o validación");
    } else {
      // Análisis más específico basado en el contenido
      const hasClasses = analysis.summary.elementTypes.class > 0;
      const hasInterfaces = analysis.summary.elementTypes.interface > 0;
      const hasRelationships = analysis.relationships.length > 0;

      if (!hasInterfaces) {
        suggestions.push("Agregar interfaces para mejorar la flexibilidad");
      }

      if (!hasRelationships) {
        suggestions.push("Definir relaciones entre las clases existentes");
      }

      if (analysis.summary.relationshipTypes.generalization === 0) {
        suggestions.push("Considerar herencia entre clases relacionadas");
      }

      if (analysis.summary.relationshipTypes.composition === 0 && analysis.summary.relationshipTypes.aggregation === 0) {
        suggestions.push("Agregar relaciones de composición o agregación");
      }

      // Sugerencias específicas basadas en nombres de clases
      const classNames = analysis.elements.map(e => e.name.toLowerCase());
      
      if (classNames.some(name => name.includes('user') || name.includes('usuario'))) {
        suggestions.push("Agregar sistema de autenticación y roles");
        suggestions.push("Incluir clases de perfil y preferencias");
      }

      if (classNames.some(name => name.includes('product') || name.includes('producto'))) {
        suggestions.push("Agregar sistema de categorías y inventario");
        suggestions.push("Incluir clases de pedido y carrito de compras");
      }

      if (classNames.some(name => name.includes('order') || name.includes('pedido'))) {
        suggestions.push("Agregar sistema de pagos y envíos");
        suggestions.push("Incluir clases de facturación y tracking");
      }
    }

    return suggestions.slice(0, 5); // Máximo 5 sugerencias
  }
}

