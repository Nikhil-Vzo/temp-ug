import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const EnrollmentSchema = new Schema({
  enrollment_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  enrolled_at: { type: Date, default: Date.now }
});

// prevent duplicate enrollments
EnrollmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

export default mongoose.model('Enrollment', EnrollmentSchema);
