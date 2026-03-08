import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`[server] running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
});