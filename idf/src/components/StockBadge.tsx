import { STOCK_LABELS, type Stock } from '../data/catalog';

const STYLES: Record<Stock, string> = {
  in: 'bg-emerald-900/80 text-emerald-100 ring-emerald-400/30',
  low: 'bg-amber-900/80 text-amber-100 ring-amber-400/30',
  out: 'bg-night/85 text-ivory/80 ring-ivory/25',
};

export default function StockBadge({ stock }: { stock: Stock }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1 backdrop-blur-sm ${STYLES[stock]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          stock === 'in' ? 'bg-emerald-400' : stock === 'low' ? 'bg-amber-400' : 'bg-ivory/50'
        }`}
        aria-hidden="true"
      />
      {STOCK_LABELS[stock]}
    </span>
  );
}
