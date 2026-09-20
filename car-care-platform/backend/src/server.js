import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import './db/init.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import webhookRoutes from './routes/webhooks.js';
import feedbackRoutes from './routes/feedback.js';
import issueRoutes from './routes/issues.js';
import commentRoutes from './routes/comments.js';
import activityRoutes from './routes/activity.js';
import actionItemRoutes from './routes/actionItems.js';
import dashboardRoutes from './routes/dashboard.js';
import locationRoutes from './routes/locations.js';
import userRoutes from './routes/users.js';
import reviewRoutes from './routes/reviews.js';
import reportRoutes from './routes/reports.js';
import notificationRoutes from './routes/notifications.js';
import customerRoutes from './routes/customers.js';

const app = express();
const server = http.createServer(app);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const io = new SocketIOServer(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
});

io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      socket.join(`user:${payload.id}`);
    } catch {
      // ignore invalid token for socket auth; client just won't get targeted notifications
    }
  }
});

global.io = io;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/action-items', actionItemRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/customers', customerRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Car Care Platform API listening on port ${PORT}`);
});
