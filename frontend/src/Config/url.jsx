// Production fallback so a missing Vercel env does not leave axios with an
// undefined baseURL (relative calls to famlink.care → HTML → broken login).
export const BACKEND_API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://backend-bitter-shape-3085.fly.dev";
