import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISessionRecording extends Document {
  sessionId: Types.ObjectId;
  tutorId: Types.ObjectId;
  studentId: Types.ObjectId;
  recordingUrl: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  status: 'processing' | 'completed' | 'failed';
  metadata: {
    resolution: string;
    format: string;
    quality: string;
  };
}

const SessionRecordingSchema = new Schema<ISessionRecording>({
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  tutorId: { type: Schema.Types.ObjectId, ref: 'TutorProfile', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recordingUrl: { type: String, required: true },
  duration: { type: Number, required: true },
  fileSize: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['processing', 'completed', 'failed'], 
    default: 'processing' 
  },
  metadata: {
    resolution: { type: String, default: '1920x1080' },
    format: { type: String, default: 'mp4' },
    quality: { type: String, default: 'high' }
  }
}, { timestamps: true });

export const SessionRecording = mongoose.model<ISessionRecording>('SessionRecording', SessionRecordingSchema);
