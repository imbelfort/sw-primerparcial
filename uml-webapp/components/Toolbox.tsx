"use client";

import React from "react";

export type Tool =
  | "select"
  | "uml-class"
  | "uml-interface"
  | "uml-abstract"
  | "assoc"
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
    <aside className="w-56 border-r p-3 space-y-2 overflow-auto">
      <div className="text-sm font-semibold text-gray-700">Herramientas</div>
      <div className="grid grid-cols-1 gap-2">
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "select" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("select")}
        >
          Selección
        </button>
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "uml-class" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("uml-class")}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/uml-tool", "uml-class");
          }}
        >
          Clase
        </button>
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "uml-interface" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("uml-interface")}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/uml-tool", "uml-interface");
          }}
        >
          Interfaz
        </button>
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "uml-abstract" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("uml-abstract")}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/uml-tool", "uml-abstract");
          }}
        >
          Abstracta
        </button>
        <div className="h-px bg-gray-200 my-1" />
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "assoc" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("assoc")}
        >
          Asociación (2 clics)
        </button>
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "generalization" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("generalization")}
        >
          Generalización (2 clics)
        </button>
        {linkSourceId && (
          <div className="text-xs text-blue-700">Seleccione el destino…</div>
        )}
      </div>
    </aside>
  );
}
