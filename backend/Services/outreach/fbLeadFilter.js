/** Unified_Pipeline_Spec Stage 2 — drop rules + category names. Not used by the website. */

export const AI_PROMPT = `You are a highly accurate data classifier. Analyze the provided Facebook profile data.
Categorize into ONE of:
1. "Mom / Parent": mentions children, family, seeking care, or parental leave. Do not assume from group name alone.
2. "Caregiver / Nanny": nanny, babysitter, au pair, CPR certified, or seeking care employment.
3. "Share Candidate (Nanny Share)": seeking another family to split costs, "nanny share", or shared-care scheduling.
4. "Unknown / General": legitimate profile, not enough context. MUST keep (status: "keep"). Do not drop for lacking context.
5. "Drop" if ANY of:
   - Incomplete / placeholder names (User123, A B, initials only, Test Account).
   - No profile picture OR a default grey Facebook silhouette.
   - Fewer than 50 friends when friendCount is provided.
   - Company / agency / daycare / corporate nanny agency names (normal job titles are fine).
   - Suspicious names / scam (random numbers, excessive emojis, spam syntax).
   - Recently created: memberSince is "Joined today" or "Joined this week" only.

Also extract location, zone_status (In-Zone if SF Bay Area else Outside-Zone else Unknown), children_age.

Return ONLY JSON:
{"status":"keep"|"drop","category":"Mom / Parent"|"Caregiver / Nanny"|"Share Candidate (Nanny Share)"|"Unknown / General","context_clues":"...","location":"","zone_status":"Unknown","children_age":""}`;

export const CSV_HEADER = [
  { id: "Name", title: "Name" },
  { id: "ProfileURL", title: "Profile URL" },
  { id: "Category", title: "Category" },
  { id: "Location", title: "Location" },
  { id: "ZoneStatus", title: "Zone Status" },
  { id: "ChildrenAge", title: "Children Age" },
  { id: "ContextClues", title: "Context Clues" },
];

export function friendCountOf(record) {
  const raw =
    record.friendCount ??
    record.friendsCount ??
    record.friends ??
    record.numberOfFriends ??
    record.FriendCount;
  if (raw === undefined || raw === null || raw === "") return null;
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export function isDefaultFacebookPhoto(url) {
  if (!url || typeof url !== "string") return true;
  const u = url.toLowerCase().trim();
  if (!u.startsWith("http")) return true;
  if (u.includes("silhouette") || u.includes("default-profile") || u.includes("default_profile")) return true;
  if (u.includes("rsrc.php")) return true;
  if (u.includes("/t1.30497-1/")) return true;
  if (u.includes("static.xx.fbcdn.net") && (u.includes("/images/") || u.includes("/rsrc.php"))) return true;
  return false;
}

export function parseLead(record) {
  return {
    name: record.name || record.Name || "Unknown",
    profileURL:
      record.profileURL ||
      record.profileUrl ||
      record.ProfileUrl ||
      record["Profile Url"] ||
      record["profileUrl"] ||
      record["Profile URL"] ||
      "",
    additionalData: record.additionalData || record.bio || record.job || record.description || "No extra info provided",
    profilePicture: record.profilePicture || record.imageURL || record.imageUrl || "",
    memberSince: record.memberSince || "",
    groupName: record.groupName || "",
    friendCount: friendCountOf(record),
  };
}

export function dropBeforeAI(lead) {
  const name = lead.name;
  const hasNumbers = /\d/.test(name);
  const isPlaceholder = name.length <= 3 || name.toLowerCase().includes("test");
  if (name === "Unknown" || !lead.profileURL || name.split(" ").length < 2 || hasNumbers || isPlaceholder) {
    return "Incomplete name, placeholder, or missing Profile URL";
  }
  if (isDefaultFacebookPhoto(lead.profilePicture)) {
    return "No photo or default Facebook silhouette";
  }
  if (lead.friendCount !== null && lead.friendCount < 50) {
    return `Low friend count (${lead.friendCount})`;
  }
  return null;
}

export function specCategory(aiCategory) {
  const c = String(aiCategory || "");
  if (/share/i.test(c)) return "Share Candidate (Nanny Share)";
  if (/caregiver|nanny/i.test(c) && !/share/i.test(c)) return "Caregiver / Nanny";
  if (/parent|mom/i.test(c)) return "Mom / Parent";
  if (/unknown|general/i.test(c)) return "Unknown / General";
  return "Unknown / General";
}

export function bucketOf(category) {
  if (category.includes("Share")) return "nannyShares";
  if (category.includes("Caregiver")) return "caregivers";
  if (category.includes("Parent") || category.includes("Mom")) return "parents";
  return "unknowns";
}

export function toCsvRow(lead, ai) {
  return {
    Name: lead.name,
    ProfileURL: lead.profileURL,
    Category: specCategory(ai.category),
    Location: ai.location || "",
    ZoneStatus: ai.zone_status || "Unknown",
    ChildrenAge: ai.children_age || "",
    ContextClues: ai.context_clues,
  };
}

export function capBatch(leads, max = 5000) {
  if (!Array.isArray(leads)) return [];
  if (leads.length <= max) return leads;
  console.log(`Pipeline batch cap: processing ${max} of ${leads.length} (spec ~4–5k per group).`);
  return leads.slice(0, max);
}
