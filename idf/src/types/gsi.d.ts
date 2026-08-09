/**
 * gsi.d.ts — type declarations for the Google Identity Services browser library.
 * Loaded via <script src="https://accounts.google.com/gsi/client"> in index.html.
 */

interface GsiButtonConfiguration {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number | string;
}

interface IdConfiguration {
  client_id: string;
  callback: (response: { credential: string }) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface Google {
  accounts: {
    id: {
      initialize: (config: IdConfiguration) => void;
      prompt: (notification?: (n: { isNotDisplayed(): boolean; isSkippedMoment(): boolean }) => void) => void;
      renderButton: (element: HTMLElement, config: GsiButtonConfiguration) => void;
      disableAutoSelect: () => void;
      revoke: (hint: string, done: () => void) => void;
    };
  };
}

declare global {
  interface Window {
    google?: Google;
  }
}

export {};
