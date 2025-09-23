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
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setData("text/uml-tool", "uml-class");
            // Fallback for some browsers that only allow text/plain
            try { e.dataTransfer.setData("text/plain", "uml-class"); } catch {}
            try { e.dataTransfer.dropEffect = "copy"; } catch {}
          }}
        >
          Clase
        </button>
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "uml-interface" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("uml-interface")}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setData("text/uml-tool", "uml-interface");
            try { e.dataTransfer.setData("text/plain", "uml-interface"); } catch {}
            try { e.dataTransfer.dropEffect = "copy"; } catch {}
          }}
        >
          Interfaz
        </button>
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "uml-abstract" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("uml-abstract")}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setData("text/uml-tool", "uml-abstract");
            try { e.dataTransfer.setData("text/plain", "uml-abstract"); } catch {}
            try { e.dataTransfer.dropEffect = "copy"; } catch {}
          }}
        >
          Abstracta
        </button>
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "uml-enum" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("uml-enum")}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setData("text/uml-tool", "uml-enum");
            try { e.dataTransfer.setData("text/plain", "uml-enum"); } catch {}
            try { e.dataTransfer.dropEffect = "copy"; } catch {}
          }}
        >
          Enumeración
        </button>
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "uml-package" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("uml-package")}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setData("text/uml-tool", "uml-package");
            try { e.dataTransfer.setData("text/plain", "uml-package"); } catch {}
            try { e.dataTransfer.dropEffect = "copy"; } catch {}
          }}
        >
          Paquete
        </button>
        <div className="h-px bg-gray-200 my-1" />
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "assoc" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("assoc")}
        >
          Asociación (2 clics)
        </button>
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "aggregation" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("aggregation")}
        >
          Agregación (2 clics)
        </button>
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "composition" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("composition")}
        >
          Composición (2 clics)
        </button>
        <button
          className={`text-left rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${tool === "dependency" ? "bg-gray-100" : ""}`}
          onClick={() => onSelectTool("dependency")}
        >
          Dependencia (2 clics)
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
