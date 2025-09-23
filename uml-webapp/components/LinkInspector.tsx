"use client";

import React, { useEffect, useState } from "react";
import type { LinkData } from "../lib/umlTools";

export function LinkInspector({
  selected,
  onChange,
  onClear,
}: {
  selected: LinkData | null;
  onChange: (updated: Partial<LinkData>) => void;
  onClear: () => void;
}) {
  const [formData, setFormData] = useState({
    label: "",
    sourceMultiplicity: "",
    targetMultiplicity: ""
  });

  useEffect(() => {
    if (!selected) {
      setFormData({
        label: "",
        sourceMultiplicity: "",
        targetMultiplicity: ""
      });
      return;
    }
    
    // Inicializamos con los valores correctos del enlace seleccionado
    setFormData({
      label: selected.sourceRole || "",
      sourceMultiplicity: selected.sourceMultiplicity || "",
      targetMultiplicity: selected.targetMultiplicity || ""
    });
  }, [selected?.id]);

  const handleChange = (field: string, value: string) => {
    // Actualizamos el estado local del formulario
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Preparamos los datos para el cambio
    const update: Partial<LinkData> = {};
    
    // Mapeamos los campos del formulario a los campos correctos de LinkData
    if (field === 'label') {
      update.sourceRole = value;
    } else if (field === 'sourceMultiplicity') {
      update.sourceMultiplicity = value;
    } else if (field === 'targetMultiplicity') {
      update.targetMultiplicity = value;
    }
    
    // Enviamos solo los campos que han cambiado
    onChange(update);
  };

  if (!selected) {
    return (
      <aside className="w-80 bg-white border-l border-gray-200 p-6 hidden md:block">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Inspector de Relación</h2>
        </div>
        <div className="text-sm text-gray-500 leading-relaxed">
          Selecciona una relación del diagrama para editar multiplicidades, roles y configuraciones.
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-white border-l border-gray-200 p-6 space-y-6 hidden md:block">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Inspector de Relación</h2>
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
          <span className="font-medium text-gray-900 capitalize">{selected.kind}</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Nombre de la relación</label>
          <input
            value={formData.label}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="Ej: Cliente - Pedido"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Multiplicidad Origen</label>
            <input
              value={formData.sourceMultiplicity}
              onChange={(e) => handleChange('sourceMultiplicity', e.target.value)}
              placeholder="Ej: 1, 0..*"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Multiplicidad Destino</label>
            <input
              value={formData.targetMultiplicity}
              onChange={(e) => handleChange('targetMultiplicity', e.target.value)}
              placeholder="Ej: 0..*, 1"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
