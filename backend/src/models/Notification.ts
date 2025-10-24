import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'session_booked' | 'session_cancelled' | 'session_completed' | 'session_started' | 'session_reminder' | 'feedback_received' | 'tutor_available' | 'system_announcement';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'session' | 'feedback' | 'system' | 'reminder';
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['session_booked', 'session_cancelled', 'session_completed', 'session_started', 'session_reminder', 'feedback_received', 'tutor_available', 'system_announcement'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  category: { 
    type: String, 
    enum: ['session', 'feedback', 'system', 'reminder'], 
    required: true 
  },
}, { timestamps: true });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);


