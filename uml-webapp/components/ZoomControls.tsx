import React from 'react';
import * as joint from 'jointjs';

interface ZoomControlsProps {
  paper: joint.dia.Paper | null;
  className?: string;
}

export function ZoomControls({ paper, className = '' }: ZoomControlsProps) {
  const zoomIn = () => {
    if (!paper) return;
    const currentScale = paper.scale().sx;
    paper.scale(currentScale * 1.2, currentScale * 1.2);
  };

  const zoomOut = () => {
    if (!paper) return;
    const currentScale = paper.scale().sx;
    paper.scale(currentScale * 0.8, currentScale * 0.8);
  };

  const resetZoom = () => {
    if (!paper) return;
    paper.scale(1, 1);
    paper.translate(0, 0);
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
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
    </div>
  );
}
