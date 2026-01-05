import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "./lib/mongodb"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            // Pass the user's ID and VIP status to the session
            if (session.user) {
                session.user.id = user.id;
                // @ts-ignore - Valid dynamic properties from DB
                session.user.isVip = user.isVip || false;
                // @ts-ignore
                session.user.stripeCustomerId = user.stripeCustomerId;
            }
            return session
        },
    },
    pages: {
        signIn: '/login', // We will build a custom login page
    },
})
