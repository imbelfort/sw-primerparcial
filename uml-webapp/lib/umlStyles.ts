// uml-webapp/lib/umlStyles.ts
// Configuraciones de estilos para elementos UML

/**
 * Configuración de fuentes para elementos UML
 */
export const UML_FONTS = {
  family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  nameSize: 18,
  attributeSize: 16,
  methodSize: 16,
  nameWeight: '600',
  attributeWeight: '500',
  methodWeight: '500'
} as const;

/**
 * Configuración de colores para elementos UML
 */
export const UML_COLORS = {
  text: '#000000',
  background: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  border: '#000000',
  borderWidth: 2,
  borderWidthSecondary: 1
} as const;

/**
 * Genera los estilos para un elemento UML específico
 */
export function getUmlElementStyles(typePrefix: string) {
  return {
    [`.uml-${typePrefix}-name-rect`]: { 
      fill: UML_COLORS.background, 
      stroke: UML_COLORS.border, 
      strokeWidth: UML_COLORS.borderWidth,
      rx: 4,
      ry: 4
    },
    [`.uml-${typePrefix}-attributes-rect`]: { 
      fill: UML_COLORS.backgroundSecondary, 
      stroke: UML_COLORS.border, 
      strokeWidth: UML_COLORS.borderWidthSecondary,
      rx: 2,
      ry: 2
    },
    [`.uml-${typePrefix}-methods-rect`]: { 
      fill: UML_COLORS.backgroundSecondary, 
      stroke: UML_COLORS.border, 
      strokeWidth: UML_COLORS.borderWidthSecondary,
      rx: 2,
      ry: 2
    },
    [`.uml-${typePrefix}-name-text`]: { 
      fill: UML_COLORS.text, 
      fontSize: UML_FONTS.nameSize, 
      fontFamily: UML_FONTS.family, 
      fontWeight: UML_FONTS.nameWeight,
      textAnchor: 'middle'
    },
    [`.uml-${typePrefix}-attributes-text`]: { 
      fill: UML_COLORS.text, 
      fontSize: UML_FONTS.attributeSize, 
      fontFamily: UML_FONTS.family,
      fontWeight: UML_FONTS.attributeWeight,
      textAnchor: 'start'
    },
    [`.uml-${typePrefix}-methods-text`]: { 
      fill: UML_COLORS.text, 
      fontSize: UML_FONTS.methodSize, 
      fontFamily: UML_FONTS.family,
      fontWeight: UML_FONTS.methodWeight,
      textAnchor: 'start'
    }
  };
}

/**
 * Genera los estilos para un elemento estándar
 */
export function getStandardElementStyles() {
  return {
    body: { 
      fill: UML_COLORS.background, 
      stroke: UML_COLORS.border, 
      strokeWidth: UML_COLORS.borderWidth,
      rx: 4,
      ry: 4
    }, 
    label: { 
      fill: UML_COLORS.text, 
      fontSize: UML_FONTS.nameSize, 
      fontFamily: UML_FONTS.family, 
      fontWeight: UML_FONTS.nameWeight,
      textAnchor: 'middle'
    } 
  };
}

/**
 * Configuración de estilos específicos para cada tipo de elemento UML
 */
export const UML_ELEMENT_STYLES = {
  class: {
    nameRect: { fill: '#ffffff' },
    attributesRect: { fill: '#f8f9fa' },
    methodsRect: { fill: '#f8f9fa' }
  },
  interface: {
    nameRect: { fill: '#ffffff', strokeDasharray: '5,5' },
    attributesRect: { fill: '#f0f8ff' },
    methodsRect: { fill: '#f0f8ff' }
  },
  abstract: {
    nameRect: { fill: '#fff8dc' },
    attributesRect: { fill: '#f5f5dc' },
    methodsRect: { fill: '#f5f5dc' },
    nameText: { fontStyle: 'italic' }
  },
  enum: {
    nameRect: { fill: '#e8f5e8' },
    attributesRect: { fill: '#f0f8f0' },
    methodsRect: { fill: '#f0f8f0' }
  }
} as const;
