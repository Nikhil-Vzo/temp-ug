import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const CertificateSchema = new Schema({
  certificate_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  certificate_code: { type: String, required: true, unique: true, index: true },
  issued_at: { type: Date, default: Date.now }
});

export default mongoose.model('Certificate', CertificateSchema);
