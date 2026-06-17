import mongoose, { Schema, Document } from 'mongoose';

export interface IOrgConfig extends Document {
  org_id: mongoose.Types.ObjectId;
  branding: {
    logo_url?: string;
    primary_color?: string;
    custom_domain?: string;
  };
  features: {
    enable_public_registration: boolean;
    enable_gamification: boolean;
    require_sso: boolean;
  };
  integrations: {
    // ⬇️ Updated for Razorpay ⬇️
    razorpay_customer_id?: string; // If you (the platform) are billing the Org
    razorpay_linked_account_id?: string; // If the Org is receiving payouts (Razorpay Route)
    zoom_api_key?: string;
  };
  limits: {
    max_users: number;
    storage_quota_mb: number;
  };
}

const OrgConfigSchema = new Schema<IOrgConfig>({
  org_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    unique: true 
  },
  
  branding: {
    logo_url: { type: String },
    primary_color: { type: String, default: '#000000' },
    custom_domain: { type: String, index: true }
  },

  features: {
    enable_public_registration: { type: Boolean, default: false },
    enable_gamification: { type: Boolean, default: true },
    require_sso: { type: Boolean, default: false }
  },

  integrations: {
    // ⬇️ Updated for Razorpay ⬇️
    razorpay_customer_id: { type: String, index: true },
    razorpay_linked_account_id: { type: String },
    zoom_api_key: { type: String }
  },

  limits: {
    max_users: { type: Number, default: 100 },
    storage_quota_mb: { type: Number, default: 5000 } 
  }
}, { timestamps: true });

export default mongoose.model<IOrgConfig>('OrgConfig', OrgConfigSchema);