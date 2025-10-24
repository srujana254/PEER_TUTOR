import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { 
  listNotifications, 
  markRead, 
  markReadBySession, 
  markAllRead, 
  getUnreadCount, 
  deleteNotification, 
  createNotification 
} from '../controllers/notification.controller';

export const router = Router();

router.get('/', requireAuth, listNotifications);
router.get('/unread-count', requireAuth, getUnreadCount);
router.post('/', requireAuth, createNotification);
router.post('/:id/read', requireAuth, markRead);
router.post('/mark-all-read', requireAuth, markAllRead);
router.post('/session/:sessionId/read', requireAuth, markReadBySession);
router.delete('/:id', requireAuth, deleteNotification);


