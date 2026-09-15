/**
 * googleAuth.ts
 * =============================================================================
 * Google Identity Services (GSI) auth — replaces Supabase auth.
 *
 * HOW IT WORKS
 *  1. Google's GSI script (loaded in index.html) calls window.handleGoogleCredential
 *     with a JWT `credential` after the user picks an account.
 *  2. We decode that JWT client-side (no signature verification — the JWT was
 *     delivered directly by Google's secure popup, not via a 3rd party).
 *  3. We persist the raw credential string AND the decoded user info in
 *     localStorage so the session survives page refreshes. If the JWT has
 *     expired (they last ~1 hour) we fall back to the cached user data
 *     instead of logging the user out — GSI's `auto_select` will silently
 *     refresh the credential next time the library loads.
 *
 * SETUP (one time)
 *  1. Google Cloud Console → APIs & Services → Credentials →
 *     Create OAuth 2.0 Client ID → Web application
 *  2. Authorised JavaScript origins: your Vercel URL + http://localhost:5173
 *  3. Copy the Client ID → VITE_GOOGLE_CLIENT_ID in .env.local (and Vercel)
 */

export interface GoogleUser {
  /** Google's stable, unique subject ID — used as the DB row key in Sheets. */
  id: string;
  email: string;
  name: string;
  picture?: string;
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/** True when auth is configured and can be used. */
export const isGoogleAuthConfigured = Boolean(CLIENT_ID);

const SESSION_KEY = 'idf_google_credential';
const USER_INFO_KEY = 'idf_google_user';

// ─── JWT decoding ─────────────────────────────────────────────────────────────

/**
 * Decode a Google ID-token JWT into a GoogleUser.
 * We trust the payload because the token was delivered by Google's own popup
 * (not user-supplied input). We still check `exp` to avoid stale sessions.
 */
export function decodeGoogleJwt(credential: string): GoogleUser | null {
  try {
    const parts = credential.split('.');
    if (parts.length !== 3) return null;
    // Base64url → Base64 → JSON
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    // Reject if expired
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: (payload.name ?? payload.email) as string,
      picture: (payload.picture ?? '') as string,
    };
  } catch {
    return null;
  }
}

// ─── Session persistence ──────────────────────────────────────────────────────

/** Persist the raw JWT credential in localStorage. */
export function persistSession(credential: string) {
  localStorage.setItem(SESSION_KEY, credential);
}

/** Persist decoded user info so sessions survive JWT expiry. */
export function persistUserInfo(user: GoogleUser) {
  try {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
  } catch { /* quota exceeded — non-critical */ }
}

/** Load cached user info (fallback when JWT has expired). */
export function loadPersistedUserInfo(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.id && parsed?.email) return parsed as GoogleUser;
    return null;
  } catch {
    return null;
  }
}

/**
 * Load the persisted session. First tries the JWT — if it's still valid we
 * return it directly. If the JWT has expired we fall back to the cached user
 * info so the customer stays signed in (GSI will silently re-issue a fresh
 * credential via auto_select on its next load).
 */
export function loadSession(): { user: GoogleUser; credential: string } | null {
  const credential = localStorage.getItem(SESSION_KEY);
  if (!credential) {
    // No credential at all — check for cached user info (shouldn't normally happen)
    const cached = loadPersistedUserInfo();
    if (cached) return { user: cached, credential: '' };
    return null;
  }
  const user = decodeGoogleJwt(credential);
  if (user) {
    // JWT is still valid — also update the cached user info
    persistUserInfo(user);
    return { user, credential };
  }
  // JWT expired — fall back to cached user info instead of logging out
  const cachedUser = loadPersistedUserInfo();
  if (cachedUser) {
    return { user: cachedUser, credential };
  }
  // No fallback available — clean up
  localStorage.removeItem(SESSION_KEY);
  return null;
}

/** Clear the persisted session (sign out). */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  // Also revoke on Google's side so One Tap doesn't auto-sign back in
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect();
  }
}

// ─── GSI initialisation ───────────────────────────────────────────────────────

type CredentialCallback = (credential: string) => void;

/**
 * Initialize the Google GSI library and render the One Tap prompt.
 * `onCredential` is called with the raw JWT whenever the user signs in.
 * Safe to call multiple times — Google's library handles deduplication.
 */
export function initGoogleAuth(onCredential: CredentialCallback) {
  if (!isGoogleAuthConfigured || !CLIENT_ID) return;
  if (typeof window === 'undefined' || !window.google?.accounts?.id) return;

  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response: { credential: string }) => {
      onCredential(response.credential);
    },
    auto_select: true, // silently re-sign if session is active
    cancel_on_tap_outside: false,
  });

  // Show the One Tap prompt (floats top-right on desktop)
  window.google.accounts.id.prompt();
}

/**
 * Render the standard "Sign in with Google" button into a container element.
 */
export function renderGoogleButton(containerId: string) {
  if (!isGoogleAuthConfigured || !CLIENT_ID) return;
  const el = document.getElementById(containerId);
  if (!el || !window.google?.accounts?.id) return;

  window.google.accounts.id.renderButton(el, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: el.offsetWidth || 280,
  });
}
