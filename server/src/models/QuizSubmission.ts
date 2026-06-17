import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const QuizSubmissionSchema = new Schema({
  submission_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  quiz_id: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  score: { type: Number },
  answers: [{
    question_uuid: { type: Schema.Types.UUID },
    selected_option_index: { type: Number }
  }],
  status: { type: String, enum: ['started', 'completed'], default: 'started' },
  passed: { type: Boolean },
  started_at: { type: Date, default: Date.now },
  submitted_at: { type: Date }
});

export default mongoose.model('QuizSubmission', QuizSubmissionSchema);
