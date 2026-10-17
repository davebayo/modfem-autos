// Centralized environment-driven configuration. NEXT_PUBLIC_* vars are safe
// to read from both client and server code — Next.js inlines them into the
// client bundle at build time and leaves server-side process.env reads
// untouched, so this single source of truth works everywhere without
// duplicating fallback values across files.

// Dealer's WhatsApp dispatch number, digits only with country code (e.g.
// "2348012345678" or "14165551234") — no "+", spaces, or dashes. Falls back
// to an obviously-fake placeholder number when unset so dev/demo builds
// never accidentally dispatch to a real line.
export const DEALER_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_DEALER_WHATSAPP || "15550123456";

// Fallback CAD -> NGN exchange rate used whenever /api/fx is unreachable.
export const DEFAULT_FX_RATE_NGN_PER_CAD =
  Number(process.env.NEXT_PUBLIC_DEFAULT_FX_RATE) || 1180;

// Passcode for the /admin dealer console gate.
export const ADMIN_PASSCODE =
  process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "MODFEM-2026";
