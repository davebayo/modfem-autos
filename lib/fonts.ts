import localFont from "next/font/local";

/**
 * Panchang — a real, freely-licensed (Fontshare / Indian Type Foundry) wide
 * geometric grotesque, downloaded into public/fonts/. Drives the
 * font-panchang Tailwind utility (see globals.css @theme), used exclusively
 * for the MODFEM AUTOS brand wordmark.
 *
 * next/font/local requires these files to exist at build time — there is
 * no runtime "check and fall back" for it, a missing path is a hard build
 * failure. That's why this points at files that genuinely exist.
 */
export const panchang = localFont({
  src: [
    { path: "../public/fonts/Panchang-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/Panchang-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/Panchang-ExtraBold.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-panchang-base",
  display: "swap",
  fallback: ["Syne", "Syncopate", "Arial Black", "sans-serif"],
});
