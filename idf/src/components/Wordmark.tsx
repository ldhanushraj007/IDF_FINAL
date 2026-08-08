interface WordmarkProps {
  tone?: 'light' | 'dark';
  className?: string;
  /** 'compact' fits the navbar; 'large' gives the mark more room (preloader, admin login). */
  size?: 'compact' | 'large';
}

/**
 * Logo lockup: the brand's gold mark + the "In Design / Luxury Fabrics" text.
 *
 * The supplied artwork is a tall lockup with the wordmark rotated 90°, which
 * reads beautifully as a vertical plaque but doesn't fit a horizontal navbar.
 * Rather than redraw the logo, this pairs the untouched gold mark (cropped
 * from the same file, pixels unchanged) with the text set normally — the same
 * approach most brand guidelines take for "icon + wordmark" lockups.
 */
export default function Wordmark({ tone = 'light', className = '', size = 'compact' }: WordmarkProps) {
  const markSize = size === 'large' ? 'h-12 w-12 sm:h-14 sm:w-14' : 'h-8 w-8 sm:h-9 sm:w-9';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/images/logo/logo-mark.png"
        alt=""
        aria-hidden="true"
        className={`${markSize} shrink-0 object-contain`}
      />
      <span className="inline-flex flex-col leading-none">
        <span
          className={`font-serif text-[19px] font-semibold uppercase tracking-[0.24em] ${
            tone === 'light' ? 'text-ivory' : 'text-ink'
          }`}
        >
          In&nbsp;Design
        </span>
        <span className="mt-1.5 text-[8.5px] font-semibold uppercase tracking-[0.52em] text-gold">
          Luxury&nbsp;Fabrics
        </span>
      </span>
    </span>
  );
}
