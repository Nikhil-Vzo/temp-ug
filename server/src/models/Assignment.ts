import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const AssignmentSchema = new Schema({
  assignment_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  title: { type: String, required: true },
  instructions: { type: String },
  // Future implementation for AssignmentTaskSubmissions will live here
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Assignment', AssignmentSchema);