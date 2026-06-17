import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ProgressSchema = new Schema({
  progress_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  lesson_id: { type: Schema.Types.ObjectId, ref: 'Activity', required: true, index: true },
  // denormalized for fast course-level aggregations
  course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  started_at: { type: Date, default: Date.now },
  last_position: { type: Number, default: 0 },
  completion_percentage: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completed_at: { type: Date },
  updated_at: { type: Date, default: Date.now }
});

// one progress record per user+lesson pair
ProgressSchema.index({ user_id: 1, lesson_id: 1 }, { unique: true });

export default mongoose.model('Progress', ProgressSchema);
