/**
 * Every backend address the frontend uses comes from here, which in turn comes from `.env.local`
 * (NEXT_PUBLIC_API_URL, and optionally NEXT_PUBLIC_WS_URL). Nothing else in the app hardcodes a URL.
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. Add it to Frontend/.env.local, e.g. NEXT_PUBLIC_API_URL=https://your-backend.example.com/api"
  );
}

/** Base URL of the TaskFlow REST API (includes the "/api" prefix, no trailing slash). */
export const API_BASE_URL = apiUrl.replace(/\/+$/, "");

/**
 * Origin the Socket.IO server is attached to. Defaults to the API URL minus its "/api" prefix;
 * set NEXT_PUBLIC_WS_URL only if the socket server lives somewhere else.
 */
export const WS_BASE_URL = (process.env.NEXT_PUBLIC_WS_URL ?? API_BASE_URL.replace(/\/api$/, "")).replace(/\/+$/, "");
