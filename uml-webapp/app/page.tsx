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
    <div className="min-h-screen w-full bg-white text-gray-900">
      <header className="p-6 border-b">
        <h1 className="text-2xl font-bold">UML Collaborator</h1>
      </header>
      <main className="container mx-auto px-6 py-16 flex flex-col items-center text-center gap-6">
        <h2 className="text-3xl sm:text-4xl font-semibold">Bienvenido</h2>
        <p className="text-gray-600 max-w-prose">
          Crea un nuevo diagrama colaborativo. No es necesario registrarse; cada sesión
          genera un identificador único que puedes compartir con tu equipo.
        </p>
        <button
          onClick={startNewDiagram}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium h-12 px-6 shadow"
        >
          Iniciar Diagramador UML
        </button>
        <div className="text-sm text-gray-500 mt-2">Se abrirá una sala nueva con un ID aleatorio.</div>

        <div className="mt-10 w-full max-w-md">
          <div className="text-sm font-medium text-gray-700 mb-2">Unirse a un diagrama existente</div>
          <div className="flex items-stretch gap-2">
            <input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") joinExisting();
              }}
              placeholder="Pega el ID del diagrama"
              className="flex-1 rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={joinExisting}
              disabled={!joinId.trim()}
              className="inline-flex items-center justify-center rounded-md bg-gray-900 disabled:bg-gray-300 text-white px-4"
            >
              Unirse
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
