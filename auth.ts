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
    secret: process.env.AUTH_SECRET,
    trustHost: true,
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
        async session({ session, user, token }) {
            // Pass the user's ID, VIP status, and Role to the session
            if (session.user) {
                // If using database strategy, 'user' is populated. If JWT, 'token' might be used.
                const userId = user?.id || token?.sub;
                const dbUser = user || token;
                
                session.user.id = userId as string;
                // @ts-ignore - Valid dynamic properties from DB
                session.user.isVip = dbUser?.isVip || false;
                // @ts-ignore
                session.user.role = dbUser?.role || (session.user.email === 'emoitakelo@gmail.com' ? 'admin' : 'user');
                // @ts-ignore
                session.user.vipExpiry = dbUser?.vipExpiry || null;
                // @ts-ignore
                session.user.stripeCustomerId = dbUser?.stripeCustomerId;
                // @ts-ignore
                session.user.credits = dbUser?.credits || 0;
                // @ts-ignore
                session.user.unlockedTips = dbUser?.unlockedTips || [];
            }
            return session
        },
    },
    pages: {
        signIn: '/login', // We will build a custom login page
    },
})
