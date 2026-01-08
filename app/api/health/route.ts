import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import dbConnect from '@/lib/mongoose';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic'; // Ensure this endpoint is never cached

export async function GET() {
    const healthStatus: any = {
        status: 'checking',
        timestamp: new Date().toISOString(),
        env: {
            NODE_ENV: process.env.NODE_ENV,
            MONGO_URI_CONFIGURED: !!process.env.MONGO_URI,
            GOOGLE_CLIENT_ID_CONFIGURED: !!process.env.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET_CONFIGURED: !!process.env.GOOGLE_CLIENT_SECRET,
            PAYSTACK_SECRET_KEY_CONFIGURED: !!process.env.PAYSTACK_SECRET_KEY,
            AUTH_SECRET_CONFIGURED: !!process.env.AUTH_SECRET,
            NEXTAUTH_URL_CONFIGURED: !!process.env.NEXTAUTH_URL,
        },
        database: {
            mongodb_native: 'unknown',
            mongoose: 'unknown'
        }
    };

    // Check MongoDB Native (Used by NextAuth)
    try {
        const client = await clientPromise;
        await client.db().command({ ping: 1 });
        healthStatus.database.mongodb_native = 'connected';
    } catch (error: any) {
        console.error('MongoDB Native Health Check Failed:', error);
        healthStatus.database.mongodb_native = `error: ${error.message}`;
        healthStatus.status = 'unhealthy';
    }

    // Check Mongoose (Used by Application Logic/Paystack)
    try {
        await dbConnect();
        if (mongoose.connection.readyState === 1) {
            healthStatus.database.mongoose = 'connected';
        } else {
            healthStatus.database.mongoose = `state: ${mongoose.connection.readyState}`;
            healthStatus.status = 'unhealthy';
        }
    } catch (error: any) {
        console.error('Mongoose Health Check Failed:', error);
        healthStatus.database.mongoose = `error: ${error.message}`;
        healthStatus.status = 'unhealthy';
    }

    if (healthStatus.status === 'checking') {
        healthStatus.status = 'healthy';
    }

    return NextResponse.json(healthStatus, {
        status: healthStatus.status === 'healthy' ? 200 : 500
    });
}
