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
      <aside className="w-80 bg-white border-l border-gray-200 p-6 hidden md:block">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Inspector</h2>
        </div>
        <div className="text-sm text-gray-500 leading-relaxed">
          Selecciona un elemento del diagrama para editar sus propiedades y configuraciones.
        </div>
      </aside>
    );
  }

  const isUml = selected.kind !== "standard";

  return (
    <aside className="w-80 bg-white border-l border-gray-200 p-6 space-y-6 hidden md:block">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Inspector</h2>
        </div>
        <button
          onClick={onClear}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Limpiar
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">ID:</span>
          <span className="font-mono text-gray-900">{selected.id}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Tipo:</span>
          <span className="font-medium text-gray-900 capitalize">{selected.kind.replace('uml-', '')}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            onChange({ name: e.target.value });
          }}
          placeholder={isUml ? "Nombre de la clase" : "Etiqueta"}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {isUml && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Atributos</label>
            <div className="relative">
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
                placeholder="Ej: nombre: string&#10;edad: number&#10;activo: boolean"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {attributes.split('\n').filter(line => line.trim()).length} atributos
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Métodos</label>
            <div className="relative">
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
                placeholder="Ej: getNombre(): string&#10;setEdad(edad: number): void&#10;calcularTotal(): number"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {methods.split('\n').filter(line => line.trim()).length} métodos
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
