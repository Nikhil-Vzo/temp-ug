import mongoose, { Schema, Document } from 'mongoose';
import { SYSTEM_ROLES, type SystemRole } from '../core/constants/roles.js';

export interface IRole extends Document {
  name: SystemRole;
  description: string;
  // Future-proofing: You can add granular permissions here later
  // e.g., permissions: ['create_course', 'delete_user', 'view_billing']
  permissions: string[]; 
}

const RoleSchema = new Schema<IRole>({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    enum: Object.values(SYSTEM_ROLES) // Locks the DB to only allow our predefined roles
  },
  description: { 
    type: String, 
    default: '' 
  },
  permissions: [{ 
    type: String 
  }]
}, { timestamps: true });

export default mongoose.model<IRole>('Role', RoleSchema);