
import Image from "next/image";
import { ArrowRight, ArrowLeft } from "lucide-react";


interface Transfer {
    teams: {
        in: { id: number; name: string; logo: string };
        out: { id: number; name: string; logo: string };
    };
    player: { id: number; name: string };
    date: string;
    type: string;
}

interface TransfersListProps {
    transfers: Transfer[];
    currentTeamId: number;
}

export default function TransfersList({ transfers, currentTeamId }: TransfersListProps) {

    if (!transfers || transfers.length === 0) {
        return (
            <div className="p-8 text-center text-neutral-400">
                <p>No recent transfers found.</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-neutral-700">
            {transfers.map((t, idx) => {
                const isIn = t.teams.in.id === currentTeamId;
                const otherTeam = isIn ? t.teams.out : t.teams.in;

                return (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-neutral-700/30 transition-colors">
                        {/* Left: Date & Type */}
                        <div className="w-20 text-xs text-neutral-400">
                            <div className="font-mono">{t.date}</div>
                            <div className={`mt-1 font-bold ${t.type.includes("Free") ? "text-green-400" : "text-white"}`}>
                                {t.type}
                            </div>
                        </div>

                        {/* Middle: Player */}
                        <div className="flex-1 px-4">
                            <div className="font-semibold text-sm text-white truncate">
                                {t.player.name}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-neutral-400 mt-0.5">
                                <span className={isIn ? "text-green-400" : "text-red-400"}>
                                    {isIn ? "IN" : "OUT"}
                                </span>
                                <span className="text-neutral-600">•</span>
                                <span>{otherTeam.name}</span>
                            </div>
                        </div>

                        {/* Right: Logos Flow */}
                        <div className="flex items-center gap-2">
                            {/* From */}
                            <div className="relative w-8 h-8 rounded-full bg-neutral-800 p-1 border border-neutral-600">
                                <Image
                                    src={t.teams.out.logo}
                                    alt={t.teams.out.name}
                                    fill
                                    className="object-contain p-0.5"
                                    unoptimized
                                />
                            </div>

                            <ArrowRight size={14} className="text-neutral-500" />

                            {/* To */}
                            <div className="relative w-8 h-8 rounded-full bg-neutral-800 p-1 border border-neutral-600">
                                <Image
                                    src={t.teams.in.logo}
                                    alt={t.teams.in.name}
                                    fill
                                    className="object-contain p-0.5"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
