// uml-webapp/lib/umlDimensions.ts
// Funciones para calcular dimensiones y tamaños de elementos UML

/**
 * Calcula el ancho estimado del texto considerando la fuente Inter
 */
export function estimateTextWidthPx(text: string): number {
  const avgCharWidth = 9.5; // Inter es más ancha que Arial
  const minWidth = 40;
  const maxWidth = 400;
  
  // Calcular ancho basado en caracteres + padding adicional
  const estimatedWidth = text.length * avgCharWidth + 60;
  
  return Math.max(minWidth, Math.min(maxWidth, estimatedWidth));
}

/**
 * Configuración de dimensiones para elementos UML
 */
export const UML_DIMENSIONS = {
  lineHeight: 24,
  headerHeight: 36,
  sectionGap: 12,
  paddingV: 28,
  paddingH: 20,
  minWidth: 200,
  maxWidth: 500,
  borderRadius: 4
} as const;

/**
 * Configuración de dimensiones para elementos estándar
 */
export const STANDARD_DIMENSIONS = {
  height: 80,
  minWidth: 160,
  maxWidth: 400,
  borderRadius: 4,
  padding: 40
} as const;

/**
 * Calcula las dimensiones óptimas para una celda UML
 */
export function calculateUmlCellDimensions(
  name: string,
  attributes: string[],
  methods: string[]
): { width: number; height: number } {
  const { lineHeight, headerHeight, sectionGap, paddingV, paddingH, minWidth, maxWidth } = UML_DIMENSIONS;

  // Calcular altura
  let height = paddingV + headerHeight;
  if (attributes.length > 0) height += sectionGap + attributes.length * lineHeight;
  if (methods.length > 0) height += sectionGap + methods.length * lineHeight;
  height += paddingV;

  // Calcular ancho basado en el texto más largo
  const allTexts = [name, ...attributes, ...methods];
  const longestText = allTexts.reduce((longest, current) => 
    current.length > longest.length ? current : longest, "");
  
  const textWidth = estimateTextWidthPx(longestText);
  const width = Math.max(minWidth, Math.min(maxWidth, textWidth + paddingH * 2));

  return { width, height };
}

/**
 * Calcula las dimensiones para una celda estándar
 */
export function calculateStandardCellDimensions(label: string): { width: number; height: number } {
  const { height, minWidth, maxWidth, padding } = STANDARD_DIMENSIONS;
  
  const textWidth = estimateTextWidthPx(label);
  const width = Math.max(minWidth, Math.min(maxWidth, textWidth + padding));

  return { width, height };
}
