import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { 
  sendMessage, 
  getMessages, 
  markAsRead, 
  markAllAsRead, 
  getUnreadCount 
} from '../controllers/chat.controller';

export const router = Router();

router.post('/send', requireAuth, sendMessage);
router.get('/:sessionId', requireAuth, getMessages);
router.post('/:messageId/read', requireAuth, markAsRead);
router.post('/:sessionId/read-all', requireAuth, markAllAsRead);
router.get('/:sessionId/unread-count', requireAuth, getUnreadCount);
