import React, { useState, useEffect } from 'react';
import * as joint from 'jointjs';
import { ExportModal, exportCanvas } from './ExportUtils';

interface ZoomControlsProps {
  paper: joint.dia.Paper | null;
  className?: string;
}

export function ZoomControls({ paper, className = '' }: ZoomControlsProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [zoomPercentage, setZoomPercentage] = useState(100);

  // Función para actualizar el porcentaje de zoom
  const updateZoomPercentage = () => {
    if (!paper) return;
    const currentScale = paper.scale().sx;
    const percentage = Math.round(currentScale * 100);
    setZoomPercentage(percentage);
  };

  // Efecto para escuchar cambios en el zoom del paper
  useEffect(() => {
    if (!paper) return;

    // Actualizar porcentaje inicial
    updateZoomPercentage();

    // Escuchar eventos de zoom
    const handleZoom = () => {
      updateZoomPercentage();
    };

    paper.on('scale', handleZoom);
    paper.on('translate', handleZoom);

    return () => {
      // JointJS no tiene un método directo para remover listeners
      // Los listeners se limpian automáticamente cuando el paper se destruye
    };
  }, [paper]);

  const zoomIn = () => {
    if (!paper) return;
    const currentScale = paper.scale().sx;
    paper.scale(currentScale * 1.2, currentScale * 1.2);
    updateZoomPercentage();
  };

  const zoomOut = () => {
    if (!paper) return;
    const currentScale = paper.scale().sx;
    paper.scale(currentScale * 0.8, currentScale * 0.8);
    updateZoomPercentage();
  };

  const resetZoom = () => {
    if (!paper) return;
    paper.scale(1, 1);
    paper.translate(0, 0);
    updateZoomPercentage();
  };

  const handleExport = (format: 'json') => {
    exportCanvas(paper, format);
    setShowExportModal(false);
  };

  return (
    <>
      <div className={`flex flex-col space-y-2 ${className}`}>
        {/* Indicador de porcentaje de zoom */}
        <div className="w-10 h-8 bg-white rounded shadow-md flex items-center justify-center text-xs font-medium text-gray-700">
          {zoomPercentage}%
        </div>
        
        <button
          onClick={zoomIn}
          className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Acercar (Ctrl + +)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        
        <button
          onClick={zoomOut}
          className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Alejar (Ctrl + -)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        
        <button
          onClick={resetZoom}
          className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Restablecer zoom (0)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        
        <div className="border-t border-gray-200 my-2"></div>
        
        <button
          onClick={() => setShowExportModal(true)}
          className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Exportar diagrama"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>
      
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />
    </>
  );
}
