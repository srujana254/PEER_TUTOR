import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { JoinLog } from '../models/JoinLog';

export async function listJoinLogs(req: AuthRequest, res: Response) {
  // TODO: add admin check; for now requireAuth
  const logs = await JoinLog.find({}).sort({ createdAt: -1 }).limit(200).populate('sessionId').populate('userId');
  res.json(logs);
}
