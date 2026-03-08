import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createSession } from './config/session.js';

import authRoutes from './routes/authRoutes.js';
import serverRoutes from './routes/serverRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import threadRoutes from './routes/threadRoutes.js';
import dmRoutes from './routes/dmRoutes.js';

// Register all Mongoose models on startup
import './models/User.js';
import './models/Server.js';
import './models/Channel.js';
import './models/Message.js';
import './models/Thread.js';
import './models/DirectMessage.js';
import './models/Member.js';
import './models/Role.js';
import './models/Notification.js';
import './models/Kanban.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(createSession());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({ message: 'DevHive API v1' });
});

app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels/:channelId/messages', messageRoutes);
app.use('/api/messages/:messageId/threads', threadRoutes);
app.use('/api/dm', dmRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
});

export default app;