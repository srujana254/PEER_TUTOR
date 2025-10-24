import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChatMessage extends Document {
  sessionId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  message: string;
  messageType: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  read: boolean;
  readAt?: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  messageType: { 
    type: String, 
    enum: ['text', 'file', 'image', 'system'], 
    default: 'text' 
  },
  fileUrl: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  read: { type: Boolean, default: false },
  readAt: { type: Date }
}, { timestamps: true });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
