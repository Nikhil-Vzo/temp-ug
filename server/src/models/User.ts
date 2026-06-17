import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const UserSchema = new Schema({
  user_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  legacy_id: { type: Schema.Types.BigInt, index: true }, // Safe from JS 53-bit truncation
  email: { type: String, unique: true, index: true, lowercase: true, required: true },
  password: { type: String },
  
  // Consolidating public.userorganization
  memberships: [{
    org_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    role_id: { type: Schema.Types.ObjectId, ref: 'Role' }, // Assuming a Role model exists
    joined_at: { type: Date, default: Date.now }
  }],

  // Consolidating public.apitoken
  api_tokens: [{
    token_prefix: { type: String, index: true },
    token_hash: { type: String, required: true },
    org_id: { type: Schema.Types.ObjectId, ref: 'Organization' }, 
    created_at: { type: Date, default: Date.now }
  }]
});

export default mongoose.model('User', UserSchema);