import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const UserGroupSchema = new Schema({
  group_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true },
  org_id: { type: Schema.Types.ObjectId, ref: 'Organization', index: true, required: true },
  name: { type: String, required: true },
  
  // Consolidation of public.usergroupuser
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  
  // Consolidation of public.usergroupresource
  // Stored as UUID strings to support cross-collection resource locking
  resources: [{
    resource_uuid: { type: Schema.Types.UUID, index: true },
    access_type: { type: String, enum: ['read', 'write'], default: 'read' }
  }]
});

export default mongoose.model('UserGroup', UserGroupSchema);