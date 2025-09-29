# Diagrama de Clases - Base de Datos del Proyecto UML

## 📊 **Diagrama de Clases UML**

```mermaid
classDiagram
    %% Entidades de Base de Datos
    class Diagram {
        +String diagramId
        +Object json
        +Number version
        +Date updatedAt
        +save()
        +findById(diagramId)
        +updateVersion()
    }

    %% Entidades del Frontend
    class DiagramElement {
        +String id
        +String type
        +Number x
        +Number y
        +Number width
        +Number height
        +String label
        +String[] attributes
        +String[] methods
        +Object metadata
    }

    class DiagramLink {
        +String id
        +String source
        +String target
        +String type
        +String label
        +String sourceMultiplicity
        +String targetMultiplicity
    }

    class ClassData {
        +String id
        +String kind
        +String name
        +String[] attributes
        +String[] methods
    }

    class LinkData {
        +String id
        +String kind
        +String sourceMultiplicity
        +String targetMultiplicity
        +String sourceRole
        +String targetRole
    }

    %% Entidades de Estado
    class DiagramState {
        +DiagramElement[] elements
        +DiagramLink[] links
        +String selectedElementId
        +DiagramViewport viewport
        +Boolean isLoading
        +String error
    }

    class DiagramViewport {
        +Number x
        +Number y
        +Number width
        +Number height
        +Number zoom
    }

    %% Entidades de Colaboración
    class PeerCursor {
        +String clientId
        +Number xPct
        +Number yPct
        +String color
        +Number timestamp
    }

    class PeerSelection {
        +String userId
        +String cellId
        +String type
        +Number timestamp
    }

    class ConnectedUser {
        +String socketId
        +String diagramId
        +Date connectedAt
    }

    %% Entidades de Chatbot
    class ChatSuggestion {
        +String id
        +String type
        +String content
        +Object metadata
        +Date createdAt
    }

    %% Relaciones
    Diagram ||--o{ DiagramElement : contains
    Diagram ||--o{ DiagramLink : contains
    DiagramState ||--o{ DiagramElement : manages
    DiagramState ||--o{ DiagramLink : manages
    DiagramState ||--|| DiagramViewport : has
    ClassData ||--|| DiagramElement : represents
    LinkData ||--|| DiagramLink : represents
    Diagram ||--o{ ConnectedUser : has
    Diagram ||--o{ PeerCursor : tracks
    Diagram ||--o{ PeerSelection : tracks
    Diagram ||--o{ ChatSuggestion : generates
```

## 🗄️ **Esquema de Base de Datos MongoDB**

### **Colección: `diagrams`**

```javascript
{
  _id: ObjectId,
  diagramId: String,        // ID único del diagrama (indexado, único)
  json: Mixed,              // Estado completo del diagrama (JointJS JSON)
  version: Number,          // Versión para control de concurrencia
  updatedAt: Date           // Timestamp de última actualización
}
```

### **Índices:**
- `diagramId`: Único, indexado
- `updatedAt`: Indexado para consultas por fecha

## 📋 **Mapeo de Entidades**

### **1. Diagram (MongoDB) ↔ DiagramState (Frontend)**

| MongoDB | Frontend | Descripción |
|---------|----------|-------------|
| `diagramId` | URL Parameter | Identificador único del diagrama |
| `json` | `DiagramState` | Estado completo serializado |
| `version` | - | Control de versiones (solo backend) |
| `updatedAt` | - | Timestamp de modificación |

### **2. DiagramElement (Frontend) ↔ ClassData (Inspector)**

| DiagramElement | ClassData | Descripción |
|----------------|-----------|-------------|
| `id` | `id` | Identificador único |
| `type` | `kind` | Tipo de elemento UML |
| `label` | `name` | Nombre de la clase |
| `attributes` | `attributes` | Lista de atributos |
| `methods` | `methods` | Lista de métodos |

### **3. DiagramLink (Frontend) ↔ LinkData (Inspector)**

| DiagramLink | LinkData | Descripción |
|-------------|----------|-------------|
| `id` | `id` | Identificador único |
| `type` | `kind` | Tipo de relación UML |
| `sourceMultiplicity` | `sourceMultiplicity` | Multiplicidad origen |
| `targetMultiplicity` | `targetMultiplicity` | Multiplicidad destino |
| - | `sourceRole` | Rol del elemento origen |
| - | `targetRole` | Rol del elemento destino |

## 🔄 **Flujo de Datos**

### **Persistencia:**
1. **Frontend** → `DiagramState` → Serialización → `json` → **MongoDB**
2. **MongoDB** → `json` → Deserialización → `DiagramState` → **Frontend**

### **Colaboración en Tiempo Real:**
1. **Usuario A** → Modifica diagrama → **Socket.IO** → **Usuario B**
2. **Socket.IO** → Actualiza `roomState` → **MongoDB** (async)

### **Estado de la Aplicación:**
1. **useDiagramState** → Maneja selección y herramientas
2. **useCollaborationState** → Maneja usuarios conectados y selecciones
3. **useChatbotState** → Maneja sugerencias de IA

## 🏗️ **Arquitectura de Datos**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │DiagramState │  │ClassData    │  │LinkData     │          │
│  │(Estado)     │  │(Inspector)  │  │(Inspector)  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │PeerCursor   │  │PeerSelection│  │ChatSuggestion│          │
│  │(Colaboración)│  │(Colaboración)│  │(IA)        │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    SOCKET.IO SERVER                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │roomState    │  │roomUsers    │  │Real-time    │          │
│  │(Cache)      │  │(Presencia)  │  │Sync         │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │diagramId    │  │json         │  │version      │          │
│  │(String)     │  │(Mixed)      │  │(Number)     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │updatedAt    │  │_id          │  │Indexes      │          │
│  │(Date)       │  │(ObjectId)   │  │(diagramId)  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 📝 **Notas Técnicas**

### **Serialización:**
- El estado completo del diagrama se serializa como JSON de JointJS
- Incluye elementos, enlaces, posiciones, estilos y configuraciones
- Se almacena en MongoDB como `Mixed` type para flexibilidad

### **Control de Versiones:**
- Cada diagrama tiene un `version` que se incrementa en cada modificación
- Permite detectar conflictos en colaboración en tiempo real
- El frontend puede usar esto para resolución de conflictos

### **Colaboración:**
- `roomUsers` mantiene usuarios conectados por diagrama
- `peerCursors` y `peerSelections` para indicadores visuales
- Sincronización en tiempo real vía Socket.IO

### **Rendimiento:**
- Cache en memoria (`roomState`) para acceso rápido
- Persistencia asíncrona a MongoDB
- Índices optimizados para consultas frecuentes
