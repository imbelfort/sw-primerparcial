// Simple Socket.IO server for real-time collaboration
// Runs on port 3001 and supports room-based synchronization by diagramId

const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const PORT = process.env.SOCKET_PORT || 3001;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://root:example@localhost:27017/?authSource=admin';

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST']
  }
});

// In-memory state per room (cache). Persisted to MongoDB.
const roomState = new Map(); // diagramId -> { json: object, version: number, updatedAt: number }

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
});

server.listen(PORT, () => {
  console.log(`[socket] listening on http://localhost:${PORT}`);
});
