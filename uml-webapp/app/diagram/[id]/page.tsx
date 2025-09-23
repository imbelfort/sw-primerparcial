"use client";

import { useRef } from "react";
import { useParams } from "next/navigation";
import { Toolbox } from "../../../components/Toolbox";
import { Inspector, type ClassData } from "../../../components/Inspector";
import { LinkInspector } from "../../../components/LinkInspector";
import { ZoomControls } from "../../../components/ZoomControls";
import { Chatbot, DiagramSuggestionCard } from "../../../components/Chatbot";
import { applyClassDataToCell, applyLinkDataToCell } from "../../../lib/umlTools";
import * as joint from "jointjs";
import "jointjs/dist/joint.css";

// Importar todos los hooks personalizados
import {
  useDiagramState,
  useJointJS,
  useCanvasNavigation,
  useChatbotLogic,
  useSocketIO,
  useDragAndDrop,
  useDeletion,
  useCursorCleanup,
  useClipboard,
  useChatbotState,
  useNavigationState,
  useCollaborationState,
} from "../../../src/hooks";

export default function DiagramByIdPage() {
  const params = useParams<{ id: string }>();
  const diagramId = params?.id as string;

  // Refs para elementos DOM
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const suppressRemoteRef = useRef(false);

  // Hooks personalizados para el estado del diagrama
  const {
    tool,
    setTool,
    linkSourceId,
    setLinkSourceId,
    selected,
    setSelected,
    linkSelected,
    setLinkSelected,
    pendingLinkAnchor,
    setPendingLinkAnchor,
    ctxMenu,
    setCtxMenu,
    toolRef,
    linkSourceRef,
  } = useDiagramState();

  // Hooks para el chatbot
  const {
    showChatbot,
    setShowChatbot,
    chatSuggestions,
    setChatSuggestions,
  } = useChatbotState();

  // Hooks para navegación
  const {
    isPanning,
    setIsPanning,
    lastPos,
    setLastPos,
  } = useNavigationState();

  // Hooks para colaboración
  const {
    peerCursors,
    setPeerCursors,
  } = useCollaborationState();

  // Hooks para UI
  const {
    copied,
    copiedId,
    copyLink,
    copyId,
  } = useClipboard();

  // Inicializar JointJS
  const { graphRef, paperRef } = useJointJS(
    canvasRef,
    containerRef,
    tool,
    toolRef,
    linkSourceId,
    linkSourceRef,
    setSelected,
    setLinkSelected,
    setLinkSourceId,
    setPendingLinkAnchor,
    setCtxMenu
  );

  // Lógica de navegación del canvas
  useCanvasNavigation(
    containerRef,
    canvasRef,
    paperRef,
    tool,
    isPanning,
    setIsPanning,
    lastPos,
    setLastPos
  );

  // Lógica del chatbot
  const { handleApplySuggestion, handleApplyAllSuggestions, handleChatResponse } = useChatbotLogic(
    graphRef,
    setChatSuggestions
  );

  // Socket.IO para colaboración en tiempo real
  useSocketIO(
    diagramId,
    graphRef,
    suppressRemoteRef,
    setPeerCursors,
    containerRef
  );

  // Drag and drop
  useDragAndDrop(containerRef, canvasRef, graphRef);

  // Eliminación de elementos
  const { handleDeleteSelected } = useDeletion(
    graphRef,
    selected,
    linkSelected,
    setSelected,
    setLinkSelected
  );

  // Limpieza de cursores obsoletos
  useCursorCleanup(setPeerCursors);







  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="p-3 border-b flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">UML Diagram (ID: {diagramId})</h1>
          <span className="text-sm text-gray-500">Colaboración en tiempo real</span>
          <span className="ml-2 text-xs rounded-full border px-2 py-0.5 text-gray-700 bg-gray-50">
            {tool === "select" && "Herramienta: Selección (arrastrar fondo para mover, rueda para zoom, flechas para navegar)"}
            {tool === "uml-class" && "Herramienta: Clase (clic en la pizarra o arrastre)"}
            {tool === "uml-interface" && "Herramienta: Interfaz (clic en la pizarra o arrastre)"}
            {tool === "uml-abstract" && "Herramienta: Abstracta (clic en la pizarra o arrastre)"}
            {tool === "uml-enum" && "Herramienta: Enumeración (clic en la pizarra o arrastre)"}
            {tool === "uml-package" && "Herramienta: Paquete (clic en la pizarra o arrastre)"}
            {tool === "assoc" && "Herramienta: Asociación (clic origen y luego destino)"}
            {tool === "aggregation" && "Herramienta: Agregación (clic origen y luego destino)"}
            {tool === "composition" && "Herramienta: Composición (clic origen y luego destino)"}
            {tool === "dependency" && "Herramienta: Dependencia (clic origen y luego destino)"}
            {tool === "generalization" && "Herramienta: Generalización (clic origen y luego destino)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChatbot(true)}
            className="inline-flex items-center justify-center rounded-md bg-green-600 text-white px-4 py-1.5 text-sm hover:bg-green-700"
          >
            🤖 Asistente IA
          </button>
          <button
            onClick={() => {
              // Prueba específica del chatbot con el caso que está fallando
              const testMessage = "Crea un sistema de gestión de alumnos con las clases Alumno, Asignatura, Nota y Profesor";
              console.log('Enviando mensaje de prueba:', testMessage);
              
              // Simular la respuesta del chatbot
              fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: testMessage, history: [] }),
              })
              .then(response => response.json())
              .then(data => {
                console.log('Respuesta del chatbot:', data);
                if (data.suggestions && data.suggestions.length > 0) {
                  console.log('Aplicando sugerencias:', data.suggestions);
                  data.suggestions.forEach((suggestion: any) => {
                    handleApplySuggestion(suggestion);
                  });
                } else {
                  console.log('No se encontraron sugerencias en la respuesta');
                  console.log('Mensaje completo:', data.message);
                }
              })
              .catch(error => {
                console.error('Error al probar chatbot:', error);
              });
            }}
            className="inline-flex items-center justify-center rounded-md bg-purple-600 text-white px-3 py-1.5 text-sm hover:bg-purple-700"
          >
            🧪 Prueba Chatbot
          </button>
          <button
            onClick={copyLink}
            className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            {copied ? "Enlace copiado" : "Copiar enlace"}
          </button>
          <button
            onClick={() => copyId(diagramId)}
            className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            {copiedId ? "ID copiado" : "Copiar ID"}
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={!selected && !linkSelected}
            className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm ${selected || linkSelected ? "hover:bg-red-50" : "opacity-50 cursor-not-allowed"}`}
            title={selected || linkSelected ? "Eliminar elemento seleccionado (Supr/Backspace)" : "No hay selección"}
          >
            Eliminar seleccionado
          </button>
        </div>
      </div>
      <div className="flex-1 flex min-h-0">
        {/* Toolbox */}
        <Toolbox
          tool={tool}
          linkSourceId={linkSourceId}
          onSelectTool={(t) => { setTool(t); setLinkSourceId(null); setPendingLinkAnchor(null); }}
        />
        {/* Canvas + presence overlay */}
        <div 
          className="flex-1 relative" 
          ref={containerRef} 
          style={{ 
            overflow: 'hidden', // Eliminar barras de desplazamiento
            width: '100%',
            height: '100%',
            position: 'relative',
            cursor: isPanning ? 'grabbing' : 'grab' // Cambiar cursor para indicar que se puede arrastrar
          }}
        >
          <div 
            ref={canvasRef}
            style={{ 
              cursor: isPanning ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              position: 'absolute',
              width: '100%',
              height: '100%',
              transformOrigin: '0 0'
            }}
          />
          {/* Controles de zoom */}
          <ZoomControls paper={paperRef.current} className="absolute bottom-4 right-4" />
          {/* Pending link hint */}
          {linkSourceId && (
            <>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 rounded-md border bg-white px-3 py-1 text-xs shadow">
                Seleccione el destino…
              </div>
              {pendingLinkAnchor && (
                <div
                  className="absolute z-40 w-3 h-3 rounded-full ring-2 ring-white shadow"
                  style={{ left: pendingLinkAnchor.x, top: pendingLinkAnchor.y, transform: "translate(-50%, -50%)", backgroundColor: "#2563eb" }}
                  title="Origen"
                />
              )}
            </>
          )}
          {/* Custom context menu */}
          {ctxMenu.visible && (
            <div
              className="absolute z-50 bg-white border rounded-md shadow text-sm select-none"
              style={{ left: ctxMenu.x, top: ctxMenu.y }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <button
                className="block w-full text-left px-3 py-2 hover:bg-red-50"
                onClick={() => {
                  const id = ctxMenu.cellId;
                  if (id) {
                    const cell = graphRef.current?.getCell(id) as any;
                    if (cell && typeof cell.remove === "function") {
                      cell.remove();
                      if (selected?.id === id) setSelected(null);
                    }
                  }
                  setCtxMenu((m) => ({ ...m, visible: false }));
                }}
              >
                Eliminar
              </button>
            </div>
          )}
          {/* Presence cursors overlay */}
          {Object.entries(peerCursors).map(([id, c]) => (
            <div
              key={id}
              className="pointer-events-none absolute"
              style={{ left: `${c.xPct}%`, top: `${c.yPct}%`, transform: "translate(-50%, -50%)" }}
            >
              <div
                style={{ backgroundColor: c.color }}
                className="w-3 h-3 rounded-full shadow ring-2 ring-white"
                title={id}
              />
            </div>
          ))}
        </div>
        {/* Inspectors */}
        {selected ? (
          <Inspector
            selected={selected}
            onChange={(updated) => {
              if (!selected) return;
              const cell = graphRef.current?.getCell(selected.id) as any;
              if (!cell) return;
              applyClassDataToCell(cell, updated as any);
              // Update local selected state to reflect immediate UI changes
              setSelected((prev: ClassData | null) => (prev ? { ...prev, ...updated } as ClassData : prev));
            }}
            onClear={() => setSelected(null)}
          />
        ) : (
          <LinkInspector
            selected={linkSelected}
            onChange={(updated) => {
              if (!linkSelected) return;
              
              // Get the cell from the graph
              const cell = graphRef.current?.getCell(linkSelected.id);
              if (!cell) return;
              
              // Update the link data in the model
              applyLinkDataToCell(cell, updated);
              
              // Update the local state to reflect the changes
              setLinkSelected((prev: any) => prev ? { ...prev, ...updated } : null);
              
              // Find the view and update it
              const paper = paperRef.current;
              if (paper) {
                const linkView = paper.findViewByModel(cell);
                if (linkView) {
                  // Update the view to reflect the changes
                  linkView.update();
                }
              }
            }}
            onClear={() => setLinkSelected(null)}
          />
        )}
      </div>

      {/* Chatbot Modal */}
      {showChatbot && (
        <Chatbot
          onApplySuggestion={handleApplySuggestion}
          onApplyAllSuggestions={handleApplyAllSuggestions}
          onClose={() => setShowChatbot(false)}
          onResponse={handleChatResponse}
        />
      )}

      {/* Sugerencias del Chatbot */}
      {chatSuggestions.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40">
          <div className="bg-white rounded-lg shadow-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Sugerencias del Asistente IA</h3>
              <button
                onClick={() => setChatSuggestions([])}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chatSuggestions.map((suggestion, index) => (
                <DiagramSuggestionCard
                  key={index}
                  suggestion={suggestion}
                  onApply={handleApplySuggestion}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
