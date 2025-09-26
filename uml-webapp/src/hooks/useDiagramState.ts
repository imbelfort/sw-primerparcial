import { useCallback, useEffect, useRef, useState } from 'react';
import { Tool } from '../../components/Toolbox';
import { ClassData } from '../../components/Inspector';
import { getLinkDataFromCell } from '../../lib/umlTools';

// Hook para manejar el estado del diagrama
export function useDiagramState() {
  const [tool, setTool] = useState<Tool>("select");
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ClassData | null>(null);
  const [linkSelected, setLinkSelected] = useState<ReturnType<typeof getLinkDataFromCell> | null>(null);
  const [pendingLinkAnchor, setPendingLinkAnchor] = useState<{ x: number; y: number } | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ visible: boolean; x: number; y: number; cellId: string | null }>({
    visible: false,
    x: 0,
    y: 0,
    cellId: null,
  });

  // Refs para evitar closures obsoletos
  const toolRef = useRef<Tool>("select");
  useEffect(() => { toolRef.current = tool; }, [tool]);
  
  const linkSourceRef = useRef<string | null>(null);
  useEffect(() => { linkSourceRef.current = linkSourceId; }, [linkSourceId]);

  return {
    tool,
    setTool,
    linkSourceId,
    setLinkSourceId,
    selected,
    setSelected,
    linkSelected,
    setLinkSelected,
    pendingLinkAnchor,
    setPendingLinkAnchor,
    ctxMenu,
    setCtxMenu,
    toolRef,
    linkSourceRef,
  };
}

// Hook para manejar el estado del chatbot
export function useChatbotState() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatSuggestions, setChatSuggestions] = useState<any[]>([]);

  return {
    showChatbot,
    setShowChatbot,
    chatSuggestions,
    setChatSuggestions,
  };
}

// Hook para manejar el estado de navegación
export function useNavigationState() {
  const [isPanning, setIsPanning] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  return {
    isPanning,
    setIsPanning,
    lastPos,
    setLastPos,
  };
}

// Hook para manejar el estado de colaboración
export function useCollaborationState() {
  const [peerCursors, setPeerCursors] = useState<Record<string, { xPct: number; yPct: number; color: string; ts: number }>>({});
  const [suppressRemote, setSuppressRemote] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [peerSelections, setPeerSelections] = useState<Record<string, { cellId: string; type: 'class' | 'link'; ts: number }>>({});

  return {
    peerCursors,
    setPeerCursors,
    suppressRemote,
    setSuppressRemote,
    connectedUsers,
    setConnectedUsers,
    peerSelections,
    setPeerSelections,
  };
}

// Hook para manejar el estado de la UI
export function useUIState() {
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  return {
    bannerMsg,
    setBannerMsg,
    copied,
    setCopied,
    copiedId,
    setCopiedId,
  };
}
