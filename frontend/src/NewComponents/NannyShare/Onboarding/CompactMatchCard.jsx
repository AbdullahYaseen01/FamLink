import React from "react";
import MatchCard from "./MatchCard";

export function CompactMatchCard({ match, className = "" }) {
    if (!match) return null;
    return <MatchCard match={match} compact isInteractive={false} className={className} />;
}

export default CompactMatchCard;
