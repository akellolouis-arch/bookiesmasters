import mongoose from "mongoose";

const PaymentRequestSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  paymentMethod: { type: String, enum: ['mpesa', 'binance', 'paystack'], required: true },
  screenshotUrl: { type: String }, // Optional for automated payments
  reference: { type: String, unique: true, sparse: true }, // Paystack reference
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.models.PaymentRequest || mongoose.model("PaymentRequest", PaymentRequestSchema);
