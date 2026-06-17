import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const OrganizationSchema = new Schema({
  organization_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true },
  slug: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  explore: { type: Boolean, default: false, index: true }
});

export default mongoose.model('Organization', OrganizationSchema);