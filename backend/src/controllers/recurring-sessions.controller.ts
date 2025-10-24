import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Session } from '../models/Session';
import { sendNotificationToUser } from '../lib/socket';

export async function createRecurringSessions(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { 
    tutorId, 
    subject, 
    scheduledAt, 
    durationMinutes, 
    notes, 
    recurringPattern, 
    recurringEndDate, 
    numberOfSessions 
  } = req.body;

  if (!tutorId || !subject || !scheduledAt || !durationMinutes || !recurringPattern) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Validate recurring pattern
  const validPatterns = ['daily', 'weekly', 'biweekly', 'monthly'];
  if (!validPatterns.includes(recurringPattern)) {
    return res.status(400).json({ message: 'Invalid recurring pattern' });
  }

  // Calculate session dates
  const sessionDates = calculateRecurringDates(
    new Date(scheduledAt),
    recurringPattern,
    numberOfSessions || 10,
    new Date(recurringEndDate)
  );

  if (sessionDates.length === 0) {
    return res.status(400).json({ message: 'No valid session dates could be generated' });
  }

  // Create sessions
  const sessions: any[] = [];
  let parentSessionId: any = null;

  for (let i = 0; i < sessionDates.length; i++) {
    const sessionData: any = {
      tutorId,
      studentId: userId,
      subject,
      scheduledAt: sessionDates[i],
      durationMinutes,
      notes,
      isRecurring: true,
      recurringPattern,
      recurringEndDate: new Date(recurringEndDate),
      parentSessionId: i === 0 ? null : parentSessionId,
      recurringSessionNumber: i + 1
    };

    const session: any = await Session.create(sessionData);
    sessions.push(session);

    // Set parent session ID for subsequent sessions
    if (i === 0) {
      parentSessionId = session._id;
      await Session.findByIdAndUpdate(session._id, { parentSessionId: session._id });
    }
  }

  // Send notifications
  try {
    sendNotificationToUser(String(tutorId), {
      type: 'recurring_sessions_created',
      title: 'Recurring Sessions Created',
      message: `${sessions.length} recurring sessions have been created for ${subject}`,
      data: { 
        sessionCount: sessions.length, 
        subject, 
        recurringPattern,
        firstSessionId: sessions[0]._id
      }
    });
  } catch (e) {
    console.error('Failed to send recurring sessions notification:', e);
  }

  res.status(201).json({
    message: 'Recurring sessions created successfully',
    sessions,
    count: sessions.length
  });
}

export async function getRecurringSessions(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { parentSessionId } = req.params;

  const sessions = await Session.find({
    $or: [
      { parentSessionId, tutorId: userId },
      { parentSessionId, studentId: userId }
    ]
  }).sort({ scheduledAt: 1 });

  res.json(sessions);
}

export async function cancelRecurringSessions(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { parentSessionId } = req.params;

  // Find all sessions in the recurring series
  const sessions = await Session.find({
    $or: [
      { parentSessionId, tutorId: userId },
      { parentSessionId, studentId: userId }
    ]
  });

  if (sessions.length === 0) {
    return res.status(404).json({ message: 'No recurring sessions found' });
  }

  // Cancel future sessions only
  const now = new Date();
  const futureSessions = sessions.filter(session => new Date(session.scheduledAt) > now);

  const result = await Session.updateMany(
    { 
      _id: { $in: futureSessions.map(s => s._id) },
      status: 'scheduled'
    },
    { status: 'cancelled' }
  );

  res.json({
    message: 'Recurring sessions cancelled',
    cancelledCount: result.modifiedCount
  });
}

function calculateRecurringDates(
  startDate: Date,
  pattern: string,
  maxSessions: number,
  endDate?: Date
): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  const finalEndDate = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

  let intervalDays = 1;
  switch (pattern) {
    case 'daily':
      intervalDays = 1;
      break;
    case 'weekly':
      intervalDays = 7;
      break;
    case 'biweekly':
      intervalDays = 14;
      break;
    case 'monthly':
      intervalDays = 30;
      break;
  }

  for (let i = 0; i < maxSessions && currentDate <= finalEndDate; i++) {
    dates.push(new Date(currentDate));
    
    if (pattern === 'monthly') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }
  }

  return dates;
}
