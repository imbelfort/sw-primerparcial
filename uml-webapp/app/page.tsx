"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [joinId, setJoinId] = useState("");

  const startNewDiagram = useCallback(() => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    router.push(`/diagram/${id}`);
  }, [router]);

  const joinExisting = useCallback(() => {
    const id = joinId.trim();
    if (!id) return;
    router.push(`/diagram/${encodeURIComponent(id)}`);
  }, [joinId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-light text-gray-900">Diagramador UML</h1>
          <p className="text-sm text-gray-600">
            Proyecto para Ingeniería de Software 1
          </p>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Crea y edita diagramas de clases UML de forma colaborativa en tiempo real
          </p>
        </div>
        
        <button
          onClick={startNewDiagram}
          className="w-full py-3 px-4 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Nuevo Diagrama
        </button>

        <div className="space-y-2">
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") joinExisting();
            }}
            placeholder="ID del diagrama"
            className="w-full py-2 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-black"
          />
          <button
            onClick={joinExisting}
            disabled={!joinId.trim()}
            className="w-full py-2 px-4 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            Unirse
          </button>
        </div>
      </div>
    </div>
  );
}
