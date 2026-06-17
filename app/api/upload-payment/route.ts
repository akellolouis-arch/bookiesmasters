import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import clientPromise from "@/lib/mongodb";
import PaymentRequest from "@/backend/models/PaymentRequest";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { image, method } = body;

    if (!image || !method) {
      return NextResponse.json({ error: "Image and method are required" }, { status: 400 });
    }

    // Connect to DB via Mongoose if not connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "vip_payments",
    });

    const screenshotUrl = uploadResponse.secure_url;

    // Create DB entry
    const newRequest = await PaymentRequest.create({
      userEmail: session.user.email,
      userName: session.user.name || "Unknown",
      paymentMethod: method,
      screenshotUrl: screenshotUrl,
      status: "pending",
    });

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (error: any) {
    console.error("Payment Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload payment proof" }, { status: 500 });
  }
}
