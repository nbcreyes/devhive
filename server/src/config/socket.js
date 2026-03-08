import { Server } from 'socket.io';

/**
 * @type {import('socket.io').Server}
 */
let io;

/**
 * Initializes Socket.io on the HTTP server.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
export function createSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Returns the initialized Socket.io instance.
 * Call this anywhere in the server to emit events.
 * @returns {import('socket.io').Server}
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized — call createSocketServer first');
  }
  return io;
}