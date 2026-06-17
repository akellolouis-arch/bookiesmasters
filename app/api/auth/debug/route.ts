import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        AUTH_SECRET_EXISTS: !!process.env.AUTH_SECRET,
        AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length || 0,
        GOOGLE_CLIENT_ID_EXISTS: !!process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET_EXISTS: !!process.env.GOOGLE_CLIENT_SECRET,
        AUTH_URL_EXISTS: !!process.env.AUTH_URL,
        AUTH_URL_VALUE: process.env.AUTH_URL || "NOT_SET",
        MONGO_URI_EXISTS: !!process.env.MONGO_URI,
        NODE_ENV: process.env.NODE_ENV,
    });
}
