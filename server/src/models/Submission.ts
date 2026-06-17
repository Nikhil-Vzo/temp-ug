import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const SubmissionSchema = new Schema({
  submission_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  assignment_id: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  submission_url: { type: String, required: true },
  score: { type: Number },
  remarks: { type: String },
  submitted_at: { type: Date, default: Date.now },
  graded_at: { type: Date }
});

export default mongoose.model('Submission', SubmissionSchema);
