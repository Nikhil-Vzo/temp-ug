import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const QuestionSchema = new Schema({
  question_uuid: { type: Schema.Types.UUID, default: uuidv4 },
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correct_option_index: { type: Number, required: true }
});

const QuizSchema = new Schema({
  quiz_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  lesson_id: { type: Schema.Types.ObjectId, ref: 'Activity', required: true, index: true },
  title: { type: String, required: true },
  passing_score: { type: Number, default: 70 },
  questions: [QuestionSchema],
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Quiz', QuizSchema);
