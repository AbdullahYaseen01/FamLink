// Mirrors frontend/src/Config/serviceArea.js ALLOWED_ZIPCODES.
// Keep in sync — landing active vs waitlist is decided server-side from this set.
export const LANDING_ALLOWED_ZIPS = new Set([
  "94601", "94602", "94603", "94605", "94606", "94607", "94608", "94609",
  "94610", "94611", "94612", "94618", "94619", "94621",
  "94702", "94703", "94704", "94705", "94706", "94707", "94708", "94709", "94710",
  "94501", "94502",
  "94577", "94578", "94579",
  "94546", "94552",
  "94803", "94804", "94805",
]);

export const isActiveServiceZip = (zip) => {
  if (!zip) return false;
  return LANDING_ALLOWED_ZIPS.has(String(zip).trim());
};
