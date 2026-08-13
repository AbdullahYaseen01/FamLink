const STORAGE_KEY = "famlink_landing_onboarding_v1";

export const getLandingFamSession = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.landingSessionToken || !parsed?.onboardingComplete) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const setLandingFamSession = (payload) => {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      onboardingComplete: true,
      landingSessionToken: payload.landingSessionToken,
      profileType: payload.profileType,
      zip: payload.zip || null,
      areaMode: payload.areaMode,
    })
  );
};

export const clearLandingFamSession = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};

export const landingSessionHeaders = () => {
  const session = getLandingFamSession();
  if (!session?.landingSessionToken) return {};
  return { "X-Landing-Session": session.landingSessionToken };
};
