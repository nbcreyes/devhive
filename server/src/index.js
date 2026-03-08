import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { createSocketServer } from './config/socket.js';

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);
createSocketServer(httpServer);

async function start() {
  await connectDB();
  await connectRedis();
  httpServer.listen(PORT, () => {
    console.log(`[server] running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

start();