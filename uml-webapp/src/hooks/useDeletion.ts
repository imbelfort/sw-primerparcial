import { useCallback, useEffect } from 'react';
import { ClassData } from '../../components/Inspector';
import { getLinkDataFromCell } from '../../lib/umlTools';
import * as joint from 'jointjs';

// Hook para manejar la eliminación de elementos
export function useDeletion(
  graphRef: React.RefObject<joint.dia.Graph | null>,
  selected: ClassData | null,
  linkSelected: ReturnType<typeof getLinkDataFromCell> | null,
  setSelected: (selected: ClassData | null) => void,
  setLinkSelected: (linkSelected: ReturnType<typeof getLinkDataFromCell> | null) => void
) {
  
  const handleDeleteSelected = useCallback(() => {
    // Eliminar nodo
    if (selected) {
      const cell = graphRef.current?.getCell(selected.id) as any;
      if (cell && typeof cell.remove === "function") {
        cell.remove();
        setSelected(null);
      }
      return;
    }
    // Eliminar enlace
    if (linkSelected) {
      const cell = graphRef.current?.getCell(linkSelected.id) as any;
      if (cell && typeof cell.remove === "function") {
        cell.remove();
        setLinkSelected(null);
      }
      return;
    }
  }, [selected, linkSelected, graphRef, setSelected, setLinkSelected]);

  // Soporte para eliminación con teclado (Delete / Backspace fuera de inputs)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selected) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      const isEditable = el?.isContentEditable;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || isEditable;
      if (typing) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected?.id, handleDeleteSelected]);

  return { handleDeleteSelected };
}
