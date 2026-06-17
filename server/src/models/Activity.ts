import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ActivitySchema = new Schema({
  activity_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  org_id: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
  title: { type: String, required: true },
  activity_type: { 
    type: String, 
    enum: ['video', 'pdf', 'assignment', 'quiz'], 
    required: true 
  },
  
  // Functional Dependency: Blocks embedded for atomic UI reads
  blocks: [{
    block_uuid: { type: Schema.Types.UUID, default: uuidv4 },
    block_type: { type: String, enum: ['text', 'code', 'video', 'image'], required: true },
    content: { type: Schema.Types.Mixed }, // Maps to PostgreSQL JSONB
    order: { type: Number, required: true }
  }],
  
  assignment_config: { type: Schema.Types.ObjectId, ref: 'Assignment' }
});

export default mongoose.model('Activity', ActivitySchema);