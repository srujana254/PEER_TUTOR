let ioInstance: any = null;

export function setIo(io: any) {
  ioInstance = io;
}

export function getIo() {
  return ioInstance;
}

// Send notification to specific user
export function sendNotificationToUser(userId: string, notification: any) {
  const io = getIo();
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
}

// Send notification to multiple users
export function sendNotificationToUsers(userIds: string[], notification: any) {
  const io = getIo();
  if (io) {
    userIds.forEach(userId => {
      io.to(`user:${userId}`).emit('notification', notification);
    });
  }
}

// Broadcast to all connected users
export function broadcastNotification(notification: any) {
  const io = getIo();
  if (io) {
    io.emit('notification', notification);
  }
}

// Send session update to participants
export function sendSessionUpdate(sessionId: string, update: any) {
  const io = getIo();
  if (io) {
    io.emit('session_update', { sessionId, ...update });
  }
}