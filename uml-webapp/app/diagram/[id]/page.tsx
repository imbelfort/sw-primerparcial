"use client";

import { useRef, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Toolbox } from "../../../components/Toolbox";
import { Inspector, type ClassData } from "../../../components/Inspector";
import { LinkInspector } from "../../../components/LinkInspector";
import { ZoomControls } from "../../../components/ZoomControls";
import { Chatbot, DiagramSuggestionCard } from "../../../components/Chatbot";
import { SpringCodeGeneratorComponent } from "../../../components/SpringCodeGenerator";
import { UserPresence } from "../../../components/UserPresence";
import { PeerSelectionOverlay } from "../../../components/PeerSelectionOverlay";
import { applyClassDataToCell } from "../../../lib/umlTools";
import { applyLinkDataToCell } from "../../../lib/umlAdvancedTools";
import * as joint from "jointjs";
import "jointjs/dist/joint.css";
// Importar el plugin UML de JointJS
import "jointjs/dist/joint.shapes.uml.js";

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

  // Estado para el generador de código Spring
  const [showSpringGenerator, setShowSpringGenerator] = useState(false);

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
    connectedUsers,
    setConnectedUsers,
    peerSelections,
    setPeerSelections,
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
    setCtxMenu,
    null // sendSelection se pasará después
  );

  // Socket.IO para colaboración en tiempo real
  const { sendSelection } = useSocketIO(
    diagramId,
    graphRef,
    suppressRemoteRef,
    setPeerCursors,
    containerRef,
    paperRef,
    setConnectedUsers,
    setPeerSelections
  );

  // Actualizar sendSelection en useJointJS cuando esté disponible
  useEffect(() => {
    if (sendSelection && paperRef.current) {
      // Actualizar la función sendSelection en el paper
      (paperRef.current as any).updateSendSelection = sendSelection;
    }
  }, [sendSelection, paperRef]);

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
    <div className="w-screen h-screen flex flex-col bg-gray-50">
      {/* Header minimalista */}
      <header className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-medium text-gray-900">UML Diagram</h1>
            <span className="text-sm text-gray-500 font-mono">#{diagramId}</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-gray-500">En línea</span>
            </div>
            <UserPresence connectedUsers={connectedUsers} />
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowChatbot(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Asistente IA
            </button>
            <button
              onClick={() => setShowSpringGenerator(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Generar Código
            </button>
            <button
              onClick={copyLink}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? "Copiado" : "Enlace"}
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={!selected && !linkSelected}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                selected || linkSelected 
                  ? "text-red-700 bg-red-50 border border-red-200 hover:bg-red-100" 
                  : "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
          </div>
        </div>
        {/* Tool indicator */}
        <div className="mt-3 text-xs text-gray-500">
          {tool === "select" && "Selección • Arrastra para mover, rueda para zoom"}
          {tool === "uml-class" && "Clase • Clic en el canvas para crear"}
          {tool === "uml-interface" && "Interfaz • Clic en el canvas para crear"}
          {tool === "uml-abstract" && "Clase Abstracta • Clic en el canvas para crear"}
          {tool === "uml-enum" && "Enumeración • Clic en el canvas para crear"}
          {tool === "uml-package" && "Paquete • Clic en el canvas para crear"}
          {tool === "assoc" && "Asociación • Clic origen y destino"}
          {tool === "aggregation" && "Agregación • Clic origen y destino"}
          {tool === "composition" && "Composición • Clic origen y destino"}
          {tool === "dependency" && "Dependencia • Clic origen y destino"}
          {tool === "generalization" && "Generalización • Clic origen y destino"}
        </div>
      </header>
      <div className="flex-1 flex min-h-0 bg-white">
        {/* Toolbox minimalista */}
        <Toolbox
          tool={tool}
          linkSourceId={linkSourceId}
          onSelectTool={(t) => { setTool(t); setLinkSourceId(null); setPendingLinkAnchor(null); }}
        />
        {/* Canvas principal */}
        <div 
          className="flex-1 relative bg-gray-50" 
          ref={containerRef} 
          style={{ 
            overflow: 'hidden',
            width: '100%',
            height: '100%',
            position: 'relative',
            cursor: isPanning ? 'grabbing' : 'grab'
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
          {/* Controles de zoom minimalistas */}
          <ZoomControls paper={paperRef.current} className="absolute bottom-6 right-6" />
          
          {/* Pending link hint minimalista */}
          {linkSourceId && (
            <>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-lg">
                Selecciona el destino
              </div>
              {pendingLinkAnchor && (
                <div
                  className="absolute z-40 w-3 h-3 rounded-full ring-2 ring-white shadow-lg"
                  style={{ left: pendingLinkAnchor.x, top: pendingLinkAnchor.y, transform: "translate(-50%, -50%)", backgroundColor: "#3b82f6" }}
                  title="Origen"
                />
              )}
            </>
          )}
          {/* Context menu minimalista */}
          {ctxMenu.visible && (
            <div
              className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl text-sm select-none min-w-[120px]"
              style={{ left: ctxMenu.x, top: ctxMenu.y }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <button
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center"
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
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
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

          {/* Peer selections overlay */}
          <PeerSelectionOverlay 
            peerSelections={peerSelections}
            paper={paperRef.current}
            connectedUsers={connectedUsers}
          />
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
            onClear={() => {
              setSelected(null);
              // Enviar deselección
              sendSelection(null);
            }}
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
            onClear={() => {
              setLinkSelected(null);
              // Enviar deselección
              sendSelection(null);
            }}
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

      {/* Spring Code Generator Modal */}
      {showSpringGenerator && graphRef.current && (
        <SpringCodeGeneratorComponent
          graph={graphRef.current}
          onClose={() => setShowSpringGenerator(false)}
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
