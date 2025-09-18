"use client";

import React, { useEffect, useMemo, useState } from "react";

export type ClassData = {
  id: string;
  kind: "uml-class" | "uml-interface" | "uml-abstract" | "standard";
  name?: string;
  attributes?: string[];
  methods?: string[];
};

export function Inspector({
  selected,
  onChange,
  onClear,
}: {
  selected: ClassData | null;
  onChange: (updated: Partial<ClassData>) => void;
  onClear: () => void;
}) {
  const [name, setName] = useState("");
  const [attributes, setAttributes] = useState("");
  const [methods, setMethods] = useState("");

  useEffect(() => {
    if (!selected) {
      setName("");
      setAttributes("");
      setMethods("");
      return;
    }
    setName(selected.name ?? "");
    setAttributes((selected.attributes ?? []).join("\n"));
    setMethods((selected.methods ?? []).join("\n"));
  }, [selected?.id]);

  if (!selected) {
    return (
      <aside className="w-72 border-l p-4 text-sm text-gray-600 hidden md:block">
        <div className="font-semibold text-gray-800 mb-2">Inspector</div>
        <div>Selecciona un elemento para editar sus propiedades.</div>
      </aside>
    );
  }

  const isUml = selected.kind !== "standard";

  return (
    <aside className="w-72 border-l p-4 space-y-3 hidden md:block">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-800">Inspector</div>
        <button
          onClick={onClear}
          className="text-xs rounded border px-2 py-1 hover:bg-gray-50"
        >
          Limpiar selección
        </button>
      </div>

      <div className="text-xs text-gray-500">ID: {selected.id}</div>
      <div className="text-xs text-gray-500">Tipo: {selected.kind}</div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            onChange({ name: e.target.value });
          }}
          placeholder={isUml ? "Nombre de la clase" : "Etiqueta"}
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isUml && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Atributos (uno por línea)</label>
            <textarea
              value={attributes}
              onChange={(e) => {
                setAttributes(e.target.value);
                const arr = e.target.value
                  .split(/\r?\n/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                onChange({ attributes: arr });
              }}
              rows={6}
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Métodos (uno por línea)</label>
            <textarea
              value={methods}
              onChange={(e) => {
                setMethods(e.target.value);
                const arr = e.target.value
                  .split(/\r?\n/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                onChange({ methods: arr });
              }}
              rows={6}
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}
    </aside>
  );
}
