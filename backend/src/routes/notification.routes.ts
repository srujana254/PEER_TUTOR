import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { listNotifications, markRead, markReadBySession } from '../controllers/notification.controller';

export const router = Router();

router.get('/', requireAuth, listNotifications);
router.post('/:id/read', requireAuth, markRead);
router.post('/session/:sessionId/read', requireAuth, markReadBySession);


