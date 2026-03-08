import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

httpServer.listen(PORT, () => {
  console.log(`[server] running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});