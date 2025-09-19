import * as joint from "jointjs";

type LabelPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface LabelOptions {
  text: string;
  position?: LabelPosition;
  fontSize?: number;
  fill?: string;
  offset?: { x?: number; y?: number };
}

/**
 * Crea un label válido para JointJS
 */
export function createLabel(options: LabelOptions): joint.dia.Link.Label {
  const { text, position = 'center', fontSize = 12, fill = '#000', offset = {} } = options;

  let pos = 0.5;
  switch (position) {
    case 'top': pos = 0.1; break;
    case 'bottom': pos = 0.9; break;
    case 'left': pos = 0.25; break;
    case 'right': pos = 0.75; break;
  }

  return {
    position: pos,
    attrs: {
      text: {
        text,
        fill,
        'font-size': fontSize,
        'font-family': 'sans-serif',
        'ref-x': offset.x || 0,
        'ref-y': offset.y || 0,
        'text-anchor': 'middle',
        'y-alignment': 'middle',
      },
    },
  };
}

/**
 * Añade un label a un elemento o link
 */
export function addLabelToCell(cell: joint.dia.Cell, options: LabelOptions) {
  const newLabel = createLabel(options);
  
  if (cell instanceof joint.dia.Link) {
    const labels = cell.labels() || [];
    cell.labels([...labels, newLabel]);
  } else {
    const labels = (cell as any).getLabels?.() || [];
    (cell as any).setLabels?.([...labels, newLabel]);
  }
}

/**
 * Actualiza un label existente
 */
export function updateCellLabel(cell: joint.dia.Cell, index: number, options: Partial<LabelOptions>) {
  // Helper function to get safe label options
  const getSafeLabelOptions = (currentAttrs: any, newOptions: Partial<LabelOptions>): LabelOptions => {
    // Start with default values
    const safeOptions: LabelOptions = {
      text: '',
      ...currentAttrs,
      ...newOptions
    };
    
    // Ensure text is always a string
    safeOptions.text = safeOptions.text || '';
    
    // Ensure fill is a string if it exists
    if (safeOptions.fill && typeof safeOptions.fill !== 'string') {
      // If fill is an object (SVGPatternJSON or SVGGradientJSON), convert it to a string if possible
      // or remove it to fall back to default
      delete safeOptions.fill;
    }
    
    return safeOptions;
  };

  if (cell instanceof joint.dia.Link) {
    const labels = cell.labels() || [];
    if (index < 0 || index >= labels.length) return;
    const currentAttrs = labels[index].attrs?.text || {};
    const updatedLabel = createLabel(getSafeLabelOptions(currentAttrs, options));
    labels[index] = { ...labels[index], attrs: updatedLabel.attrs, position: updatedLabel.position };
    cell.labels(labels);
  } else {
    const labels = (cell as any).getLabels?.() || [];
    if (index < 0 || index >= labels.length) return;
    const currentAttrs = labels[index].attrs?.text || {};
    const updatedLabel = createLabel(getSafeLabelOptions(currentAttrs, options));
    labels[index] = { ...labels[index], attrs: updatedLabel.attrs, position: updatedLabel.position };
    (cell as any).setLabels?.(labels);
  }
}

/**
 * Elimina un label de un elemento o link
 */
export function removeCellLabel(cell: joint.dia.Cell, index: number) {
  if (cell instanceof joint.dia.Link) {
    const labels = cell.labels() || [];
    if (index < 0 || index >= labels.length) return;
    labels.splice(index, 1);
    cell.labels(labels);
  } else {
    const labels = (cell as any).getLabels?.() || [];
    if (index < 0 || index >= labels.length) return;
    labels.splice(index, 1);
    (cell as any).setLabels?.(labels);
  }
}
