// src/config/api.ts
export const BASE_URL = "https://dxn479xqd0.execute-api.us-east-1.amazonaws.com/prod";

export const API = {
  register: BASE_URL + "/register",
  feed: BASE_URL + "/feed",
  todos: BASE_URL + "/todos",
  todosDone: BASE_URL + "/todos/done",
  chat: BASE_URL + "/chat",
  profile: BASE_URL + "/profile",
  settings: BASE_URL + "/settings",
  whatsappPair: BASE_URL + "/whatsapp/pair",
  whatsappResend: BASE_URL + "/whatsapp/resend",       // POST — triggers resend, returns { status: "processing" }
  whatsappPairingStatus: BASE_URL + "/whatsapp/pairing-status", // GET — poll for new pairing code
  whatsappStatus: BASE_URL + "/whatsapp/status",
  whatsappGroups: BASE_URL + "/whatsapp/groups",
  deleteAccount: BASE_URL + "/profile",   // method: DELETE
  sync: BASE_URL + "/sync",
  syncDemo: BASE_URL + "/sync-demo",      // POST — demo Gmail+Classroom sync (hardcoded messages)
  googleToken: BASE_URL + "/google/token",
} as const;