import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ChatMessage } from '../models/ChatMessage';
import { Session } from '../models/Session';
import { sendNotificationToUser } from '../lib/socket';

export async function sendMessage(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { sessionId, message, messageType = 'text', fileUrl, fileName, fileSize } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ message: 'Session ID and message required' });
  }

  // Verify session exists and user is participant
  const session = await Session.findById(sessionId);
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const isParticipant = String(session.tutorId) === String(userId) || String(session.studentId) === String(userId);
  if (!isParticipant) {
    return res.status(403).json({ message: 'Not authorized to send messages in this session' });
  }

  // Determine receiver
  const receiverId = String(session.tutorId) === String(userId) ? session.studentId : session.tutorId;

  // Create message
  const chatMessage = await ChatMessage.create({
    sessionId,
    senderId: userId,
    receiverId,
    message,
    messageType,
    fileUrl,
    fileName,
    fileSize
  });

  // Send real-time notification to receiver
  try {
    sendNotificationToUser(String(receiverId), {
      type: 'chat_message',
      title: 'New Message',
      message: message.length > 50 ? message.substring(0, 50) + '...' : message,
      data: { 
        sessionId, 
        messageId: chatMessage._id,
        senderId: userId,
        messageType 
      }
    });
  } catch (e) {
    console.error('Failed to send chat notification:', e);
  }

  res.status(201).json(chatMessage);
}

export async function getMessages(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { sessionId } = req.params;
  const { page = 1, limit = 50 } = req.query;

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
    return res.status(403).json({ message: 'Not authorized to view messages in this session' });
  }

  // Get messages for this session
  const messages = await ChatMessage.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit as string) * 1)
    .skip((parseInt(page as string) - 1) * parseInt(limit as string));

  const total = await ChatMessage.countDocuments({ sessionId });

  res.json({
    messages: messages.reverse(), // Return in chronological order
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}

export async function markAsRead(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { messageId } = req.params;

  const message = await ChatMessage.findOneAndUpdate(
    { _id: messageId, receiverId: userId, read: false },
    { read: true, readAt: new Date() },
    { new: true }
  );

  if (!message) {
    return res.status(404).json({ message: 'Message not found or already read' });
  }

  res.json(message);
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { sessionId } = req.params;

  const result = await ChatMessage.updateMany(
    { sessionId, receiverId: userId, read: false },
    { read: true, readAt: new Date() }
  );

  res.json({ 
    message: 'All messages marked as read', 
    count: result.modifiedCount 
  });
}

export async function getUnreadCount(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { sessionId } = req.params;

  const count = await ChatMessage.countDocuments({ 
    sessionId, 
    receiverId: userId, 
    read: false 
  });

  res.json({ unreadCount: count });
}
