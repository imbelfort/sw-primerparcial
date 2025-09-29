// Simple Socket.IO server for real-time collaboration
// Runs on port 3001 and supports room-based synchronization by diagramId

const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const PORT = process.env.SOCKET_PORT || process.env.PORT || 3001;
const MONGO_URL = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://root:example@localhost:27017/?authSource=admin';

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          process.env.RENDER_EXTERNAL_URL, 
          process.env.FRONTEND_URL,
          'https://uml-webapp.onrender.com',
          'https://*.onrender.com'
        ]
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
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
  await mongoose.connect(MONGO_URL, { dbName: 'uml' });
}

io.on('connection', (socket) => {
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
          const doc = await Diagram.findOne({ diagramId }).lean();
          if (doc) {
            state = { json: doc.json, version: doc.version, updatedAt: doc.updatedAt?.getTime?.() || Date.now() };
            roomState.set(diagramId, state);
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
        const version = current.version + 1;
        const newState = { json, version, updatedAt: Date.now() };
        roomState.set(diagramId, newState);

        // persist to DB (upsert)
        await ensureDb();
        await Diagram.updateOne(
          { diagramId },
          { $set: { json, version, updatedAt: new Date(newState.updatedAt) } },
          { upsert: true }
        );

        // broadcast to others in the room
        socket.to(diagramId).emit('graph:state', { ...newState, from: clientId });
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
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`[socket] listening on port ${PORT}`);
  console.log(`[socket] environment: ${process.env.NODE_ENV || 'development'}`);
});
