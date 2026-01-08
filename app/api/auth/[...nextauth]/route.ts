import { handlers } from "@/auth"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
    try {
        console.log("DEBUG: GET /api/auth hit");
        return await handlers.GET(req);
    } catch (e: any) {
        console.error("DEBUG: Auth GET Error:", e);
        return new Response(e.message || "Auth Error", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        console.log("DEBUG: POST /api/auth hit");
        return await handlers.POST(req);
    } catch (e: any) {
        console.error("DEBUG: Auth POST Error:", e);
        return new Response(e.message || "Auth Error", { status: 500 });
    }
}
