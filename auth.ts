import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "./lib/mongodb"

// DEBUG: Check environment variables
const clientId = (process.env.GOOGLE_CLIENT_ID || "").replace(/\s/g, "");
const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").replace(/\s/g, "");

console.log("---------------------------------------------------");
console.log("DEBUG: GOOGLE_CLIENT_ID Length:", clientId.length);
console.log("DEBUG: GOOGLE_CLIENT_SECRET Length:", clientSecret.length);
console.log("DEBUG: First 5 chars ID:", clientId.substring(0, 5));
console.log("---------------------------------------------------");

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        Google({
            clientId: clientId,
            clientSecret: clientSecret,
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    // Debug log to check keys
    logger: {
        error(code, ...message) {
            console.error(code, message)
        },
        warn(code, ...message) {
            console.warn(code, message)
        },
        debug(code, ...message) {
            console.log(code, message)
        },
    },
    callbacks: {
        async session({ session, user }) {
            // Pass the user's ID and VIP status to the session
            if (session.user) {
                session.user.id = user.id;
                // @ts-ignore - Valid dynamic properties from DB
                session.user.isVip = user.isVip || false;
                // @ts-ignore
                session.user.stripeCustomerId = user.stripeCustomerId;
                // @ts-ignore
                session.user.credits = user.credits || 0;
                // @ts-ignore
                session.user.unlockedTips = user.unlockedTips || [];
            }
            return session
        },
    },
    pages: {
        signIn: '/login', // We will build a custom login page
    },
})
