import React, { useMemo } from "react";
import { AlertTriangle } from "lucide-react";

export default function CorporateAlertsTicker({ players, matches }) {
    const alerts = useMemo(() => {
        const msgs = [
            "MANDATORY: All pods must submit Q4 synergy reports by EOD",
            "COMPLIANCE: Idle terminals will be flagged for review",
            "NOTICE: Executive dashboards are now monitored in real time",
        ];

        if (players && players.length > 0) {
            const sorted = [...players].sort((a, b) => b.goalsFor - a.goalsFor);
            const top = sorted[0];
            const bottom = sorted[sorted.length - 1];

            if (top) msgs.push(`BREAKING: ${top.team} Q4 yield exceeds projections by ${top.goalsFor * 25}%. HR investigation pending.`);
            if (bottom) msgs.push(`ALERT: ${bottom.team} synergy output critically low. Mandatory 1:1s scheduled.`);
            if (top) msgs.push(`${top.name} (${top.team}) promoted to "Senior Yield Architect" after ${top.goalsFor}G performance.`);
            if (bottom) msgs.push(`${bottom.name} (${bottom.team}) placed on "Performance Improvement Plan" after ${bottom.goalsFor}G performance.`);
            
            const midPlayer = sorted[Math.floor(sorted.length / 2)];
            if (midPlayer) msgs.push(`REORG: ${midPlayer.team} pod restructured. ${midPlayer.name} reassigned to cross-functional initiatives.`);
        }

        const completed = matches?.filter(m => m.status === 'COMPLETED') || [];

        if (completed.length > 0) {
            const last = completed[completed.length - 1];

            if (last.hScore > last.aScore) {
                msgs.push(`SPRINT CLOSED: ${last.homeName || 'Home'} delivered ${last.hScore}-${last.aScore} over ${last.awayName || 'Away'}. Velocity metrics updated.`);
            } else if (last.aScore > last.hScore) {
                msgs.push(`SPRINT CLOSED: ${last.awayName || 'Away'} outperformed ${last.homeName || 'Home'} ${last.aScore}-${last.hScore}. Resource reallocation recommended.`);
            } else {
                msgs.push(`SPRINT DEADLOCK: ${last.homeName || 'Home'} vs ${last.awayName || 'Away'} ended ${last.hScore}-${last.aScore}. Escalating to VP.`);
            }
        }

        msgs.push("REMINDER: Return-to-Office compliance is non-negotiable. Badge-in data is being reviewed.");
        msgs.push("AI ORACLE: Next-gen predictive models now active. Your performance is being bencmarked.");

        return msgs;
    }, [players, matches]);

    const tickerText = alerts.join('   ///   ');
};

return (
    <div className="fixed bottom-0 left-0 right-0 z-[900] bg-black border-t-4 border-yellow-400 overflow-hidden h-10 flex items-center">
        <div className="flex items-center gap-2 bg-yellow-400 text-black px-3 h-full font-black text-xs uppercase tracking-wider shrink-0 border-r-4 border-black z-10">
            <AlertTriangle size={14}/>
            LIVE
        </div>
        <div className="ticker-scroll whitespace-nowrap text-white text-xs font-mono font-bold tracking-wide">
            <span className="inline-block ticker-content">{tickerText}   ///   {tickerText}</span>
        </div>
    </div>
)