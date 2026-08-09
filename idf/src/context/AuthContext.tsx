import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  isGoogleAuthConfigured,
  loadSession,
  persistSession,
  clearSession,
  initGoogleAuth,
  type GoogleUser,
} from '../lib/googleAuth';
import {
  fetchProfile,
  upsertProfile,
  customerSessionApi,
  type CustomerProfile,
} from '../lib/customerApi';

interface AuthValue {
  /** The signed-in customer, or null. */
  user: GoogleUser | null;
  /** The customer's saved profile (name/phone/city) — null until loaded or signed out. */
  profile: CustomerProfile | null;
  /** True while the initial session check is in flight. */
  loading: boolean;
  /** Whether accounts are switched on at all (always true since we support email auth). */
  enabled: boolean;

  /** Trigger the Google One Tap / popup sign-in flow. */
  signInWithGoogle: () => void;
  /** Complete custom email auth login/verification sessions. */
  completeCustomAuthSession: (token: string, user: GoogleUser) => Promise<void>;
  /** Save name/phone/city against the signed-in account in Google Sheets. */
  saveProfile: (fields: Partial<CustomerProfile>) => Promise<{ error?: string }>;
  /** Sign out and clear the persisted session. */
  signOut: () => void;

  // ── Auth modal ─────────────────────────────────────────────────────────────
  authModalOpen: boolean;
  requestSignIn: () => void;
  closeAuthModal: () => void;
}

const Ctx = createContext<AuthValue | null>(null);

const CUSTOMER_TOKEN_KEY = 'idf_customer_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Ref so GSI callback always has the latest setter without re-initialising
  const onCredential = useRef<(cred: string) => void>(() => {});

  const loadProfile = async (u: GoogleUser | null) => {
    if (!u) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(u.id, u.email);
    setProfile(p);
  };

  const handleCredential = async (credential: string) => {
    const { decodeGoogleJwt } = await import('../lib/googleAuth');
    const decoded = decodeGoogleJwt(credential);
    if (!decoded) return;
    persistSession(credential);
    setUser(decoded);
    setAuthModalOpen(false);
    // Create/update the Sheets customer row on first Google sign-in
    await upsertProfile(decoded.id, decoded.email, {
      name: decoded.name,
      email: decoded.email,
      signup_method: 'google',
    });
    loadProfile(decoded);
  };

  // Set the session token and user info for custom email authentication
  const completeCustomAuthSession = async (token: string, customUser: GoogleUser) => {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    setUser(customUser);
    setAuthModalOpen(false);
    await loadProfile(customUser);
  };

  // Keep ref current so GSI callback doesn't go stale
  onCredential.current = handleCredential;

  useEffect(() => {
    const restoreSession = async () => {
      // 1. Try custom email session first
      const custToken = localStorage.getItem(CUSTOMER_TOKEN_KEY);
      if (custToken) {
        try {
          const customUser = await customerSessionApi(custToken);
          if (customUser) {
            setUser({
              id: customUser.id,
              email: customUser.email,
              name: customUser.name,
            });
            await loadProfile({
              id: customUser.id,
              email: customUser.email,
              name: customUser.name,
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        }
      }

      // 2. Try Google session next
      if (isGoogleAuthConfigured) {
        const saved = loadSession();
        if (saved) {
          setUser(saved.user);
          await loadProfile(saved.user);
        }
      }
      setLoading(false);
    };

    restoreSession();

    if (!isGoogleAuthConfigured) return;

    // Wait for the GSI script to load, then initialise
    const tryInit = () => {
      if (window.google?.accounts?.id) {
        initGoogleAuth((cred) => onCredential.current(cred));
      }
    };

    // Script might already be loaded (fast connection), or we wait for it
    if (window.google?.accounts?.id) {
      tryInit();
    } else {
      // Poll briefly — the script is async-loaded in index.html
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          tryInit();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // ── Sign-in ─────────────────────────────────────────────────────────────────

  const signInWithGoogle = () => {
    if (!isGoogleAuthConfigured || !window.google?.accounts?.id) return;
    window.google.accounts.id.prompt();
  };

  // ── Profile ─────────────────────────────────────────────────────────────────

  const saveProfile = async (fields: Partial<CustomerProfile>): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not signed in.' };
    const updated = await upsertProfile(user.id, user.email, fields);
    if (updated) setProfile(updated);
    return {};
  };

  // ── Sign-out ─────────────────────────────────────────────────────────────────

  const signOut = () => {
    clearSession();
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    setUser(null);
    setProfile(null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        profile,
        loading,
        enabled: true, // Custom Email Auth is always supported
        signInWithGoogle,
        completeCustomAuthSession,
        saveProfile,
        signOut,
        authModalOpen,
        requestSignIn: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
