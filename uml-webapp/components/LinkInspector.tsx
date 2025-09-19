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
    
    setFormData({
      label: selected.sourceRole || "",
      sourceMultiplicity: selected.sourceMultiplicity || "",
      targetMultiplicity: selected.targetMultiplicity || ""
    });
  }, [selected?.id]);

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Map the form data to the expected LinkData structure
    const linkData = {
      sourceRole: newData.label,
      sourceMultiplicity: newData.sourceMultiplicity,
      targetMultiplicity: newData.targetMultiplicity
    };
    
    onChange(linkData);
  };

  if (!selected) {
    return (
      <aside className="w-72 border-l p-4 text-sm text-gray-600 hidden md:block">
        <div className="font-semibold text-gray-800 mb-2">Inspector de Relación</div>
        <div>Selecciona una relación para editar multiplicidades y roles.</div>
      </aside>
    );
  }

  return (
    <aside className="w-72 border-l p-4 space-y-3 hidden md:block">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-800">Inspector de Relación</div>
        <button
          onClick={onClear}
          className="text-xs rounded border px-2 py-1 hover:bg-gray-50"
        >
          Limpiar selección
        </button>
      </div>

      <div className="text-xs text-gray-500">ID: {selected.id}</div>
      <div className="text-xs text-gray-500">Tipo: {selected.kind}</div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la relación</label>
          <input
            value={formData.label}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="Ej: Cliente - Pedido"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Multiplicidad Origen</label>
            <input
              value={formData.sourceMultiplicity}
              onChange={(e) => handleChange('sourceMultiplicity', e.target.value)}
              placeholder="Ej: 1, 0..*, etc."
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Multiplicidad Destino</label>
            <input
              value={formData.targetMultiplicity}
              onChange={(e) => handleChange('targetMultiplicity', e.target.value)}
              placeholder="Ej: 0..*, 1, etc."
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
