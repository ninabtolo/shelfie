/**
 * Single source of truth for the legal pages and consent records.
 *
 * Bump LEGAL_VERSION whenever the Terms of Use or Privacy Policy change in a
 * meaningful way: every signed-in user will be asked to accept the new version
 * the next time they open the app.
 */
export const LEGAL_VERSION = "2026-11-10";

/** Human-readable effective date shown on the legal pages. */
export const LEGAL_EFFECTIVE_DATE = "November 10, 2026";

/** Minimum age to create and use an account. */
export const MINIMUM_AGE = 18;

/**
 * Inbox for privacy, account deletion and copyright requests.
 * Set NEXT_PUBLIC_CONTACT_EMAIL in your environment (e.g. Vercel project settings).
 */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";

/** US state whose laws govern the Terms. Set NEXT_PUBLIC_GOVERNING_STATE. */
export const GOVERNING_STATE = process.env.NEXT_PUBLIC_GOVERNING_STATE?.trim() || "";
