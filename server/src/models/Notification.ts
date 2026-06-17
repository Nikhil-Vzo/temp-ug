import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const NotificationSchema = new Schema({
  notification_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Notification', NotificationSchema);
