import { useState } from 'react';

// Hook para manejar operaciones del portapapeles
export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Clipboard error", e);
    }
  };

  const copyId = async (diagramId: string) => {
    try {
      await navigator.clipboard.writeText(String(diagramId ?? ""));
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1500);
    } catch (e) {
      console.error("Clipboard error", e);
    }
  };

  return {
    copied,
    copiedId,
    copyLink,
    copyId,
  };
}
