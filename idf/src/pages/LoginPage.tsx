import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, User, Mail, Lock, Phone, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isGoogleAuthConfigured, renderGoogleButton } from '../lib/googleAuth';
import {
  customerLoginApi,
  customerSendOtpApi,
  customerVerifyOtpApi,
} from '../lib/customerApi';
import { BUSINESS } from '../lib/constants';

/** Google's official four-colour "G" mark. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.5 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 13 24 13c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.5 6.5 29 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z" />
      <path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.6 2.3-7.2 2.3-5.2 0-9.6-3.4-11.2-8.1l-6.6 5.1C9.5 39 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C40.9 36.4 43.5 30.7 43.5 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

type Tab = 'login' | 'signup' | 'otp';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, completeCustomAuthSession } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Google OAuth
  const [gsiLoaded, setGsiLoaded] = useState(Boolean(window.google?.accounts?.id));
  const [useNativeButton, setUseNativeButton] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

  // Redirect if already signed in
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Set page title
  useEffect(() => {
    document.title = tab === 'login' ? `Login | ${BUSINESS.name}` : `Sign Up | ${BUSINESS.name}`;
  }, [tab]);

  // Wait for GSI script to load
  useEffect(() => {
    if (gsiLoaded) return;
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setGsiLoaded(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gsiLoaded]);

  // Render native Google button once GSI ready
  useEffect(() => {
    if (!gsiLoaded || !btnRef.current || tab !== 'login') return;
    const id = 'idf-login-page-btn';
    btnRef.current.id = id;
    renderGoogleButton(id);
    setUseNativeButton(true);
  }, [gsiLoaded, tab]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) return setError('Email and password are required.');
    
    setBusy(true);
    try {
      const res = await customerLoginApi(email.trim().toLowerCase(), password);
      await completeCustomAuthSession(res.token, {
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        picture: '',
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !phone.trim() || !email.trim() || !password) {
      return setError('All fields are required.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setBusy(true);
    try {
      await customerSendOtpApi(name.trim(), phone.trim(), email.trim().toLowerCase(), password);
      setSuccessMsg(`Verification code sent to ${email}`);
      setTab('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpCode.trim()) return setError('Please enter the 6-digit verification code.');

    setBusy(true);
    try {
      const res = await customerVerifyOtpApi(email.trim().toLowerCase(), otpCode.trim());
      await completeCustomAuthSession(res.token, {
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        picture: '',
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect or expired code.');
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setError('');
    setBusy(true);
    try {
      await customerSendOtpApi(name.trim(), phone.trim(), email.trim().toLowerCase(), password);
      setSuccessMsg(`A new code has been sent to ${email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-night">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-night">
      {/* ── Decorative background ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gold/5 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-maroon/20 blur-[100px]" />
      </div>

      {/* ── Left panel — branding (desktop only) ── */}
      <div className="relative hidden flex-1 flex-col justify-between bg-chocolate/40 p-12 lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <img src="/images/logo/logo-mark.png" alt="" className="h-10 w-10 object-contain" />
          <div>
            <p className="font-serif text-lg text-ivory">In Design</p>
            <p className="text-[10px] tracking-[0.22em] text-gold uppercase">Luxury Fabrics</p>
          </div>
        </Link>

        <div>
          <motion.blockquote
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-3xl leading-snug text-ivory"
          >
            "Fabric for the days<br />you'll <span className="text-gold italic">never forget.</span>"
          </motion.blockquote>
          <p className="mt-4 text-[13px] text-ivory/40">
            Banarasi silks, bridal couture and designer textiles — Bengaluru's finest since 2009.
          </p>
        </div>

        <p className="text-[11px] text-ivory/25">
          {BUSINESS.addressLine1}, {BUSINESS.addressLine3}
        </p>
      </div>

      {/* ── Right panel — forms ── */}
      <div className="relative flex w-full flex-col items-center justify-center px-6 py-16 lg:w-[480px] lg:shrink-0">
        {/* Mobile logo */}
        <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden">
          <img src="/images/logo/logo-mark.png" alt="" className="h-9 w-9 object-contain" />
          <div>
            <p className="font-serif text-base text-ivory">In Design</p>
            <p className="text-[9px] tracking-[0.22em] text-gold uppercase">Luxury Fabrics</p>
          </div>
        </Link>

        <div className="w-full max-w-sm">
          {/* Tabs */}
          {tab !== 'otp' && (
            <div className="mb-8 flex border-b border-ivory/10">
              <button
                onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 pb-3 text-center text-[14px] font-semibold transition-colors ${
                  tab === 'login' ? 'border-b-2 border-gold text-gold' : 'text-ivory/40 hover:text-ivory'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setTab('signup'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 pb-3 text-center text-[14px] font-semibold transition-colors ${
                  tab === 'signup' ? 'border-b-2 border-gold text-gold' : 'text-ivory/40 hover:text-ivory'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Errors/Success Notifications */}
          {error && (
            <div className="mb-4 rounded-[3px] border border-maroon/20 bg-maroon/5 px-4 py-3 text-[12px] text-maroon">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-[3px] border border-gold/20 bg-gold/5 px-4 py-3 text-[12px] text-gold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          )}

          <AnimatePresence mode="wait">
            {tab === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Heading */}
                <div className="mb-6 text-center lg:text-left">
                  <h2 className="font-serif text-2xl text-ivory">Welcome back</h2>
                  <p className="mt-1 text-[13px] text-ivory/50">Sign in to access your orders.</p>
                </div>

                {/* Email Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-ivory/30" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full rounded-[3px] border border-ivory/10 bg-ivory/5 py-3 pl-10 pr-4 text-[13px] text-ivory outline-none focus:border-gold/50"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-ivory/30" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full rounded-[3px] border border-ivory/10 bg-ivory/5 py-3 pl-10 pr-4 text-[13px] text-ivory outline-none focus:border-gold/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn btn-gold btn-sheen flex w-full justify-center items-center gap-2 py-3"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
                  </button>
                </form>

                {/* Google Auth Option */}
                {isGoogleAuthConfigured && (
                  <>
                    <div className="my-6 flex items-center gap-3">
                      <div className="flex-1 border-t border-ivory/10" />
                      <span className="text-[10px] uppercase tracking-widest text-ivory/30">or</span>
                      <div className="flex-1 border-t border-ivory/10" />
                    </div>

                    <div className="space-y-3">
                      {/* Native GSI button */}
                      <div
                        ref={btnRef}
                        className={useNativeButton ? 'flex justify-center' : 'hidden'}
                      />

                      {/* Fallback button */}
                      {!useNativeButton && (
                        <button
                          type="button"
                          onClick={gsiLoaded ? signInWithGoogle : undefined}
                          disabled={!gsiLoaded}
                          className="flex w-full items-center justify-center gap-3 rounded-[3px] border border-ivory/20 bg-ivory/5 py-3.5 text-[13.5px] font-semibold text-ivory transition-all hover:border-gold/60 hover:bg-ivory/10 disabled:opacity-50"
                        >
                          {gsiLoaded ? (
                            <>
                              <GoogleMark />
                              Continue with Google
                            </>
                          ) : (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading Google...
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {tab === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Heading */}
                <div className="mb-6 text-center lg:text-left">
                  <h2 className="font-serif text-2xl text-ivory">Create account</h2>
                  <p className="mt-1 text-[13px] text-ivory/50">Register to get custom showroom services.</p>
                </div>

                {/* Email Registration Form */}
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-ivory/30" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full rounded-[3px] border border-ivory/10 bg-ivory/5 py-3 pl-10 pr-4 text-[13px] text-ivory outline-none focus:border-gold/50"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-ivory/30" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone Number (WhatsApp)"
                      className="w-full rounded-[3px] border border-ivory/10 bg-ivory/5 py-3 pl-10 pr-4 text-[13px] text-ivory outline-none focus:border-gold/50"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-ivory/30" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full rounded-[3px] border border-ivory/10 bg-ivory/5 py-3 pl-10 pr-4 text-[13px] text-ivory outline-none focus:border-gold/50"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-ivory/30" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create Password (min. 6 chars)"
                      className="w-full rounded-[3px] border border-ivory/10 bg-ivory/5 py-3 pl-10 pr-4 text-[13px] text-ivory outline-none focus:border-gold/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn btn-gold btn-sheen flex w-full justify-center items-center gap-2 py-3"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register & Send OTP'}
                  </button>
                </form>
              </motion.div>
            )}

            {tab === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {/* Back button */}
                <button
                  onClick={() => { setTab('signup'); setError(''); setSuccessMsg(''); }}
                  className="mb-6 flex items-center gap-1.5 text-[12px] text-ivory/40 hover:text-gold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign Up
                </button>

                {/* Heading */}
                <div className="mb-6 text-center lg:text-left">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h2 className="font-serif text-2xl text-ivory">Verify your email</h2>
                  <p className="mt-1 text-[13px] text-ivory/50">
                    We sent a 6-digit code to <span className="text-gold font-medium">{email}</span>. Enter it below to activate your account.
                  </p>
                </div>

                {/* OTP Form */}
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit Code"
                    className="w-full text-center tracking-[0.3em] font-bold text-lg rounded-[3px] border border-ivory/10 bg-ivory/5 py-3.5 text-ivory outline-none focus:border-gold/50"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn btn-gold btn-sheen flex w-full justify-center items-center gap-2 py-3"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Sign In'}
                  </button>
                </form>

                <div className="mt-6 text-center text-[12px] text-ivory/40">
                  Didn't receive the email?{' '}
                  <button
                    onClick={resendOtp}
                    disabled={busy}
                    className="text-gold hover:underline disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Guest routing */}
          <div className="mt-8 border-t border-ivory/5 pt-6 text-center">
            <Link to="/" className="text-[12px] text-ivory/30 hover:text-gold transition-colors">
              ← Continue browsing as guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
