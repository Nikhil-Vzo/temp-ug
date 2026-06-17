import mongoose, { Schema } from 'mongoose';

const WalletSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  balance: { type: Number, default: 0 },
  badges: [{
    badge_name: { type: String, required: true },
    earned_at: { type: Date, default: Date.now }
  }],
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Wallet', WalletSchema);
