import { useMemo, useCallback } from 'react';

type UseEfficientRenderingProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T, index: number) => string | number;
};

export function useEfficientRendering<T>({
  items,
  renderItem,
  getItemKey,
}: UseEfficientRenderingProps<T>) {
  // Memoizar los elementos renderizados
  const renderedItems = useMemo(() => {
    return items.map((item, index) => ({
      key: getItemKey(item, index),
      element: renderItem(item, index),
    }));
  }, [items, renderItem, getItemKey]);

  // Función para obtener el tamaño de un elemento
  const getItemSize = useCallback((index: number) => {
    // Tamaño fijo por defecto, puedes personalizar según tus necesidades
    return 40;
  }, []);

  return {
    renderedItems,
    getItemSize,
  };
}
