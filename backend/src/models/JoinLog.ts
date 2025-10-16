import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJoinLog extends Document {
  sessionId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  tokenSnippet?: string;
  ip?: string;
  userAgent?: string;
  createdAt?: Date;
}

const JoinLogSchema = new Schema<IJoinLog>({
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  tokenSnippet: { type: String },
  ip: { type: String },
  userAgent: { type: String }
}, { timestamps: { createdAt: true, updatedAt: false } });

export const JoinLog = mongoose.model<IJoinLog>('JoinLog', JoinLogSchema);
