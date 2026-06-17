import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const CourseSchema = new Schema({
  course_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  org_id: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, index: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], index: true },
  public: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
  
  // Bridge Table Replacement: Ordered Chapters
  chapters: [{ type: Schema.Types.ObjectId, ref: 'Chapter' }],
  
  // resourceauthor consolidation
  authors: [{
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['instructor', 'contributor'], default: 'instructor' }
  }],
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date }
});

// Composite index mirroring ix_course_org_public_published_created
CourseSchema.index({ org_id: 1, public: 1, published: 1, created_at: -1 });

export default mongoose.model('Course', CourseSchema);