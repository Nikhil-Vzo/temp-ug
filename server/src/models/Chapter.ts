import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ChapterSchema = new Schema({
  chapter_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  course_id: { type: Schema.Types.ObjectId, ref: 'Course', index: true, required: true },
  title: { type: String, required: true },
  
  // Bridge Table Replacement: Ordered Modules
  modules: [{ type: Schema.Types.ObjectId, ref: 'Module' }]
});

export default mongoose.model('Chapter', ChapterSchema);