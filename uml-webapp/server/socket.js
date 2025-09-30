// Simple Socket.IO server for real-time collaboration
// Runs on port 3001 and supports room-based synchronization by diagramId

const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const PORT = process.env.SOCKET_PORT || process.env.PORT || 3001;

// Función para obtener y validar la URL de MongoDB
function getMongoUrl() {
  const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
  
  if (!mongoUrl) {
    console.warn('[socket] No MongoDB URL found, using in-memory storage only');
    return null;
  }
  
  // Validar que la URL tenga el esquema correcto
  if (!mongoUrl.startsWith('mongodb://') && !mongoUrl.startsWith('mongodb+srv://')) {
    console.error('[socket] Invalid MongoDB URL scheme. Expected mongodb:// or mongodb+srv://');
    console.error('[socket] Current URL:', mongoUrl);
    return null;
  }
  
  return mongoUrl;
}

const MONGO_URL = getMongoUrl();

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: true, // Permitir todos los orígenes temporalmente
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// In-memory state per room (cache). Persisted to MongoDB.
const roomState = new Map(); // diagramId -> { json: object, version: number, updatedAt: number }

// Track connected users per room
const roomUsers = new Map(); // diagramId -> Set of socketIds

// Mongo schema/model
const diagramSchema = new mongoose.Schema(
  {
    diagramId: { type: String, index: true, unique: true },
    json: { type: mongoose.Schema.Types.Mixed, required: true },
    version: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
  },
  { collection: 'diagrams' }
);
const Diagram = mongoose.models.Diagram || mongoose.model('Diagram', diagramSchema);

async function ensureDb() {
  if (mongoose.connection.readyState === 1) return;
  
  if (!MONGO_URL) {
    console.log('[socket] MongoDB not configured, using in-memory storage only');
    return;
  }
  
  try {
    console.log('[socket] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL, { dbName: 'uml' });
    console.log('[socket] MongoDB connected successfully');
  } catch (error) {
    console.error('[socket] MongoDB connection error:', error);
    console.log('[socket] Falling back to in-memory storage only');
    // No lanzar error, continuar con almacenamiento en memoria
  }
}

io.on('connection', (socket) => {
  console.log(`[socket] New client connected: ${socket.id}`);
  
  // Manejo de errores del socket
  socket.on('error', (error) => {
    console.error(`[socket] Socket error for ${socket.id}:`, error);
  });
  
  // Join a room for a given diagramId
  socket.on('room:join', ({ diagramId }) => {
    if (!diagramId) return;
    socket.join(diagramId);

    // Track user in room
    if (!roomUsers.has(diagramId)) {
      roomUsers.set(diagramId, new Set());
    }
    roomUsers.get(diagramId).add(socket.id);

    // Notify all users in room about new user
    const userCount = roomUsers.get(diagramId).size;
    io.to(diagramId).emit('room:users', { 
      users: Array.from(roomUsers.get(diagramId)), 
      count: userCount 
    });

    // send current state to the new client (from cache or DB)
    (async () => {
      try {
        let state = roomState.get(diagramId);
        if (!state) {
          await ensureDb();
          // Solo intentar cargar desde DB si MongoDB está disponible
          if (mongoose.connection.readyState === 1) {
            const doc = await Diagram.findOne({ diagramId }).lean();
            if (doc) {
              state = { json: doc.json, version: doc.version, updatedAt: doc.updatedAt?.getTime?.() || Date.now() };
              roomState.set(diagramId, state);
            }
          }
        }
        if (state) {
          socket.emit('graph:state', state);
        }
      } catch (err) {
        console.error('[socket] room:join load error', err);
      }
    })();
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[socket] Client disconnected: ${socket.id}`);
    // Remove user from all rooms
    for (const [diagramId, users] of roomUsers.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        const userCount = users.size;
        
        // Notify remaining users
        io.to(diagramId).emit('room:users', { 
          users: Array.from(users), 
          count: userCount 
        });

        // Clean up empty room
        if (users.size === 0) {
          roomUsers.delete(diagramId);
        }
        break;
      }
    }
  });

  // Receive full graph JSON updates (naive approach)
  socket.on('graph:update', ({ diagramId, json, clientId }) => {
    if (!diagramId || !json) return;

    (async () => {
      try {
        const current = roomState.get(diagramId) || { json: null, version: 0 };
        
        // Verificar si el JSON es realmente diferente para evitar bucles
        const currentJsonString = JSON.stringify(current.json);
        const newJsonString = JSON.stringify(json);
        
        if (currentJsonString === newJsonString) {
          console.log('[socket] Ignoring identical JSON update from', clientId);
          return;
        }
        
        const version = current.version + 1;
        const newState = { json, version, updatedAt: Date.now() };
        roomState.set(diagramId, newState);

        // persist to DB (upsert) - solo si MongoDB está disponible
        await ensureDb();
        if (mongoose.connection.readyState === 1) {
          await Diagram.updateOne(
            { diagramId },
            { $set: { json, version, updatedAt: new Date(newState.updatedAt) } },
            { upsert: true }
          );
        }

        // broadcast to others in the room (exclude sender)
        socket.to(diagramId).emit('graph:state', { ...newState, from: clientId });
        
        console.log('[socket] Graph updated by', clientId, 'version', version);
      } catch (err) {
        console.error('[socket] graph:update persist error', err);
      }
    })();
  });

  // Cursor/selection sharing (optional)
  socket.on('cursor', ({ diagramId, cursor, clientId }) => {
    if (!diagramId) return;
    socket.to(diagramId).emit('cursor', { cursor, clientId });
  });

  // Selection sharing - when user selects/deselects elements
  socket.on('selection', ({ diagramId, selection, clientId }) => {
    if (!diagramId) return;
    socket.to(diagramId).emit('selection', { selection, clientId });
  });
});

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    }));
    return;
  }
  // Para todas las demás rutas, no responder (dejar que Socket.IO maneje)
});

server.listen(PORT, () => {
  console.log(`[socket] listening on port ${PORT}`);
  console.log(`[socket] environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[socket] MongoDB URI: ${MONGO_URL ? 'configured' : 'not configured'}`);
  console.log(`[socket] Storage mode: ${MONGO_URL ? 'MongoDB + in-memory' : 'in-memory only'}`);
  console.log(`[socket] CORS origin: ${process.env.NODE_ENV === 'production' ? 'all origins' : 'localhost only'}`);
});

// Manejo de errores del servidor
server.on('error', (error) => {
  console.error('[socket] Server error:', error);
});

// Manejo de errores de Socket.IO
io.on('error', (error) => {
  console.error('[socket] Socket.IO error:', error);
});
