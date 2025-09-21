// Tipos para elementos del diagrama
export interface DiagramElementData {
  id: string;
  type: 'class' | 'interface' | 'enum' | 'note' | string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  attributes?: string[];
  methods?: string[];
  metadata?: Record<string, any>;
}

export interface DiagramLinkData {
  id: string;
  source: string;
  target: string;
  type: 'association' | 'inheritance' | 'implementation' | 'dependency' | string;
  label?: string;
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
  metadata?: Record<string, any>;
}

export interface DiagramViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

// Tipos para eventos
export type DiagramEvent =
  | { type: 'element:select'; elementId: string }
  | { type: 'element:add'; element: Omit<DiagramElementData, 'id'> }
  | { type: 'element:update'; elementId: string; updates: Partial<DiagramElementData> }
  | { type: 'element:delete'; elementId: string }
  | { type: 'link:add'; link: Omit<DiagramLinkData, 'id'> }
  | { type: 'link:delete'; linkId: string }
  | { type: 'viewport:change'; viewport: Partial<DiagramViewport> };

// Tipos para el estado del diagrama
export interface DiagramState {
  elements: DiagramElementData[];
  links: DiagramLinkData[];
  selectedElementId: string | null;
  viewport: DiagramViewport;
  isLoading: boolean;
  error: string | null;
}
