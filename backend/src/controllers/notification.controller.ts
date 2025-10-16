import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Notification } from '../models/Notification';

export async function listNotifications(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const list = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
  res.json(list);
}

export async function markRead(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  const item = await Notification.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });
  res.json(item);
}

export async function markReadBySession(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { sessionId } = req.params;
  if (!sessionId) return res.status(400).json({ message: 'sessionId required' });
  const q: any = { userId, 'data.sessionId': sessionId };
  await Notification.updateMany(q, { $set: { read: true } });
  const list = await Notification.find(q).sort({ createdAt: -1 }).limit(50);
  res.json(list);
}


