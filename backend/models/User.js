import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true, required: true },
  image: { type: String },
  emailVerified: { type: Date, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  vipExpiry: { type: Date, default: null },
}, { timestamps: true, strict: false });

// Export the model, preventing OverwriteModelError in Next.js development mode
export default mongoose.models.User || mongoose.model("User", UserSchema);
