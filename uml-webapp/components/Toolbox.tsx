"use client";

import React from "react";

export type Tool =
  | "select"
  | "uml-class"
  | "uml-interface"
  | "uml-abstract"
  | "uml-enum"
  | "uml-package"
  | "assoc"
  | "aggregation"
  | "composition"
  | "dependency"
  | "generalization";

export function Toolbox({
  tool,
  linkSourceId,
  onSelectTool,
}: {
  tool: Tool;
  linkSourceId: string | null;
  onSelectTool: (t: Tool) => void;
}) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 space-y-4 overflow-auto">
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
        <h2 className="text-sm font-semibold text-gray-900">Herramientas</h2>
      </div>
      <div className="space-y-3">
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tool === "select" 
              ? "bg-blue-50 text-blue-700 border border-blue-200" 
              : "text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
          onClick={() => onSelectTool("select")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <span>Selección</span>
        </button>
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tool === "uml-class" 
              ? "bg-blue-50 text-blue-700 border border-blue-200" 
              : "text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
          onClick={() => onSelectTool("uml-class")}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setData("text/uml-tool", "uml-class");
            try { e.dataTransfer.setData("text/plain", "uml-class"); } catch {}
            try { e.dataTransfer.dropEffect = "copy"; } catch {}
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>Clase</span>
        </button>
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tool === "uml-interface" 
              ? "bg-blue-50 text-blue-700 border border-blue-200" 
              : "text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
          onClick={() => onSelectTool("uml-interface")}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setData("text/uml-tool", "uml-interface");
            try { e.dataTransfer.setData("text/plain", "uml-interface"); } catch {}
            try { e.dataTransfer.dropEffect = "copy"; } catch {}
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Interfaz</span>
        </button>
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tool === "uml-abstract" 
              ? "bg-blue-50 text-blue-700 border border-blue-200" 
              : "text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
          onClick={() => onSelectTool("uml-abstract")}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setData("text/uml-tool", "uml-abstract");
            try { e.dataTransfer.setData("text/plain", "uml-abstract"); } catch {}
            try { e.dataTransfer.dropEffect = "copy"; } catch {}
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Abstracta</span>
        </button>
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tool === "uml-enum" 
              ? "bg-blue-50 text-blue-700 border border-blue-200" 
              : "text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
          onClick={() => onSelectTool("uml-enum")}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setData("text/uml-tool", "uml-enum");
            try { e.dataTransfer.setData("text/plain", "uml-enum"); } catch {}
            try { e.dataTransfer.dropEffect = "copy"; } catch {}
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span>Enumeración</span>
        </button>
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tool === "uml-package" 
              ? "bg-blue-50 text-blue-700 border border-blue-200" 
              : "text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
          onClick={() => onSelectTool("uml-package")}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setData("text/uml-tool", "uml-package");
            try { e.dataTransfer.setData("text/plain", "uml-package"); } catch {}
            try { e.dataTransfer.dropEffect = "copy"; } catch {}
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Paquete</span>
        </button>
        <div className="h-px bg-gray-200 my-2" />
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tool === "assoc" 
              ? "bg-blue-50 text-blue-700 border border-blue-200" 
              : "text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
          onClick={() => onSelectTool("assoc")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Asociación</span>
        </button>
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tool === "aggregation" 
              ? "bg-blue-50 text-blue-700 border border-blue-200" 
              : "text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
          onClick={() => onSelectTool("aggregation")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Agregación</span>
        </button>
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tool === "composition" 
              ? "bg-blue-50 text-blue-700 border border-blue-200" 
              : "text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
          onClick={() => onSelectTool("composition")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Composición</span>
        </button>
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tool === "dependency" 
              ? "bg-blue-50 text-blue-700 border border-blue-200" 
              : "text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
          onClick={() => onSelectTool("dependency")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Dependencia</span>
        </button>
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tool === "generalization" 
              ? "bg-blue-50 text-blue-700 border border-blue-200" 
              : "text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
          onClick={() => onSelectTool("generalization")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          <span>Generalización</span>
        </button>
        {linkSourceId && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-sm font-medium text-blue-700">Selecciona el destino</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
