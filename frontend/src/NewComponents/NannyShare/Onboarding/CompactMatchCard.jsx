import React from "react";
import { ShareTypeBadge } from "../../../Config/shareTypeTheme";
import { Clock, MapPin } from "lucide-react";

export function CompactMatchCard({ match, className = "" }) {
    if (!match) return null;

    // Build subtitle from headingParts (e.g. "1 Child • 14 months" or "5 Years Exp")
    const subtitle = match.headingParts ? match.headingParts.join(" • ") : "";

    // Extract initials
    const initials = match.name
        ? match.name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '';

    return (
        <div className={`
            bg-white border border-[#ECECEC] rounded-2xl overflow-hidden
            flex items-center gap-4 px-4 py-3 min-w-[300px] w-full max-w-[320px] shadow-sm text-left
            ${className}
        `}>
            <div className="flex-shrink-0 w-[60px] h-[60px] rounded-[14px] bg-[#D8E2FF] text-[#001243] flex items-center justify-center text-[22px] font-black Livvic-Bold">
                {initials}
            </div>

            {/* RIGHT: Info */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden text-left items-start">
                {/* Badge */}
                <div className="mb-1 flex min-w-0 w-full">
                    <ShareTypeBadge variant={match.variant} className="max-w-full !shrink [&>span:last-child]:truncate" />
                </div>
                
                {/* Name */}
                <h3 className="text-[17px] font-black Livvic-Bold text-[#001243] leading-tight truncate mb-0.5">
                    {match.name}
                </h3>
                
                {/* Subtitle */}
                {subtitle && (
                    <p className="text-[13px] text-[#5D5D5D] Livvic-SemiBold truncate m-0 mb-2">
                        {subtitle}
                    </p>
                )}

                {/* Bottom Row: Schedule & Location */}
                <div className="flex items-start gap-4">
                    {/* Schedule */}
                    <div className="flex items-start gap-1 min-w-0">
                        <Clock size={14} className="text-[#001243] flex-shrink-0 mt-[2px]" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-black Livvic-Bold text-[#001243] truncate">
                                {match.schedule || "Flexible"}
                            </span>
                            <span className="text-[11px] text-[#5D5D5D] Livvic truncate">
                                {match.scheduleDetail || "Mon-Fri"}
                            </span>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-1 min-w-0">
                        <MapPin size={14} className="text-[#C4A86A] flex-shrink-0 mt-[2px]" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-black Livvic-Bold text-[#001243] truncate">
                                {match.location?.neighborhood || match.location?.city || "Bay Area"}
                            </span>
                            <span className="text-[11px] text-[#5D5D5D] Livvic truncate">
                                {match.location?.city || "Bay Area"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CompactMatchCard;
