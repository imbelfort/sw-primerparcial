import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { Socket as NetSocket } from 'net';
import mongoose from 'mongoose';

interface SocketServer extends NetServer {
  io?: SocketIOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends Response {
  socket: SocketWithIO;
}

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
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  await mongoose.connect(mongoUri, { dbName: 'uml' });
}

export async function GET(req: NextRequest) {
  const res = new Response();
  
  if (!(res as any).socket?.server?.io) {
    console.log('Setting up Socket.IO server...');
    
    const httpServer: SocketServer = (res as any).socket.server;
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL 
          : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Join a room for a given diagramId
      socket.on('room:join', ({ diagramId }) => {
        if (!diagramId) return;
        socket.join(diagramId);

        // Track user in room
        if (!roomUsers.has(diagramId)) {
          roomUsers.set(diagramId, new Set());
        }
        roomUsers.get(diagramId)!.add(socket.id);

        // Notify all users in room about new user
        const userCount = roomUsers.get(diagramId)!.size;
        io.to(diagramId).emit('room:users', { 
          users: Array.from(roomUsers.get(diagramId)!), 
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
                state = { 
                  json: doc.json, 
                  version: doc.version, 
                  updatedAt: doc.updatedAt?.getTime?.() || Date.now() 
                };
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
        console.log('Client disconnected:', socket.id);
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

    (res as any).socket.server.io = io;
  }

  return res;
}
