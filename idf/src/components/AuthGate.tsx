import { useState } from 'react';
import { Check, Eye, EyeOff, Loader2, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode =
  | 'choose'
  | 'signup'       // email + password + name form
  | 'signup-otp'   // 6-digit code verification
  | 'signin'       // email + password
  | 'forgot'       // enter email to receive recovery code
  | 'forgot-otp'   // enter 6-digit recovery code
  | 'new-password' // set a new password after recovery
  | 'phone'        // phone number entry
  | 'phone-otp';   // phone SMS code

/** Google's official four-colour "G" mark. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.5 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 13 24 13c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.5 6.5 29 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z" />
      <path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.6 2.3-7.2 2.3-5.2 0-9.6-3.4-11.2-8.1l-6.6 5.1C9.5 39 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C40.9 36.4 43.5 30.7 43.5 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Shared dark-theme input styling that matches the site's night/gold palette. */
const INPUT =
  'w-full rounded-[3px] border border-gold/20 bg-night/60 px-4 py-3.5 text-[14px] text-ivory placeholder-ivory/35 outline-none transition-colors focus:border-gold';

interface Props {
  /** When true, renders inline (no outer max-width container). Used inside AuthModal. */
  compact?: boolean;
}

export default function AuthGate({ compact = false }: Props) {
  const {
    signInWithGoogle,
    signUpWithEmail,
    verifySignupCode,
    signInWithEmail,
    forgotPassword,
    verifyRecoveryCode,
    updatePassword,
    signInWithPhone,
    verifyPhoneCode,
    phoneAuthEnabled,
  } = useAuth();

  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [newPass, setNewPass] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const resetFeedback = () => { setError(''); setInfo(''); };

  const go = (next: Mode) => { resetFeedback(); setCode(''); setMode(next); };

  // ─── Submit handlers ────────────────────────────────────────────────────────

  const handleSignup = async () => {
    resetFeedback();
    if (name.trim().length < 2) return setError('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    const { error: e } = await signUpWithEmail(email, password, name.trim());
    setBusy(false);
    if (e) return setError(e);
    setInfo(`We've sent a 6-digit code to ${email}. Check your spam folder too.`);
    setMode('signup-otp');
  };

  const handleSignupOtp = async () => {
    resetFeedback();
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from your email.');
    setBusy(true);
    const { error: e } = await verifySignupCode(email, code, name.trim());
    setBusy(false);
    if (e) return setError(e);
    // onAuthStateChange in AuthContext picks up the new session — modal closes.
  };

  const handleSignin = async () => {
    resetFeedback();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    setBusy(true);
    const { error: e } = await signInWithEmail(email, password);
    setBusy(false);
    if (e) return setError(e);
  };

  const handleForgot = async () => {
    resetFeedback();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
    setBusy(true);
    const { error: e } = await forgotPassword(email);
    setBusy(false);
    if (e) return setError(e);
    setInfo(`Recovery code sent to ${email}. Check your spam folder too.`);
    setMode('forgot-otp');
  };

  const handleForgotOtp = async () => {
    resetFeedback();
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit recovery code.');
    setBusy(true);
    const { error: e } = await verifyRecoveryCode(email, code);
    setBusy(false);
    if (e) return setError(e);
    setMode('new-password');
  };

  const handleNewPassword = async () => {
    resetFeedback();
    if (newPass.length < 8) return setError('New password must be at least 8 characters.');
    setBusy(true);
    const { error: e } = await updatePassword(newPass);
    setBusy(false);
    if (e) return setError(e);
    // Session already live — modal closes via onAuthStateChange.
  };

  const handlePhone = async () => {
    resetFeedback();
    const digits = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digits)) return setError('Enter a valid 10-digit Indian mobile number.');
    setBusy(true);
    const { error: e } = await signInWithPhone(`+91${digits}`);
    setBusy(false);
    if (e) return setError(e);
    setInfo(`Code sent to +91 ${digits}.`);
    setMode('phone-otp');
  };

  const handlePhoneOtp = async () => {
    resetFeedback();
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from your SMS.');
    setBusy(true);
    const digits = phone.replace(/\D/g, '');
    const { error: e } = await verifyPhoneCode(`+91${digits}`, code);
    setBusy(false);
    if (e) return setError(e);
  };

  // ─── Shared UI fragments ────────────────────────────────────────────────────

  const ErrorMsg = () =>
    error ? (
      <p role="alert" className="rounded-[2px] border border-maroon/40 bg-maroon/10 px-3 py-2 text-[12.5px] leading-relaxed text-red-300">
        {error}
      </p>
    ) : null;

  const InfoMsg = () =>
    info ? (
      <p className="flex items-start gap-2 rounded-[2px] border border-gold/30 bg-gold/10 px-3 py-2 text-[12.5px] leading-relaxed text-gold">
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {info}
      </p>
    ) : null;

  const BackLink = ({ to, label = '← Back' }: { to: Mode; label?: string }) => (
    <button
      type="button"
      onClick={() => go(to)}
      className="w-full pt-1 text-center text-[12px] text-ivory/50 hover:text-gold transition-colors"
    >
      {label}
    </button>
  );

  const OtpInput = () => (
    <input
      value={code}
      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder="000000"
      inputMode="numeric"
      maxLength={6}
      className={`${INPUT} text-center font-mono text-2xl tracking-[0.5em]`}
      autoFocus
    />
  );

  const PrimaryBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="btn btn-gold btn-sheen w-full text-[13px] py-3.5"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </button>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={compact ? '' : 'mx-auto max-w-xs'}>
      {/* ── CHOOSE ────────────────────────────────────────────────────────── */}
      {mode === 'choose' && (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-2.5 rounded-[3px] border border-gold/25 bg-chocolate/60 py-3.5 text-[13px] font-semibold text-ivory transition-all hover:border-gold hover:bg-chocolate"
          >
            <GoogleMark />
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => go('signin')}
            className="flex w-full items-center justify-center gap-2.5 rounded-[3px] border border-gold/20 py-3.5 text-[13px] font-semibold text-ivory/80 transition-all hover:border-gold hover:text-ivory"
          >
            <Mail className="h-4 w-4" />
            Continue with Email
          </button>

          {phoneAuthEnabled && (
            <button
              type="button"
              onClick={() => go('phone')}
              className="flex w-full items-center justify-center gap-2.5 rounded-[3px] border border-gold/20 py-3.5 text-[13px] font-semibold text-ivory/80 transition-all hover:border-gold hover:text-ivory"
            >
              <Smartphone className="h-4 w-4" />
              Continue with Phone
            </button>
          )}

          <p className="pt-1 text-center text-[11px] text-ivory/40">
            Accounts let you view order history and save wishlists.
          </p>
        </div>
      )}

      {/* ── SIGN IN ───────────────────────────────────────────────────────── */}
      {mode === 'signin' && (
        <div className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            autoComplete="email"
            className={INPUT}
          />
          <div className="relative">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignin()}
              placeholder="Password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              className={INPUT}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/40 hover:text-gold"
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => go('forgot')}
              className="text-[11.5px] text-gold/70 hover:text-gold transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <ErrorMsg />
          <PrimaryBtn label="Sign In" onClick={handleSignin} />

          <p className="text-center text-[12px] text-ivory/50">
            New here?{' '}
            <button type="button" onClick={() => go('signup')} className="font-semibold text-gold hover:underline">
              Create an account
            </button>
          </p>
          <BackLink to="choose" />
        </div>
      )}

      {/* ── SIGN UP ───────────────────────────────────────────────────────── */}
      {mode === 'signup' && (
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            className={INPUT}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            autoComplete="email"
            className={INPUT}
          />
          <div className="relative">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
              placeholder="Choose a password (min 8 chars)"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              className={INPUT}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/40 hover:text-gold"
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <ErrorMsg />
          <PrimaryBtn label="Send Verification Code" onClick={handleSignup} />

          <p className="text-center text-[12px] text-ivory/50">
            Already have an account?{' '}
            <button type="button" onClick={() => go('signin')} className="font-semibold text-gold hover:underline">
              Sign in
            </button>
          </p>
          <BackLink to="choose" />
        </div>
      )}

      {/* ── SIGNUP OTP ────────────────────────────────────────────────────── */}
      {mode === 'signup-otp' && (
        <div className="space-y-3">
          <InfoMsg />
          <OtpInput />
          <ErrorMsg />
          <PrimaryBtn label="Verify & Create Account" onClick={handleSignupOtp} />
          <button
            type="button"
            onClick={() => { go('signup'); }}
            className="w-full text-center text-[12px] text-ivory/50 hover:text-gold transition-colors pt-1"
          >
            Didn't receive it? Go back and resend
          </button>
        </div>
      )}

      {/* ── FORGOT PASSWORD ───────────────────────────────────────────────── */}
      {mode === 'forgot' && (
        <div className="space-y-3">
          <p className="text-[13px] text-ivory/60 leading-relaxed">
            Enter your email and we'll send a 6-digit recovery code.
          </p>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleForgot()}
            placeholder="Email address"
            type="email"
            autoComplete="email"
            className={INPUT}
          />
          <ErrorMsg />
          <PrimaryBtn label="Send Recovery Code" onClick={handleForgot} />
          <BackLink to="signin" label="← Back to sign in" />
        </div>
      )}

      {/* ── FORGOT OTP ────────────────────────────────────────────────────── */}
      {mode === 'forgot-otp' && (
        <div className="space-y-3">
          <InfoMsg />
          <OtpInput />
          <ErrorMsg />
          <PrimaryBtn label="Verify Code" onClick={handleForgotOtp} />
          <button
            type="button"
            onClick={() => go('forgot')}
            className="w-full text-center text-[12px] text-ivory/50 hover:text-gold transition-colors pt-1"
          >
            Didn't receive it? Resend
          </button>
        </div>
      )}

      {/* ── NEW PASSWORD ──────────────────────────────────────────────────── */}
      {mode === 'new-password' && (
        <div className="space-y-3">
          <p className="text-[13px] text-ivory/60">Choose a new password for your account.</p>
          <div className="relative">
            <input
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNewPassword()}
              placeholder="New password (min 8 chars)"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              className={INPUT}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/40 hover:text-gold"
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <ErrorMsg />
          <PrimaryBtn label="Set New Password" onClick={handleNewPassword} />
        </div>
      )}

      {/* ── PHONE ─────────────────────────────────────────────────────────── */}
      {mode === 'phone' && (
        <div className="space-y-3">
          <div className="flex overflow-hidden rounded-[3px] border border-gold/20 bg-night/60 focus-within:border-gold transition-colors">
            <span className="flex items-center px-3.5 text-[14px] text-ivory/50 border-r border-gold/20">+91</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onKeyDown={(e) => e.key === 'Enter' && handlePhone()}
              placeholder="10-digit mobile number"
              inputMode="numeric"
              className="w-full bg-transparent px-3 py-3.5 text-[14px] text-ivory placeholder-ivory/35 outline-none"
            />
          </div>
          <ErrorMsg />
          <PrimaryBtn label="Send OTP" onClick={handlePhone} />
          <BackLink to="choose" />
        </div>
      )}

      {/* ── PHONE OTP ─────────────────────────────────────────────────────── */}
      {mode === 'phone-otp' && (
        <div className="space-y-3">
          <InfoMsg />
          <OtpInput />
          <ErrorMsg />
          <PrimaryBtn label="Verify & Sign In" onClick={handlePhoneOtp} />
          <button
            type="button"
            onClick={() => go('phone')}
            className="w-full text-center text-[12px] text-ivory/50 hover:text-gold transition-colors pt-1"
          >
            Resend OTP
          </button>
        </div>
      )}
    </div>
  );
}
