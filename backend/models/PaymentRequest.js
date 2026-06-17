import mongoose from "mongoose";

const PaymentRequestSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  paymentMethod: { type: String, enum: ['mpesa', 'binance'], required: true },
  screenshotUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.models.PaymentRequest || mongoose.model("PaymentRequest", PaymentRequestSchema);
