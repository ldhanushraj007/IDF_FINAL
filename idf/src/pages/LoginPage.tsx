import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
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
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="h-6 w-6 animate-spin text-brand-gold" />
      </div>
    );
  }

  return (
    <div className="grid-container w-full mx-auto max-w-[1600px] relative bg-surface border-x border-[#1a1a1a] min-h-screen flex flex-row">
      {/* Left Sidebar */}
      <div className="hairline-r relative flex flex-col items-center py-4 w-12 border-r border-[#1a1a1a] shrink-0">
        <div className="font-index-num text-index-num mb-auto">01</div>
        <div className="font-label-caps text-label-caps tracking-widest text-secondary rotate-[-90deg] whitespace-nowrap mb-32 uppercase">ACCOUNT</div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen">
        {/* TopAppBar (Transactional - Hidden Navigation Links for focus) */}
        <header className="flex items-center w-full px-margin-page py-6 border-b border-[#1a1a1a] bg-surface">
          <div className="flex-1" />
          <Link to="/" className="font-headline-md text-headline-md tracking-widest text-primary text-center font-serif uppercase">
            IN DESIGN<br/><span className="text-sm tracking-[0.3em] text-brand-gold block font-sans">LUXURY FABRICS</span>
          </Link>
          <div className="flex-1 flex justify-end">
            <Link to="/" className="font-label-caps text-label-caps flex items-center gap-1.5 hover:text-primary text-secondary transition-colors duration-200">
              <X className="h-4 w-4" />
              <span>CLOSE</span>
            </Link>
          </div>
        </header>

        {/* Authentication Panel */}
        <main className="flex-grow flex items-center justify-center p-4 sm:p-8 bg-surface-bright">
          <div className="w-full max-w-md relative p-8 border border-on-background bg-surface">
            <div className="index-marker absolute top-2 left-2 font-index-num text-index-num text-secondary">02</div>
            <h1 className="font-headline-md text-headline-md text-center mb-8 mt-4 font-serif">Welcome Back</h1>
            
            {/* Tabs */}
            {tab !== 'otp' && (
              <div className="flex border-b border-outline mb-8">
                <button
                  onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
                  className={`flex-1 pb-3 text-center font-label-caps text-label-caps transition-colors ${
                    tab === 'login' ? 'border-b-2 border-brand-gold text-primary' : 'text-secondary'
                  }`}
                >
                  SIGN IN
                </button>
                <button
                  onClick={() => { setTab('signup'); setError(''); setSuccessMsg(''); }}
                  className={`flex-1 pb-3 text-center font-label-caps text-label-caps transition-colors ${
                    tab === 'signup' ? 'border-b-2 border-brand-gold text-primary' : 'text-secondary'
                  }`}
                >
                  SIGN UP
                </button>
              </div>
            )}

            {/* Notifications */}
            {error && (
              <div className="mb-4 p-3 border border-error bg-error/5 text-[12px] text-error">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 flex items-center gap-2 p-3 border border-brand-gold bg-brand-gold/5 text-[12px] text-brand-gold">
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
                  className="space-y-6"
                >
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                      <label className="block font-label-caps text-label-caps mb-2 text-secondary">EMAIL ADDRESS</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full border border-outline p-3 text-body-sm bg-transparent outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-label-caps text-label-caps mb-2 text-secondary">PASSWORD</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full border border-outline p-3 text-body-sm bg-transparent outline-none focus:border-primary"
                      />
                    </div>
                    <button type="submit" disabled={busy} className="btn-primary w-full p-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase hover:bg-opacity-95 transition-colors">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'SIGN IN'}
                    </button>
                  </form>

                  {isGoogleAuthConfigured && (
                    <>
                      <div className="relative flex items-center justify-center my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant"></div></div>
                        <span className="relative bg-surface px-4 font-label-caps text-label-caps text-secondary">OR</span>
                      </div>

                      <div ref={btnRef} className={useNativeButton ? 'flex justify-center' : 'hidden'} />
                      
                      {!useNativeButton && (
                        <button
                          type="button"
                          onClick={gsiLoaded ? signInWithGoogle : undefined}
                          disabled={!gsiLoaded}
                          className="btn-outline w-full p-4 border border-primary text-primary font-label-caps text-label-caps flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
                        >
                          {gsiLoaded ? (
                            <>
                              <GoogleMark />
                              CONTINUE WITH GOOGLE
                            </>
                          ) : (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              LOADING GOOGLE...
                            </>
                          )}
                        </button>
                      )}
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
                  className="space-y-6"
                >
                  <form onSubmit={handleSignup} className="space-y-6">
                    <div>
                      <label className="block font-label-caps text-label-caps mb-2 text-secondary">FULL NAME</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full border border-outline p-3 text-body-sm bg-transparent outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-label-caps text-label-caps mb-2 text-secondary">PHONE NUMBER</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full border border-outline p-3 text-body-sm bg-transparent outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-label-caps text-label-caps mb-2 text-secondary">EMAIL ADDRESS</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full border border-outline p-3 text-body-sm bg-transparent outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-label-caps text-label-caps mb-2 text-secondary">PASSWORD</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        className="w-full border border-outline p-3 text-body-sm bg-transparent outline-none focus:border-primary"
                      />
                    </div>
                    <button type="submit" disabled={busy} className="btn-primary w-full p-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase hover:bg-opacity-95 transition-colors">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'CREATE ACCOUNT'}
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
                  className="space-y-6"
                >
                  <button
                    onClick={() => { setTab('signup'); setError(''); setSuccessMsg(''); }}
                    className="flex items-center gap-1.5 text-[12px] text-secondary hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign Up
                  </button>

                  <div className="mb-6 text-center">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h2 className="font-serif text-2xl text-primary">Verify your email</h2>
                    <p className="mt-1 text-[13px] text-secondary">
                      We sent a 6-digit code to <span className="text-brand-gold font-medium">{email}</span>. Enter it below to activate your account.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit Code"
                      className="w-full border border-outline p-3 text-center tracking-[0.3em] font-bold text-lg bg-transparent outline-none focus:border-primary"
                    />
                    <button type="submit" disabled={busy} className="btn-primary w-full p-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase hover:bg-opacity-95 transition-colors">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'VERIFY & SIGN IN'}
                    </button>
                  </form>

                  <div className="text-center text-[12px] text-secondary">
                    Didn't receive the email?{' '}
                    <button
                      onClick={resendOtp}
                      disabled={busy}
                      className="text-brand-gold hover:underline disabled:opacity-50"
                    >
                      Resend Code
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 border-t border-primary/5 pt-6 text-center">
              <Link to="/" className="text-[12px] text-secondary hover:text-primary transition-colors">
                ← Continue browsing as guest
              </Link>
            </div>
          </div>
        </main>

        {/* Footer (Minimal for Auth) */}
        <footer className="w-full px-margin-page py-6 border-t border-[#1a1a1a] bg-surface flex justify-between items-center text-secondary font-label-caps text-label-caps">
          <span>© {new Date().getFullYear()} {BUSINESS.legalName}. ALL RIGHTS RESERVED.</span>
          <div className="flex gap-4">
            <a className="hover:text-primary" href="#">PRIVACY</a>
            <a className="hover:text-primary" href="#">TERMS</a>
          </div>
        </footer>
      </div>

      {/* Right Sidebar */}
      <div className="relative flex flex-col items-center py-4 w-12 border-l border-[#1a1a1a] shrink-0">
        <div className="font-index-num text-index-num mb-auto">02</div>
      </div>
    </div>
  );
}
