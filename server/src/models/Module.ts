import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ModuleSchema = new Schema({
  module_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  section_id: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true, index: true },
  title: { type: String, required: true },
  activities: [{ type: Schema.Types.ObjectId, ref: 'Activity' }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date }
});

export default mongoose.model('Module', ModuleSchema);
