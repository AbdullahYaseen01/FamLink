import { useEffect, useState } from "react";
import { BACKEND_API_URL } from "../Config/url";
import { isCompatible, variantToShareType } from "./matchesCompatibility";

const markPreviewCards = (rows) =>
  (rows || []).slice(0, 3).map((m, i) => ({
    ...m,
    blurred: i === 2,
    delay: `delay-[${i * 80}ms]`,
  }));

export async function fetchOnboardingPreviewMatches({ coordinates, viewerType }) {
  const lng = Number(coordinates?.[0]);
  const lat = Number(coordinates?.[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || !viewerType) return [];
  try {
    const res = await fetch(`${BACKEND_API_URL}/share/preview-matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: [lng, lat], viewerType, radiusMiles: 10 }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export function useOnboardingPreviewMatches({ coordinates, viewerType, fallback = [] }) {
  const compatibleFallback = fallback.filter((m) =>
    isCompatible(viewerType, variantToShareType(m.variant))
  );
  const [cards, setCards] = useState(() => markPreviewCards(compatibleFallback));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const live = await fetchOnboardingPreviewMatches({ coordinates, viewerType });
      if (cancelled) return;
      const seen = new Set();
      const merged = [];
      for (const row of [...live, ...compatibleFallback]) {
        const key = String(row.id || row.name);
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(row);
        if (merged.length === 3) break;
      }
      setCards(markPreviewCards(merged));
    })();
    return () => {
      cancelled = true;
    };
  }, [coordinates?.[0], coordinates?.[1], viewerType]);

  return cards;
}
