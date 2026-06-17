import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const RewardTransactionSchema = new Schema({
  transaction_uuid: { type: Schema.Types.UUID, default: uuidv4, unique: true, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  earned_at: { type: Date, default: Date.now }
});

export default mongoose.model('RewardTransaction', RewardTransactionSchema);
