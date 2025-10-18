import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { router as authRoutes } from './routes/auth.routes';
import { router as tutorRoutes } from './routes/tutor.routes';
import { router as sessionRoutes } from './routes/session.routes';
import { router as feedbackRoutes } from './routes/feedback.routes';
import { router as dashboardRoutes } from './routes/dashboard.routes';
import { router as notificationRoutes } from './routes/notification.routes';
import { router as adminRoutes } from './routes/admin.routes';

dotenv.config();

const app = express();
// Configure CORS early so it applies to all routes
const corsOptions = {
  origin: [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'https://peer-frontend-hscj.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('Missing MONGO_URI environment variable. Set MONGO_URI in your .env or environment.');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error', err);
    process.exit(1);
  });

app.get('/', (_req, res) => {
  res.send('✅ Backend is live!');
});
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// NOTE: CORS already configured above via corsOptions; do not re-register here.
const port = Number(process.env.PORT) || 4000;
// default to IPv4 loopback to avoid IPv6-only binding on some Windows setups
const bindHost = process.env.BIND_HOST || '127.0.0.1';
app.listen(port, bindHost, () => {
  console.log(`Server running on http://${bindHost}:${port}`);
  try {
    const os = require('os');
    const ifaces = os.networkInterfaces();
    const addrs: string[] = [];
    Object.values(ifaces).forEach((list: any) => {
      if (!list) return;
      list.forEach((i: any) => { if (i && i.address) addrs.push(i.address); });
    });
    console.log('Available network addresses:', Array.from(new Set(addrs)).join(', '));
  } catch (e) {}
});


