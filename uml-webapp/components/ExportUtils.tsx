import * as joint from 'jointjs';
import jsPDF from 'jspdf';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'pdf' | 'png') => void;
}

export function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Exportar Diagrama</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">Selecciona el formato de exportación:</p>
        
        <div className="space-y-3">
          <button
            onClick={() => onExport('png')}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Exportar como PNG
          </button>
          
          <button
            onClick={() => onExport('pdf')}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Exportar como PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export const exportCanvas = (paper: joint.dia.Paper | null, format: 'pdf' | 'png') => {
  if (!paper) return;
  
  try {
    // Obtener el área completa del diagrama
    const graph = (paper as any).model;
    const bbox = graph.getBBox();
    
    if (!bbox) {
      alert('No hay elementos en el diagrama para exportar');
      return;
    }
    
    // Agregar margen alrededor del diagrama
    const margin = 50;
    const exportBBox = {
      x: bbox.x - margin,
      y: bbox.y - margin,
      width: bbox.width + (margin * 2),
      height: bbox.height + (margin * 2)
    };
    
    // Crear un canvas temporal para la captura
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      alert('No se puede crear el contexto del canvas');
      return;
    }
    
    // Configurar canvas con alta resolución
    const scaleFactor = 2; // Factor de escala para mayor resolución
    canvas.width = exportBBox.width * scaleFactor;
    canvas.height = exportBBox.height * scaleFactor;
    
    // Configurar contexto para mejor calidad
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Fondo blanco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Obtener el SVG del paper directamente
    const svg = paper.svg.cloneNode(true) as SVGElement;
    
    if (!svg) {
      alert('No se puede acceder al SVG del diagrama');
      return;
    }
    
    // Configurar el viewBox para incluir todo el diagrama
    svg.setAttribute('viewBox', `${exportBBox.x} ${exportBBox.y} ${exportBBox.width} ${exportBBox.height}`);
    svg.setAttribute('width', exportBBox.width.toString());
    svg.setAttribute('height', exportBBox.height.toString());
    
    // Asegurar que el fondo sea blanco
    svg.style.backgroundColor = 'white';
    
    // Crear un elemento rect de fondo blanco
    const backgroundRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    backgroundRect.setAttribute('x', exportBBox.x.toString());
    backgroundRect.setAttribute('y', exportBBox.y.toString());
    backgroundRect.setAttribute('width', exportBBox.width.toString());
    backgroundRect.setAttribute('height', exportBBox.height.toString());
    backgroundRect.setAttribute('fill', 'white');
    svg.insertBefore(backgroundRect, svg.firstChild);
    
    // Mejorar la calidad del texto
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      text {
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 16px;
        fill: #333;
        text-rendering: geometricPrecision;
        font-weight: 500;
      }
    `;
    svg.appendChild(style);
    
    // Convertir SVG a imagen
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    
    img.onload = () => {
      // Dibujar imagen en canvas con escala
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      if (format === 'png') {
        // Descargar PNG con alta calidad
        const link = document.createElement('a');
        link.download = `diagrama-uml-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      } else if (format === 'pdf') {
        // Crear PDF usando jsPDF
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Calcular dimensiones para el PDF
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 20; // Margen de 10mm cada lado
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Centrar imagen en el PDF
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;
        
        // Agregar imagen al PDF con alta calidad
        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        
        // Descargar PDF
        pdf.save(`diagrama-uml-${new Date().toISOString().split('T')[0]}.pdf`);
      }
      
      // Limpiar URL temporal
      URL.revokeObjectURL(url);
    };
    
    img.onerror = () => {
      console.error('Error al cargar la imagen SVG');
      alert('Error al procesar el diagrama para exportación');
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
    
  } catch (error) {
    console.error('Error al exportar:', error);
    alert('Error al exportar el diagrama');
  }
};
