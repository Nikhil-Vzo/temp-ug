import mongoose, { Schema } from 'mongoose';

const ActivityVersionSchema = new Schema({
  activity_id: { type: Schema.Types.ObjectId, ref: 'Activity', index: true, required: true },
  version_number: { type: Number, required: true }, 
  state_snapshot: { type: Schema.Types.Mixed, required: true },
  change_log: { type: String },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// Ensures efficient lookups for the latest version of a specific activity
ActivityVersionSchema.index({ activity_id: 1, version_number: -1 });

export default mongoose.model('ActivityVersion', ActivityVersionSchema);