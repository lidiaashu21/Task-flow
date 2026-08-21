/** Base URL of the TaskFlow API, e.g. "http://localhost:4000/api" in development. */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/+$/, "");

/** Origin the Socket.IO server is attached to — the API URL minus its "/api" prefix. */
export const WS_BASE_URL = API_BASE_URL.replace(/\/api$/, "");
