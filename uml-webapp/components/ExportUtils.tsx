import * as joint from 'jointjs';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'json') => void;
}

export function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
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
        
        <p className="text-gray-600 mb-6">Exportar el diagrama como archivo JSON:</p>
        
        <div className="space-y-3">
          <button
            onClick={() => onExport('json')}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar como JSON
          </button>
        </div>
      </div>
    </div>
  );
}

export const exportCanvas = (paper: joint.dia.Paper | null, format: 'json') => {
  if (!paper) return;
  
  try {
    // Obtener el modelo del diagrama
    const graph = (paper as any).model;
    
    if (!graph || graph.getCells().length === 0) {
      alert('No hay elementos en el diagrama para exportar');
      return;
    }
    
    // Crear objeto de exportación con metadatos
    const exportData = {
      metadata: {
        version: '1.0',
        exportDate: new Date().toISOString(),
        title: 'Diagrama UML',
        description: 'Diagrama exportado desde la aplicación UML'
      },
      diagram: {
        cells: graph.getCells().map((cell: any) => {
          // Obtener las propiedades del elemento
          const cellData = cell.toJSON();
          
          // Limpiar datos innecesarios para la exportación
          const cleanCellData = {
            id: cellData.id,
            type: cellData.type,
            position: cellData.position,
            size: cellData.size,
            attrs: cellData.attrs,
            // Incluir propiedades específicas del tipo de elemento
            ...(cellData.uml && { uml: cellData.uml }),
            ...(cellData.ports && { ports: cellData.ports }),
            ...(cellData.source && { source: cellData.source }),
            ...(cellData.target && { target: cellData.target }),
            ...(cellData.vertices && { vertices: cellData.vertices }),
            ...(cellData.labels && { labels: cellData.labels })
          };
          
          return cleanCellData;
        }),
        // Información del viewport/zoom
        viewport: {
          scale: paper.scale().sx,
          translate: paper.translate()
        }
      }
    };
    
    // Convertir a JSON con formato legible
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Crear y descargar el archivo
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagrama-uml-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar URL temporal
    URL.revokeObjectURL(url);
    
    console.log('Diagrama exportado exitosamente como JSON');
    
  } catch (error) {
    console.error('Error al exportar:', error);
    alert('Error al exportar el diagrama como JSON');
  }
};
