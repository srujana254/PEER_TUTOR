import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { 
  startRecording, 
  stopRecording, 
  getRecording, 
  listUserRecordings 
} from '../controllers/session-recording.controller';

export const router = Router();

router.post('/:sessionId/start', requireAuth, startRecording);
router.post('/:sessionId/stop', requireAuth, stopRecording);
router.get('/:sessionId', requireAuth, getRecording);
router.get('/', requireAuth, listUserRecordings);
