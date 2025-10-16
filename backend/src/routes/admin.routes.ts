import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { listJoinLogs } from '../controllers/admin.controller';

export const router = Router();

router.get('/joinlogs', requireAuth, listJoinLogs);
