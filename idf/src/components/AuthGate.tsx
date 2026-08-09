import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isGoogleAuthConfigured, renderGoogleButton } from '../lib/googleAuth';

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

interface Props {
  /** When true, renders inline (no outer max-width container). Used inside AuthModal. */
  compact?: boolean;
}

export default function AuthGate({ compact = false }: Props) {
  const { signInWithGoogle, enabled } = useAuth();
  const [gsiLoaded, setGsiLoaded] = useState(Boolean(window.google?.accounts?.id));
  const [useNativeButton, setUseNativeButton] = useState(false);
  const btnContainerRef = useRef<HTMLDivElement>(null);

  // Wait for the GSI script to load (async in index.html)
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

  // Once GSI is loaded, try to render the native Google button
  useEffect(() => {
    if (!gsiLoaded || !btnContainerRef.current) return;
    // Give the container a stable ID for renderGoogleButton
    const id = 'idf-google-btn';
    btnContainerRef.current.id = id;
    renderGoogleButton(id);
    setUseNativeButton(true);
  }, [gsiLoaded]);

  if (!enabled) {
    return (
      <div className={compact ? '' : 'mx-auto max-w-xs'}>
        <p className="text-center text-[13px] text-ivory/50">
          Sign-in is not configured on this site yet.
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'mx-auto max-w-xs'}>
      <div className="space-y-4">
        {/* Native Google button (rendered by GSI) — shown when script loaded */}
        <div
          ref={btnContainerRef}
          className={useNativeButton ? 'w-full flex justify-center' : 'hidden'}
        />

        {/* Fallback styled button — shown while GSI loads or as backup */}
        {!useNativeButton && (
          <button
            type="button"
            onClick={gsiLoaded ? signInWithGoogle : undefined}
            disabled={!gsiLoaded}
            className="flex w-full items-center justify-center gap-2.5 rounded-[3px] border border-gold/25 bg-chocolate/60 py-3.5 text-[13px] font-semibold text-ivory transition-all hover:border-gold hover:bg-chocolate disabled:opacity-50"
          >
            {gsiLoaded ? (
              <>
                <GoogleMark />
                Continue with Google
              </>
            ) : (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </>
            )}
          </button>
        )}

        <p className="pt-1 text-center text-[11px] text-ivory/40">
          Accounts let you view order history and save wishlists.
        </p>
      </div>
    </div>
  );
}
