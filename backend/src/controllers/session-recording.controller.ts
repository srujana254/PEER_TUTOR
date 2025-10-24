import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SessionRecording } from '../models/SessionRecording';
import { Session } from '../models/Session';
import { sendNotificationToUser } from '../lib/socket';

export async function startRecording(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { sessionId } = req.params;
  
  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID required' });
  }

  // Verify session exists and user is participant
  const session = await Session.findById(sessionId);
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const isParticipant = String(session.tutorId) === String(userId) || String(session.studentId) === String(userId);
  if (!isParticipant) {
    return res.status(403).json({ message: 'Not authorized to record this session' });
  }

  // Check if recording already exists
  const existingRecording = await SessionRecording.findOne({ sessionId });
  if (existingRecording) {
    return res.status(409).json({ message: 'Recording already exists for this session' });
  }

  // Create recording record
  const recording = await SessionRecording.create({
    sessionId,
    tutorId: session.tutorId,
    studentId: session.studentId,
    recordingUrl: '', // Will be updated when recording is complete
    duration: 0,
    fileSize: 0,
    status: 'processing'
  });

  // Notify both participants
  try {
    sendNotificationToUser(String(session.tutorId), {
      type: 'session_recording_started',
      title: 'Session Recording Started',
      message: 'Recording has been started for your session',
      data: { sessionId, recordingId: recording._id }
    });
    
    sendNotificationToUser(String(session.studentId), {
      type: 'session_recording_started',
      title: 'Session Recording Started',
      message: 'Recording has been started for your session',
      data: { sessionId, recordingId: recording._id }
    });
  } catch (e) {
    console.error('Failed to send recording notifications:', e);
  }

  res.status(201).json(recording);
}

export async function stopRecording(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { sessionId } = req.params;
  const { recordingUrl, duration, fileSize } = req.body;

  if (!sessionId || !recordingUrl) {
    return res.status(400).json({ message: 'Session ID and recording URL required' });
  }

  // Find and update recording
  const recording = await SessionRecording.findOneAndUpdate(
    { sessionId },
    { 
      recordingUrl,
      duration: duration || 0,
      fileSize: fileSize || 0,
      status: 'completed'
    },
    { new: true }
  );

  if (!recording) {
    return res.status(404).json({ message: 'Recording not found' });
  }

  // Notify participants
  try {
    sendNotificationToUser(String(recording.tutorId), {
      type: 'session_recording_completed',
      title: 'Session Recording Available',
      message: 'Your session recording is now available for review',
      data: { sessionId, recordingId: recording._id, recordingUrl }
    });
    
    sendNotificationToUser(String(recording.studentId), {
      type: 'session_recording_completed',
      title: 'Session Recording Available',
      message: 'Your session recording is now available for review',
      data: { sessionId, recordingId: recording._id, recordingUrl }
    });
  } catch (e) {
    console.error('Failed to send recording completion notifications:', e);
  }

  res.json(recording);
}

export async function getRecording(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { sessionId } = req.params;

  const recording = await SessionRecording.findOne({ sessionId });
  if (!recording) {
    return res.status(404).json({ message: 'Recording not found' });
  }

  // Verify user is participant
  const isParticipant = String(recording.tutorId) === String(userId) || String(recording.studentId) === String(userId);
  if (!isParticipant) {
    return res.status(403).json({ message: 'Not authorized to view this recording' });
  }

  res.json(recording);
}

export async function listUserRecordings(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { page = 1, limit = 20 } = req.query;

  const recordings = await SessionRecording.find({
    $or: [{ tutorId: userId }, { studentId: userId }]
  })
  .sort({ createdAt: -1 })
  .limit(parseInt(limit as string) * 1)
  .skip((parseInt(page as string) - 1) * parseInt(limit as string));

  const total = await SessionRecording.countDocuments({
    $or: [{ tutorId: userId }, { studentId: userId }]
  });

  res.json({
    recordings,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}
