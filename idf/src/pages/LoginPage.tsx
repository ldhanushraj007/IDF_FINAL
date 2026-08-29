import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  customerSignupApi,
  customerVerifyOtpApi,
  customerLoginApi,
  adminRequestOtpApi,
  adminVerifyOtpApi,
  isSheetsConfigured,
} from '../lib/customerApi';
import { BUSINESS } from '../lib/constants';

const ADMIN_EMAIL = 'virtuosodhanush@gmail.com';

type Step =
  | 'login'          // email + password form
  | 'login_otp'      // OTP sent to user's email after password OK
  | 'signup'         // name + phone + email + password form
  | 'signup_otp'     // OTP sent to new user's email
  | 'admin_otp';     // OTP sent to indesignluxuryfabrics@gmail.com

export default function LoginPage() {
  const { user, loading, completeCustomAuthSession } = useAuth();
  const navigate = useNavigate();

  const [step,    setStep]   = useState<Step>('login');
  const [busy,    setBusy]   = useState(false);
  const [error,   setError]  = useState('');
  const [success, setSuccess]= useState('');

  // shared form state
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [otp,      setOtp]      = useState('');

  // 6-input refs for stylish OTP boxes
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    document.title = step === 'signup' || step === 'signup_otp'
      ? `Create Account | ${BUSINESS.name}`
      : `Sign In | ${BUSINESS.name}`;
  }, [step]);

  // Auto-focus first OTP box when OTP step appears
  useEffect(() => {
    if (step === 'login_otp' || step === 'signup_otp' || step === 'admin_otp') {
      setOtp('');
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    }
  }, [step]);

  const clear = () => { setError(''); setSuccess(''); };

  // ── OTP box helpers ─────────────────────────────────────────────────────────

  const handleOtpChar = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const arr = otp.split('');
    arr[i] = val;
    const next = arr.join('').padEnd(6, '').slice(0, 6);
    setOtp(next.trimEnd());
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setOtp(pasted);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  // ── Login: Step 1 — password ────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); clear();
    if (!email.trim() || !password) return setError('Email and password are required.');

    const isAdmin = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

    setBusy(true);
    try {
      if (isAdmin) {
        await adminRequestOtpApi(email.trim().toLowerCase(), password);
        setSuccess(`Admin OTP sent to ${ADMIN_EMAIL}`);
        setStep('admin_otp');
      } else {
        const r = await customerLoginApi(email.trim().toLowerCase(), password);
        if (r.otpSent) {
          setSuccess(`Verification code sent to ${email}`);
          setStep('login_otp');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your email and password.');
    } finally {
      setBusy(false);
    }
  };

  // ── Login: Step 2 — verify OTP ──────────────────────────────────────────────

  const handleLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault(); clear();
    if (otp.length < 6) return setError('Please enter the complete 6-digit code.');
    setBusy(true);
    try {
      const res = await customerVerifyOtpApi(email.trim().toLowerCase(), otp);
      await completeCustomAuthSession(res.token, { id: res.user.id, email: res.user.email, name: res.user.name, picture: '' });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect or expired code.');
    } finally {
      setBusy(false);
    }
  };

  // ── Admin OTP verify ────────────────────────────────────────────────────────

  const handleAdminOtp = async (e: React.FormEvent) => {
    e.preventDefault(); clear();
    if (otp.length < 6) return setError('Please enter the complete 6-digit code.');
    setBusy(true);
    try {
      const res = await adminVerifyOtpApi(otp);
      // Store admin token separately, then redirect to admin panel
      localStorage.setItem('idf_admin_token', res.token);
      await completeCustomAuthSession(res.token, { id: 'admin', email: ADMIN_EMAIL, name: 'Admin', picture: '' });
      window.location.href = '/#/admin';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect admin code.');
    } finally {
      setBusy(false);
    }
  };

  // ── Signup: Step 1 — details ────────────────────────────────────────────────

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); clear();
    if (!name.trim() || !phone.trim() || !email.trim() || !password)
      return setError('All fields are required.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setBusy(true);
    try {
      await customerSignupApi(name.trim(), phone.trim(), email.trim().toLowerCase(), password);
      setSuccess(`Verification code sent to ${email}`);
      setStep('signup_otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // ── Signup: Step 2 — verify OTP ─────────────────────────────────────────────

  const handleSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault(); clear();
    if (otp.length < 6) return setError('Please enter the complete 6-digit code.');
    setBusy(true);
    try {
      const res = await customerVerifyOtpApi(email.trim().toLowerCase(), otp);
      await completeCustomAuthSession(res.token, { id: res.user.id, email: res.user.email, name: res.user.name, picture: '' });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect or expired code.');
    } finally {
      setBusy(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────────

  const resend = async () => {
    clear(); setBusy(true);
    try {
      if (step === 'admin_otp') {
        await adminRequestOtpApi(email.trim().toLowerCase(), password);
        setSuccess('New admin OTP sent to indesignluxuryfabrics@gmail.com');
      } else if (step === 'login_otp') {
        await customerLoginApi(email.trim().toLowerCase(), password);
        setSuccess(`New code sent to ${email}`);
      } else {
        await customerSignupApi(name.trim(), phone.trim(), email.trim().toLowerCase(), password);
        setSuccess(`New code sent to ${email}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // ── Loading guard ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1F0505]" />
      </div>
    );
  }

  // ── Backend not yet deployed — show setup notice ─────────────────────────────
  if (!isSheetsConfigured) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ borderTop: '2px solid #1F0505' }}>
        <div className="flex items-center justify-between px-6 md:px-12 py-4" style={{ borderBottom: '1px solid #1F0505' }}>
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/logo/logo-mark.png" alt="" className="h-8 w-auto" />
            <div>
              <div className="font-serif text-[17px] tracking-[0.14em] text-[#1F0505] uppercase font-medium">In Design</div>
              <div className="font-sans text-[7px] tracking-[0.32em] text-[#1F0505]/40 uppercase mt-0.5">Luxury Fabrics</div>
            </div>
          </Link>
          <Link to="/" className="font-sans text-[9px] tracking-[0.2em] text-[#1F0505]/50 uppercase font-semibold hover:text-[#1F0505] transition-colors">← Back to Shop</Link>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-[440px] bg-white p-8" style={{ border: '1px solid #1F0505' }}>
            <p className="font-sans text-[9px] tracking-[0.28em] text-[#1F0505]/40 uppercase font-bold mb-3">Setup Required</p>
            <h1 className="font-serif text-[26px] text-[#1F0505] mb-4">Backend not configured</h1>
            <p className="font-sans text-[13px] text-[#1F0505]/60 leading-relaxed mb-6">
              The Google Sheets backend hasn't been deployed yet. Customer accounts, OTP login, and order storage won't work until the Apps Script is deployed and the URL is set in <code className="bg-[#1F0505]/5 px-1.5 py-0.5 font-mono text-[12px]">.env.local</code>.
            </p>
            <div className="p-4 font-mono text-[11px] text-[#1F0505]/70 leading-relaxed space-y-1" style={{ border: '1px solid rgba(31,5,5,0.15)', background: '#FAFAFA' }}>
              <p className="font-sans text-[8px] tracking-[0.22em] uppercase font-bold text-[#1F0505]/40 mb-2">Steps</p>
              <p>1. Deploy <strong>IDF_Backend.gs</strong> to Google Apps Script</p>
              <p>2. Set <strong>VITE_APPS_SCRIPT_URL</strong> in <strong>.env.local</strong></p>
              <p>3. Restart dev server: <strong>npm run dev</strong></p>
            </div>
            <Link to="/" className="mt-6 block text-center font-sans text-[10px] tracking-[0.14em] text-[#1F0505]/40 hover:text-[#1F0505] transition-colors uppercase">
              Continue browsing as guest →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOtpStep = step === 'login_otp' || step === 'signup_otp' || step === 'admin_otp';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ borderTop: '2px solid #1F0505' }}>

      {/* Top bar */}
      <div
        className="w-full grid grid-cols-3 items-center px-6 md:px-12 py-4"
        style={{ borderBottom: '1px solid #1F0505' }}
      >
        <div />
        <Link to="/" className="flex items-center justify-center gap-3" aria-label="Home">
          <img src="/images/logo/logo-mark.png" alt="" className="h-8 w-auto" />
          <div className="text-left">
            <div className="font-serif text-[17px] tracking-[0.14em] text-[#1F0505] uppercase leading-none font-medium">In Design</div>
            <div className="font-sans text-[7px] tracking-[0.32em] text-[#1F0505]/40 uppercase mt-0.5">Luxury Fabrics</div>
          </div>
        </Link>
        <div className="flex justify-end">
          <Link to="/" className="font-sans text-[9px] tracking-[0.2em] text-[#1F0505]/50 uppercase font-semibold hover:text-[#1F0505] transition-colors">
            ← Back to Shop
          </Link>
        </div>
      </div>

      {/* Center card */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-[#FAFAFA]">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl overflow-hidden border border-[#1F0505]/20">

          {/* Card header */}
          <div className="px-8 pt-8 pb-6 bg-[#FFE6E9]/20" style={{ borderBottom: '1px solid rgba(31,5,5,0.1)' }}>
            {isOtpStep ? (
              <div className="text-center">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-2xl bg-white shadow-sm"
                  style={{ border: '1px solid rgba(31,5,5,0.2)' }}
                >
                  <ShieldCheck className="h-6 w-6 text-[#1F0505]" strokeWidth={1.5} />
                </div>
                <h1 className="font-serif text-[26px] text-[#1F0505] leading-tight">Verify your {step === 'admin_otp' ? 'admin' : 'email'}</h1>
                <p className="font-sans text-[12px] text-[#1F0505]/60 mt-2 leading-relaxed">
                  {step === 'admin_otp'
                    ? 'A 6-digit code was sent to virtuosodhanush@gmail.com'
                    : <>A 6-digit code was sent to <span className="text-[#1F0505] font-semibold">{email}</span></>
                  }
                </p>
              </div>
            ) : (
              <>
                <p className="font-sans text-[9px] tracking-[0.3em] text-[#1F0505]/50 uppercase font-semibold mb-2">
                  {step === 'signup' ? 'Create Account' : 'Customer Login'}
                </p>
                <h1 className="font-serif text-[30px] text-[#1F0505] leading-tight">
                  {step === 'signup' ? 'Join IN DESIGN' : 'Welcome Back'}
                </h1>
              </>
            )}
          </div>

          {/* Tab switcher (only on login/signup) */}
          {!isOtpStep && (
            <div className="p-2 bg-[#FAFAFA]" style={{ borderBottom: '1px solid rgba(31,5,5,0.1)' }}>
              <div className="grid grid-cols-2 gap-1 bg-[#1F0505]/5 p-1 rounded-xl">
                {(['login', 'signup'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setStep(t); clear(); }}
                    className={`py-2.5 rounded-lg font-sans text-[10px] font-bold tracking-[0.18em] uppercase transition-all ${
                      step === t
                        ? 'bg-[#1F0505] text-white shadow-sm'
                        : 'text-[#1F0505]/60 hover:text-[#1F0505]'
                    }`}
                  >
                    {t === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="px-8">
            {error && (
              <div className="mt-5 p-4 rounded-xl font-sans text-[11px] text-red-700 bg-red-50 border border-red-200 space-y-2.5">
                <p>{error}</p>
                {(error.toLowerCase().includes('admin') || email.toLowerCase().includes('virtuosodhanush')) && (
                  <div className="pt-2 border-t border-red-200/80">
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F0505] text-white font-bold text-[10.5px] uppercase tracking-wider hover:bg-[#1F0505]/90 transition-colors shadow-sm"
                    >
                      <ShieldCheck className="h-4 w-4 text-[#B8860B]" />
                      Go to Admin Portal (/#/admin) →
                    </Link>
                  </div>
                )}
              </div>
            )}
            {success && (
              <div className="mt-5 p-3 rounded-xl font-sans text-[11px] text-[#1F0505] bg-[#FFE6E9]/60 border border-[#1F0505]/20 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                {success}
              </div>
            )}
          </div>

          {/* Forms */}
          <div className="px-8 pb-8 pt-6">
            <AnimatePresence mode="wait">

              {/* ── LOGIN FORM ─────────────────────────────────────── */}
              {step === 'login' && (
                <motion.form key="login" onSubmit={handleLogin}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                  className="space-y-5"
                >
                  <Field label="Email Address">
                    <input type="email" required autoComplete="email" value={email}
                      onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                  </Field>
                  <Field label="Password">
                    <input type="password" required autoComplete="current-password" value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="Your password" />
                  </Field>
                  <SubmitBtn busy={busy}>Sign In →</SubmitBtn>
                </motion.form>
              )}

              {/* ── SIGNUP FORM ────────────────────────────────────── */}
              {step === 'signup' && (
                <motion.form key="signup" onSubmit={handleSignup}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                  className="space-y-5"
                >
                  <Field label="Full Name">
                    <input type="text" required autoComplete="name" value={name}
                      onChange={e => setName(e.target.value)} placeholder="Your full name" />
                  </Field>
                  <Field label="Phone Number">
                    <input type="tel" required autoComplete="tel" value={phone}
                      onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                  </Field>
                  <Field label="Email Address">
                    <input type="email" required autoComplete="email" value={email}
                      onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                  </Field>
                  <Field label="Create Password">
                    <input type="password" required autoComplete="new-password" value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" />
                  </Field>
                  <SubmitBtn busy={busy}>Create Account →</SubmitBtn>
                </motion.form>
              )}

              {/* ── OTP FORM (login + signup + admin share) ────────── */}
              {isOtpStep && (
                <motion.form
                  key="otp"
                  onSubmit={step === 'login_otp' ? handleLoginOtp : step === 'admin_otp' ? handleAdminOtp : handleSignupOtp}
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                  className="space-y-6"
                >
                  {/* Back button */}
                  <button type="button"
                    onClick={() => { setStep(step === 'signup_otp' ? 'signup' : 'login'); clear(); }}
                    className="flex items-center gap-1.5 font-sans text-[11px] text-[#1F0505]/60 hover:text-[#1F0505] transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>

                  {/* 6-box OTP input */}
                  <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[i] || ''}
                        onChange={e => handleOtpChar(i, e.target.value)}
                        onKeyDown={e => handleOtpKey(i, e)}
                        className="w-11 h-12 text-center font-sans text-[20px] font-bold text-[#1F0505] bg-white rounded-xl outline-none transition-all"
                        style={{
                          border: otp[i] ? '2px solid #1F0505' : '1px solid rgba(31,5,5,0.25)',
                          caretColor: '#1F0505',
                        }}
                      />
                    ))}
                  </div>

                  <SubmitBtn busy={busy}>Verify & Continue →</SubmitBtn>

                  <p className="text-center font-sans text-[11px] text-[#1F0505]/50">
                    Didn't receive it?{' '}
                    <button type="button" onClick={resend} disabled={busy}
                      className="text-[#1F0505] font-semibold underline underline-offset-2 disabled:opacity-50 hover:no-underline">
                      Resend code
                    </button>
                  </p>
                </motion.form>
              )}

            </AnimatePresence>
          </div>

          {/* Footer link */}
          <div className="px-8 py-4 text-center bg-[#FAFAFA]" style={{ borderTop: '1px solid rgba(31,5,5,0.08)' }}>
            <Link to="/" className="font-sans text-[10px] tracking-[0.12em] text-[#1F0505]/50 hover:text-[#1F0505] font-semibold transition-colors">
              Continue browsing as guest →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="px-6 md:px-12 py-4 flex flex-wrap items-center justify-between gap-3"
        style={{ borderTop: '1px solid rgba(31,5,5,0.12)' }}
      >
        <p className="font-sans text-[9px] text-[#1F0505]/40 tracking-[0.15em] uppercase">
          © {new Date().getFullYear()} {BUSINESS.legalName}
        </p>
        <div className="flex gap-4">
          <a href="#" className="font-sans text-[9px] text-[#1F0505]/40 hover:text-[#1F0505] uppercase tracking-[0.15em] transition-colors">Privacy</a>
          <a href="#" className="font-sans text-[9px] text-[#1F0505]/40 hover:text-[#1F0505] uppercase tracking-[0.15em] transition-colors">Terms</a>
        </div>
      </div>
    </div>
  );
}

// ── Small reusable sub-components ─────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-sans text-[9px] tracking-[0.22em] text-[#1F0505]/60 uppercase font-bold mb-2">
        {label}
      </label>
      <div className="[&_input]:w-full [&_input]:border [&_input]:border-[#1F0505]/20 [&_input]:rounded-xl [&_input]:px-4 [&_input]:py-3.5 [&_input]:font-sans [&_input]:text-[14px] [&_input]:text-[#1F0505] [&_input]:bg-white [&_input]:outline-none [&_input:focus]:border-[#1F0505] [&_input:focus]:ring-2 [&_input:focus]:ring-[#1F0505]/10 [&_input]:transition-all [&_input::placeholder]:text-[#1F0505]/30">
        {children}
      </div>
    </div>
  );
}

function SubmitBtn({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full py-3.5 bg-[#1F0505] text-white rounded-xl font-sans text-[11px] font-bold tracking-[0.22em] uppercase hover:bg-[#3a0a0a] hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
