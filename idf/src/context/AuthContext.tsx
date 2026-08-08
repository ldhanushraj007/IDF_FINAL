import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { fetchProfile, upsertProfile, type CustomerProfile } from '../lib/customerApi';
import { backfillSessionUser } from '../lib/useTrackInteraction';

interface Result {
  error?: string;
}

interface AuthValue {
  /** The signed-in customer, or null. Always null when Supabase isn't configured. */
  user: User | null;
  /** The customer's saved profile (name/phone/city) — null until loaded or signed out. */
  profile: CustomerProfile | null;
  /** True while the initial session check is in flight. */
  loading: boolean;
  /** Whether accounts are switched on at all (Supabase configured). */
  enabled: boolean;
  /** Whether phone auth is enabled via env flag (needs Twilio in Supabase). */
  phoneAuthEnabled: boolean;

  // ── Sign-in methods ────────────────────────────────────────────────────────
  signInWithGoogle: () => Promise<void>;

  /** Step 1 of email signup: creates the account and emails a 6-digit code.
   *  IMPORTANT: in your Supabase dashboard → Authentication → Email Templates,
   *  set both "Confirm signup" and "Magic Link" templates to use {{ .Token }}
   *  (the 6-digit OTP), NOT the default magic link URL. */
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<Result>;
  /** Step 2: confirms the 6-digit code from signUpWithEmail. */
  verifySignupCode: (email: string, code: string, name?: string) => Promise<Result>;

  /** Returning customer with a verified email. */
  signInWithEmail: (email: string, password: string) => Promise<Result>;

  /** Step 1 of forgot-password: sends a 6-digit recovery code to the email.
   *  Same template requirement as signUpWithEmail — must use {{ .Token }}. */
  forgotPassword: (email: string) => Promise<Result>;
  /** Step 2: verify the recovery code. */
  verifyRecoveryCode: (email: string, code: string) => Promise<Result>;
  /** Step 3: set the new password (after verifyRecoveryCode has given a session). */
  updatePassword: (newPassword: string) => Promise<Result>;

  /** Step 1 of phone sign-in: texts a 6-digit code.
   *  Needs an SMS provider (Twilio) in Supabase → Authentication → Providers.
   *  Gate this behind VITE_ENABLE_PHONE_AUTH=true. */
  signInWithPhone: (phone: string) => Promise<Result>;
  /** Step 2: confirms the code from signInWithPhone. */
  verifyPhoneCode: (phone: string, code: string) => Promise<Result>;

  // ── Profile ────────────────────────────────────────────────────────────────
  /** Saves name/phone/city against the signed-in account in Google Sheets. */
  saveProfile: (fields: Partial<CustomerProfile>) => Promise<Result>;

  // ── Session ────────────────────────────────────────────────────────────────
  signOut: () => Promise<void>;

  // ── Auth modal ─────────────────────────────────────────────────────────────
  authModalOpen: boolean;
  requestSignIn: () => void;
  closeAuthModal: () => void;
}

const Ctx = createContext<AuthValue | null>(null);

/** True when the phone auth feature flag is set — set VITE_ENABLE_PHONE_AUTH=true
 *  only after Twilio (or another SMS provider) is connected in your Supabase project. */
const phoneAuthEnabled = import.meta.env.VITE_ENABLE_PHONE_AUTH === 'true';

/** Maps raw Supabase error messages to user-friendly strings. */
function friendlyError(msg: string | undefined): string | undefined {
  if (!msg) return undefined;
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Incorrect email or password.';
  if (m.includes('email not confirmed')) return 'Please verify your email first.';
  if (m.includes('token has expired') || m.includes('otp expired')) return 'That code has expired — request a new one.';
  if (m.includes('token') || m.includes('invalid otp')) return 'Incorrect code — check your email and try again.';
  if (m.includes('already registered') || m.includes('user already exists')) return 'An account with this email already exists. Sign in instead.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts — please wait a minute and try again.';
  if (m.includes('network') || m.includes('fetch')) return 'Network error — check your connection and retry.';
  return msg;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const loadProfile = async (u: User | null) => {
    if (!u) { setProfile(null); return; }
    const p = await fetchProfile();
    setProfile(p);
  };

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      loadProfile(u).finally(() => setLoading(false));
      if (u) backfillSessionUser();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      loadProfile(u);
      if (u) {
        setAuthModalOpen(false);
        backfillSessionUser();

        // On first Google sign-in, the provider gives us name + email —
        // push them to Sheets so the customer row is created automatically.
        if (event === 'SIGNED_IN' && u.app_metadata?.provider === 'google') {
          upsertProfile({
            name:         u.user_metadata?.full_name ?? '',
            email:        u.email ?? '',
            signup_method: 'google',
          });
        }
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Sign-in methods ─────────────────────────────────────────────────────────

  const signInWithGoogle = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    name?: string,
  ): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name ?? '' },
        // emailRedirectTo is intentionally NOT set — we use the 6-digit token
        // flow (verifyOtp), not the magic-link redirect flow.
        // ⚠️  Dashboard requirement: set the "Confirm signup" template to send
        //     {{ .Token }} (the 6-digit code) instead of the default link.
      },
    });
    return { error: friendlyError(error?.message) };
  };

  const verifySignupCode = async (
    email: string,
    code: string,
    name?: string,
  ): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    if (!error) {
      // Session is now live — create the Sheets customer row.
      await upsertProfile({ email, name: name ?? '', signup_method: 'email' });
    }
    return { error: friendlyError(error?.message) };
  };

  const signInWithEmail = async (email: string, password: string): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: friendlyError(error?.message) };
  };

  const forgotPassword = async (email: string): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    // ⚠️  Dashboard requirement: set the Supabase "Magic Link" email template
    //     to send {{ .Token }} (6-digit code) instead of the default link URL.
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: friendlyError(error?.message) };
  };

  const verifyRecoveryCode = async (email: string, code: string): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
    return { error: friendlyError(error?.message) };
  };

  const updatePassword = async (newPassword: string): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: friendlyError(error?.message) };
  };

  const signInWithPhone = async (phone: string): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    if (!phoneAuthEnabled) return { error: 'Phone sign-in is not enabled.' };
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error: friendlyError(error?.message) };
  };

  const verifyPhoneCode = async (phone: string, code: string): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
    if (!error) {
      await upsertProfile({ phone, signup_method: 'phone' });
    }
    return { error: friendlyError(error?.message) };
  };

  // ── Profile ─────────────────────────────────────────────────────────────────

  const saveProfile = async (fields: Partial<CustomerProfile>): Promise<Result> => {
    if (!user) return { error: 'Not signed in.' };
    const updated = await upsertProfile(fields);
    if (updated) setProfile(updated);
    return {};
  };

  // ── Session ─────────────────────────────────────────────────────────────────

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        profile,
        loading,
        enabled: isSupabaseConfigured,
        phoneAuthEnabled,
        signInWithGoogle,
        signUpWithEmail,
        verifySignupCode,
        signInWithEmail,
        forgotPassword,
        verifyRecoveryCode,
        updatePassword,
        signInWithPhone,
        verifyPhoneCode,
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
