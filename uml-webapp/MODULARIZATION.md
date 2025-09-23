# 🏗️ Arquitectura Modular del Diagramador UML

## 📋 Resumen de la Modularización

El archivo `page.tsx` original tenía **más de 1000 líneas** y ha sido refactorizado en una arquitectura modular usando **hooks personalizados** y **utilidades separadas**.

## 🎯 Beneficios de la Modularización

### ✅ **Mantenibilidad**
- Código más fácil de entender y modificar
- Responsabilidades claramente separadas
- Menos acoplamiento entre componentes

### ✅ **Reutilización**
- Hooks pueden ser reutilizados en otros componentes
- Lógica encapsulada y testeable
- Fácil extensión de funcionalidades

### ✅ **Legibilidad**
- Componente principal más limpio y enfocado
- Cada hook tiene una responsabilidad específica
- Código autodocumentado

## 📁 Estructura de Archivos

```
uml-webapp/
├── src/
│   └── hooks/
│       ├── index.ts                    # Exportaciones centralizadas
│       ├── useDiagramState.ts          # Estado del diagrama
│       ├── useJointJS.ts               # Lógica de JointJS
│       ├── useCanvasNavigation.ts      # Navegación (pan/zoom)
│       ├── useChatbotLogic.ts          # Lógica del chatbot
│       ├── useSocketIO.ts              # Comunicación en tiempo real
│       ├── useDragAndDrop.ts           # Drag and drop
│       ├── useDeletion.ts              # Eliminación de elementos
│       ├── useCursorCleanup.ts         # Limpieza de cursores
│       └── useClipboard.ts             # Operaciones del portapapeles
├── app/
│   └── diagram/
│       └── [id]/
│           └── page.tsx                # Componente principal (reducido)
└── components/                         # Componentes UI existentes
```

## 🔧 Hooks Personalizados

### 1. **useDiagramState**
- **Propósito**: Maneja el estado principal del diagrama
- **Incluye**: herramientas, selecciones, menús contextuales
- **Estado**: `tool`, `selected`, `linkSelected`, `ctxMenu`, etc.

### 2. **useJointJS**
- **Propósito**: Inicialización y configuración de JointJS
- **Incluye**: creación de papel, eventos del canvas, elementos demo
- **Funcionalidad**: Manejo completo del motor de diagramas

### 3. **useCanvasNavigation**
- **Propósito**: Navegación del canvas (pan y zoom)
- **Incluye**: eventos del mouse, detección de fondo, prevención de menús
- **Funcionalidad**: Pan suave y zoom optimizado

### 4. **useChatbotLogic**
- **Propósito**: Lógica del asistente de IA
- **Incluye**: aplicación de sugerencias, creación de elementos UML
- **Funcionalidad**: Integración completa con Groq

### 5. **useSocketIO**
- **Propósito**: Comunicación en tiempo real
- **Incluye**: sincronización de estado, cursores de colaboración
- **Funcionalidad**: Colaboración multi-usuario

### 6. **useDragAndDrop**
- **Propósito**: Drag and drop desde toolbox
- **Incluye**: eventos de arrastre, validación de tipos
- **Funcionalidad**: Creación de elementos por arrastre

### 7. **useDeletion**
- **Propósito**: Eliminación de elementos
- **Incluye**: soporte de teclado, eliminación de nodos/enlaces
- **Funcionalidad**: Eliminación segura con confirmación

### 8. **useCursorCleanup**
- **Propósito**: Limpieza de cursores obsoletos
- **Incluye**: timer de limpieza, filtrado por timestamp
- **Funcionalidad**: Mantenimiento de estado de colaboración

### 9. **useClipboard**
- **Propósito**: Operaciones del portapapeles
- **Incluye**: copia de enlaces, copia de IDs
- **Funcionalidad**: Compartir diagramas fácilmente

## 🎨 Componente Principal Refactorizado

El componente `page.tsx` ahora es mucho más limpio:

```typescript
export default function DiagramByIdPage() {
  // Refs para elementos DOM
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Hooks personalizados para el estado
  const diagramState = useDiagramState();
  const chatbotState = useChatbotState();
  const navigationState = useNavigationState();
  // ... más hooks

  // Inicialización de funcionalidades
  const { graphRef, paperRef } = useJointJS(/* ... */);
  useCanvasNavigation(/* ... */);
  const { handleApplySuggestion } = useChatbotLogic(/* ... */);
  useSocketIO(/* ... */);
  // ... más inicializaciones

  // Renderizado del UI
  return (
    <div className="w-screen h-screen flex flex-col">
      {/* UI simplificado */}
    </div>
  );
}
```

## 📊 Comparación Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Líneas de código** | 1000+ | ~350 |
| **Responsabilidades** | Todas en un archivo | Separadas en hooks |
| **Mantenibilidad** | Difícil | Fácil |
| **Testabilidad** | Compleja | Individual por hook |
| **Reutilización** | Ninguna | Alta |
| **Legibilidad** | Baja | Alta |

## 🚀 Próximos Pasos Sugeridos

1. **Testing**: Crear tests unitarios para cada hook
2. **Documentación**: Añadir JSDoc a cada hook
3. **Optimización**: Implementar React.memo donde sea necesario
4. **Extensión**: Crear más hooks para funcionalidades futuras

## 💡 Patrones Utilizados

- **Custom Hooks**: Encapsulación de lógica reutilizable
- **Separation of Concerns**: Cada hook tiene una responsabilidad
- **Composition**: Los hooks se combinan en el componente principal
- **TypeScript**: Tipado fuerte para mejor mantenibilidad

---

**Resultado**: Código más mantenible, testeable y escalable que mantiene toda la funcionalidad original.
