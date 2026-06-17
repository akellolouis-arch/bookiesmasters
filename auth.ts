import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import clientPromise from "./lib/mongodb"
import fs from "fs"

// DEBUG: Check environment variables
const clientId = (process.env.GOOGLE_CLIENT_ID || "").replace(/\s/g, "");
const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").replace(/\s/g, "");

console.log("---------------------------------------------------");
console.log("DEBUG: GOOGLE_CLIENT_ID Length:", clientId.length);
console.log("DEBUG: GOOGLE_CLIENT_SECRET Length:", clientSecret.length);
console.log("DEBUG: First 5 chars ID:", clientId.substring(0, 5));
console.log("---------------------------------------------------");

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: process.env.AUTH_SECRET,
    session: { strategy: "jwt" },
    trustHost: true,
    providers: [
        Google({
            clientId: clientId,
            clientSecret: clientSecret,
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    logger: {
        error(err) {
            try {
                fs.appendFileSync('nextauth-error.log', new Date().toISOString() + ': ' + (err?.message || err) + '\n' + (err?.stack || '') + '\n\n');
            } catch (e) {
                console.error("Failed to write to nextauth-error.log", e);
            }
            console.error(err);
        }
    },
    debug: true,
    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                if (!user.email) return false;
                
                const client = await clientPromise;
                const db = client.db('test');
                const users = db.collection('users');
                
                const existingUser = await users.findOne({ email: user.email });
                if (!existingUser) {
                    await users.insertOne({
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        role: user.email === 'emoitakelo@gmail.com' ? 'admin' : 'user',
                        isVip: false,
                        vipExpiry: null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
                return true;
            } catch (err) {
                console.error("NextAuth SignIn DB Error:", err);
                // Allow sign in even if DB connection is slightly delayed or fails
                return true;
            }
        },
        async jwt({ token, user, trigger, session }) {
            // Fetch the latest user info from the database to inject into token
            if (token.email) {
                try {
                    const client = await clientPromise;
                    const db = client.db('test');
                    const dbUser = await db.collection('users').findOne({ email: token.email });
                    
                    if (dbUser) {
                        token.sub = dbUser._id.toString();
                        token.isVip = dbUser.isVip || false;
                        token.role = dbUser.role || 'user';
                        token.vipExpiry = dbUser.vipExpiry || null;
                    }
                } catch (err) {
                    console.error("NextAuth JWT DB fetch Error:", err);
                }
            }
            return token;
        },
        async session({ session, token }) {
            // Pass the token properties to the session
            if (session.user) {
                session.user.id = token.sub as string;
                // @ts-ignore
                session.user.isVip = token.isVip || false;
                // @ts-ignore
                session.user.role = token.role || (session.user.email === 'emoitakelo@gmail.com' ? 'admin' : 'user');
                // @ts-ignore
                session.user.vipExpiry = token.vipExpiry || null;
            }
            return session
        },
    },
    pages: {
        signIn: '/login', // We will build a custom login page
    },
})
