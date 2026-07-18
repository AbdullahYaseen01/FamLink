import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { MapPin, Lock, Users, Baby } from "lucide-react";
import { api } from "../../../Config/api";

// Pin colors by role. "parent" = a family looking to share (a lead); "nanny" =
// a caregiver. Kept in sync with the legend below.
const PIN_STYLE = {
  parent: { color: "#ffffff", fillColor: "#185FA5", label: "Families" },
  nanny: { color: "#ffffff", fillColor: "#0F6E56", label: "Caregivers" },
};

// Category 4.1 — the live coverage map embedded on the programmatic city /
// neighborhood pages. Shows APPROXIMATE, PII-free pins of real families and
// caregivers near the area (fuzzed server-side). The "conversion barrier" —
// exact locations, contacting anyone, or placing your own pin — is gated behind
// registration, per the ops manual.
export default function NannyShareMap({ center, areaLabel }) {
  const { lat, lng, zoom = 13, radius = 8000 } = center || {};
  const { user } = useSelector((s) => s.auth);
  const isAuthed = user?.type === "Parents" || user?.type === "Nanny";

  const [pins, setPins] = useState([]);
  const [counts, setCounts] = useState({ nannies: 0, parents: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await api.get("/location/map-pins", {
          params: { lat, lng, radius },
        });
        if (cancelled) return;
        setPins(Array.isArray(data?.pins) ? data.pins : []);
        setCounts(data?.counts || { nannies: 0, parents: 0, total: 0 });
      } catch {
        if (!cancelled) {
          setPins([]);
          setCounts({ nannies: 0, parents: 0, total: 0 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lat, lng, radius]);

  // Remount the map when the area changes so it recenters (MapContainer only
  // reads center/zoom on mount).
  const mapKey = useMemo(() => `${lat},${lng},${zoom}`, [lat, lng, zoom]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return (
    <div className="w-full">
      {/* `isolate` contains Leaflet's internal z-indexes (its panes/controls go
          up to ~1000) inside this box, so the map can't paint over the fixed
          header (z-50) or the page's SVG curves. */}
      <div className="relative isolate z-0 rounded-[20px] overflow-hidden border border-gray-200 shadow-sm">
        <div className="h-[380px] sm:h-[460px] w-full">
          <MapContainer
            key={mapKey}
            center={[lat, lng]}
            zoom={zoom}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Soft coverage ring around the area centre. */}
            <Circle
              center={[lat, lng]}
              radius={radius}
              pathOptions={{ color: "#AEC4FF", weight: 1, fillColor: "#AEC4FF", fillOpacity: 0.08 }}
            />

            {pins.map((p, i) => {
              const style = PIN_STYLE[p.type] || PIN_STYLE.parent;
              return (
                <CircleMarker
                  key={i}
                  center={[p.lat, p.lng]}
                  radius={7}
                  pathOptions={{
                    color: style.color,
                    weight: 1.5,
                    fillColor: style.fillColor,
                    fillOpacity: 0.85,
                  }}
                >
                  <Popup>
                    <div className="text-center Livvic" style={{ minWidth: 160 }}>
                      <div className="Livvic-Bold text-[#001243] mb-1">
                        {p.type === "nanny" ? "Caregiver nearby" : "Family looking to share"}
                      </div>
                      <div className="text-[12px] text-gray-500 mb-2">
                        Approximate location{isAuthed ? "" : " · exact area hidden"}
                      </div>
                      {isAuthed ? (
                        <NavLink to="/dashboard" className="text-[#185FA5] Livvic-SemiBold text-[13px]">
                          Browse matches →
                        </NavLink>
                      ) : (
                        <NavLink to="/joinNow" className="text-[#185FA5] Livvic-SemiBold text-[13px]">
                          Sign up free to connect →
                        </NavLink>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Counts card — overlaid top-right (top-left is Leaflet's zoom control). */}
        <div className="absolute top-3 right-3 z-[500] bg-white/95 backdrop-blur rounded-xl shadow-md px-4 py-3 max-w-[220px]">
          <p className="Livvic-Bold text-[#001243] text-sm leading-tight">
            Nanny shares near {areaLabel}
          </p>
          {loading ? (
            <p className="text-gray-400 text-xs mt-1">Loading the map…</p>
          ) : counts.total > 0 ? (
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-[13px] text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIN_STYLE.parent.fillColor }} />
                {counts.parents} families
              </span>
              <span className="flex items-center gap-1.5 text-[13px] text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIN_STYLE.nanny.fillColor }} />
                {counts.nannies} caregivers
              </span>
            </div>
          ) : (
            <p className="text-gray-500 text-xs mt-1">
              Be one of the first in {areaLabel} — add your pin below.
            </p>
          )}
        </div>
      </div>

      {/* Conversion barrier — the gated actions live here. White so it reads as
          a card against the beige section it sits in. */}
      <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#AEC4FF] flex items-center justify-center shrink-0">
            <Lock size={18} className="text-[#001243]" />
          </div>
          <div>
            <p className="Livvic-Bold text-[#001243] text-base leading-snug">
              {isAuthed
                ? "See exact locations and connect"
                : "Sign up free to see who's really near you"}
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mt-0.5">
              Pins show approximate areas only. {isAuthed
                ? "Browse matches to view details and message families and caregivers."
                : "Create a free account to see exact neighborhoods, contact families, and add your own pin to the map."}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {isAuthed ? (
            <NavLink to="/dashboard" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <button className="bg-[#AEC4FF] hover:bg-[#9BB8FF] text-[#001243] Livvic-SemiBold text-sm py-2.5 px-5 rounded-full transition-colors whitespace-nowrap">
                Browse matches
              </button>
            </NavLink>
          ) : (
            <>
              <NavLink to="/find-nanny-share" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                <button className="bg-white border border-gray-200 hover:border-gray-300 text-[#001243] Livvic-SemiBold text-sm py-2.5 px-5 rounded-full transition-colors whitespace-nowrap">
                  Add your pin
                </button>
              </NavLink>
              <NavLink to="/joinNow" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                <button className="bg-[#AEC4FF] hover:bg-[#9BB8FF] text-[#001243] Livvic-SemiBold text-sm py-2.5 px-5 rounded-full transition-colors whitespace-nowrap">
                  Sign up free
                </button>
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* Legend + privacy note */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1.5">
          <Baby size={14} style={{ color: PIN_STYLE.parent.fillColor }} /> Families looking to share
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={14} style={{ color: PIN_STYLE.nanny.fillColor }} /> Caregivers available
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin size={14} /> Pin locations are approximate to protect privacy
        </span>
      </div>
    </div>
  );
}
