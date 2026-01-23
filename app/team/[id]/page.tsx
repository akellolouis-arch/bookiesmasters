
import { getTeamTransfers } from "@/backend/services/transfersService";
import TransfersList from "@/components/TransfersList";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// For now, we only have transfer data. 
// Ideally we would also have getTeamDetails(id) to fetch logo/name separately if not passed,
// but for transfers we get the logo in the transfer objects usually, or we can just try to fetch it.
// Actually, the easiest way is to pass name/logo via query params or fetch basic team info.
// But since this is a clean page, let's try to fetch team info or just display what we have.
// Wait, getTeamTransfers returns a list. We can extract the team name/logo from one of the transfers where teamId matches.

export default async function TeamPage({ params, searchParams }) {
    const { id } = await params;
    const { name, logo } = await searchParams; // Allow passing basic info via URL for speed

    const transfers = await getTeamTransfers(id);

    // Fallback for name/logo if not in URL
    let teamName = name || "Team Details";
    let teamLogo = logo || "/placeholder.png";

    if (!name && transfers.length > 0) {
        // Try to find the team info in the transfer list
        const first = transfers.find(t => t.teams.in.id === Number(id)) || transfers.find(t => t.teams.out.id === Number(id));
        if (first) {
            const teamObj = first.teams.in.id === Number(id) ? first.teams.in : first.teams.out;
            teamName = teamObj.name;
            teamLogo = teamObj.logo;
        }
    }

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-4 pb-20">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/" className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold">Team Profile</h1>
                </div>

                {/* Team Profile Card */}
                <div className="flex flex-col items-center bg-neutral-800 rounded-xl p-6 mb-6 shadow-lg border border-neutral-700">
                    <div className="relative w-24 h-24 mb-4">
                        <Image
                            src={teamLogo}
                            alt={teamName}
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-center">{teamName}</h2>
                    <p className="text-neutral-400 text-sm mt-1">ID: {id}</p>
                </div>

                {/* Transfers Section */}
                <div className="bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700">
                    <div className="p-4 border-b border-neutral-700 bg-neutral-800/50">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            ⚡ Recent Transfers
                        </h3>
                    </div>

                    <div className="p-0">
                        <TransfersList transfers={transfers} currentTeamId={Number(id)} />
                    </div>
                </div>

            </div>
        </div>
    );
}
