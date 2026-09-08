import { useState, useEffect } from 'react';
import { suggestGarmentIds } from '../lib/suggestGarments';
import { GARMENT_YARDAGE } from '../data/garmentYardage';
import {
  X,
  Plus,
  Trash2,
  ImagePlus,
  ChevronDown,
  Upload,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Sparkles,
  Percent,
  Layers,
  AlertCircle,
  Tag as TagIcon,
} from 'lucide-react';
import {
  STOCK_VALUES,
  TAG_VALUES,
  TAG_LABELS,
  type Item,
  type Stock,
  type Tag,
  type Category,
} from '../data/catalog';
import { DEFAULT_CATEGORIES, type CategoryConfig } from '../lib/categories';
import { fetchProductById } from '../lib/adminApi';

interface Props {
  productId?: string | null;
  initialItem?: Item;
  onSave: (item: Item) => void | Promise<void>;
  onClose: () => void;
  categories?: CategoryConfig[];
}

// Extra helpful luxury tag chips
const EXPANDED_TAGS: Array<{ id: string; label: string }> = [
  { id: 'best-seller', label: 'Best Selling' },
  { id: 'new-arrival', label: 'New Arrival' },
  { id: 'bridal', label: 'Bridal Couture' },
  { id: 'pure-silk', label: 'Pure Silk' },
  { id: 'festival', label: 'Festive Edit' },
  { id: 'seasonal', label: 'Seasonal Edit' },
  { id: 'wholesale', label: 'Wholesale' },
  { id: 'combo', label: 'Combo Deal' },
];

function generateId(name: string): string {
  const baseSlug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'fabric';
  return `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function AddProductModal({
  productId,
  initialItem,
  onSave,
  onClose,
  categories = DEFAULT_CATEGORIES,
}: Props) {
  const isEditing = Boolean(productId);

  // Loading & sync state
  const [isLoadingProduct, setIsLoadingProduct] = useState(Boolean(productId));
  const [sheetFetchedItem, setSheetFetchedItem] = useState<Item | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [revertNotice, setRevertNotice] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.slug || DEFAULT_CATEGORIES[0].slug);
  const [composition, setComposition] = useState('');
  const [width, setWidth] = useState('44 in');
  const [pricePerMetre, setPricePerMetre] = useState<number | ''>('');
  const [mrp, setMrp] = useState<number | ''>('');
  const [minMetres, setMinMetres] = useState<number | ''>(0.5);
  const [stock, setStock] = useState<Stock>('in');
  const [tags, setTags] = useState<string[]>(['new-arrival']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [isComboEligible, setIsComboEligible] = useState(false);
  const [image, setImage] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [blurb, setBlurb] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [suggestedGarments, setSuggestedGarments] = useState<string[]>([]);
  const [hasManuallyEditedGarments, setHasManuallyEditedGarments] = useState(false);

  // Helper to populate all form fields from a loaded Item
  const populateFields = (item: Item) => {
    setName(item.name || '');

    // Match category
    let matchedCatSlug = item.categoryId;
    if (!matchedCatSlug && item.category) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === item.category.toLowerCase()
      );
      if (match) matchedCatSlug = match.slug;
    }
    setCategoryId(matchedCatSlug || categories[0]?.slug || 'contemporary');

    setComposition(item.composition || '');
    setWidth(item.width || '44 in');
    setPricePerMetre(item.pricePerMetre ?? '');
    setMrp(item.mrp ?? '');
    setMinMetres(item.minMetres ?? 0.5);
    setStock(item.stock || 'in');

    const itemTags = Array.isArray(item.tags)
      ? item.tags
      : typeof item.tags === 'string'
      ? (item.tags as string).split(/[|,]/).map((s) => s.trim()).filter(Boolean)
      : [];
    setTags(itemTags);
    setIsComboEligible(itemTags.includes('combo'));

    setIsLive(!item.hidden);
    setImage(item.image || '');
    setGallery(item.gallery ? [...item.gallery] : []);
    setBlurb(item.blurb || '');
    setDetails(item.details || item.blurb || '');
    setSuggestedGarments(item.suggestedGarmentIds ? [...item.suggestedGarmentIds] : []);
    setHasManuallyEditedGarments(Boolean(item.suggestedGarmentIds?.length));
  };

  // 1. Fetch fresh canonical data by product ID from Google Sheets backend
  useEffect(() => {
    if (!productId) {
      if (initialItem) {
        populateFields(initialItem);
      }
      return;
    }

    let isMounted = true;
    setIsLoadingProduct(true);
    setError('');

    fetchProductById(productId)
      .then((item) => {
        if (!isMounted) return;
        if (item) {
          setSheetFetchedItem(item);
          populateFields(item);
        } else if (initialItem) {
          setSheetFetchedItem(initialItem);
          populateFields(initialItem);
        } else {
          setError(`Product "${productId}" could not be retrieved from Google Sheets.`);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load fresh product:', err);
        if (initialItem) {
          setSheetFetchedItem(initialItem);
          populateFields(initialItem);
        } else {
          setError(`Google Sheets fetch error: ${err instanceof Error ? err.message : String(err)}`);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingProduct(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Trigger auto-suggestion for garment types whenever name or category changes (unless manually overridden)
  useEffect(() => {
    if (!hasManuallyEditedGarments && !isEditing) {
      const suggestions = suggestGarmentIds({ categoryId, name, description: blurb });
      setSuggestedGarments(suggestions);
    }
  }, [name, categoryId, blurb, hasManuallyEditedGarments, isEditing]);

  const toggleGarment = (id: string) => {
    setHasManuallyEditedGarments(true);
    setSuggestedGarments((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleTag = (tagId: string) => {
    setTags((prev) => {
      const next = prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId];
      if (tagId === 'combo') {
        setIsComboEligible(next.includes('combo'));
      }
      return next;
    });
  };

  const addCustomTag = () => {
    const clean = customTagInput.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    if (!clean) return;
    if (!tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
    }
    setCustomTagInput('');
  };

  const toggleComboEligibility = () => {
    const nextVal = !isComboEligible;
    setIsComboEligible(nextVal);
    setTags((prev) => {
      if (nextVal) {
        return prev.includes('combo') ? prev : [...prev, 'combo'];
      } else {
        return prev.filter((t) => t !== 'combo');
      }
    });
  };

  const addGallerySlot = () => setGallery((prev) => [...prev, '']);
  const removeGallerySlot = (i: number) =>
    setGallery((prev) => prev.filter((_, idx) => idx !== i));
  const updateGallery = (i: number, val: string) =>
    setGallery((prev) => prev.map((v, idx) => (idx === i ? val : v)));

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isMain: boolean,
    galleryIndex?: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('File size must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (isMain) {
          setImage(dataUrl);
        } else if (typeof galleryIndex === 'number') {
          updateGallery(galleryIndex, dataUrl);
        } else {
          setGallery((prev) => [...prev, dataUrl]);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Revert / Discard: reload Sheet-fetched values
  const handleDiscardToSheet = () => {
    if (sheetFetchedItem) {
      populateFields(sheetFetchedItem);
      setError('');
      setRevertNotice(true);
      setTimeout(() => setRevertNotice(false), 2500);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return setError('Product name is required.');
    if (!image.trim()) return setError('At least one image URL or uploaded photo is required.');
    if (!blurb.trim()) return setError('A short description (blurb) is required.');
    if (!pricePerMetre || Number(pricePerMetre) <= 0)
      return setError('A valid price per metre is required.');
    if (!composition.trim()) return setError('Composition / fabric description is required.');

    setError('');
    setIsSaving(true);

    try {
      const activeCat = categories.find((c) => c.slug === categoryId);
      const categoryName = (activeCat ? activeCat.name : 'Contemporary') as Category;

      // Make sure 'combo' is synced into tags if combo is eligible
      const finalTags = isComboEligible
        ? tags.includes('combo')
          ? tags
          : [...tags, 'combo']
        : tags.filter((t) => t !== 'combo');

      // Preserve existing canonical ID when editing; otherwise generate a new unique ID
      const targetId = productId || (sheetFetchedItem ? sheetFetchedItem.id : generateId(name));

      const updatedItem: Item = {
        id: targetId,
        name: name.trim(),
        category: categoryName,
        categoryId,
        composition: composition.trim(),
        width: width.trim() || '44 in',
        pricePerMetre: Number(pricePerMetre),
        ...(mrp && Number(mrp) > 0 ? { mrp: Number(mrp) } : {}),
        minMetres: Number(minMetres) || 0.5,
        stock,
        tags: finalTags as Tag[],
        image: image.trim(),
        gallery: gallery.filter((g) => g.trim() !== ''),
        blurb: blurb.trim(),
        details: details.trim() || blurb.trim(),
        suggestedGarmentIds: suggestedGarments,
        hidden: !isLive,
      };

      await onSave(updatedItem);
      setSaveSuccess(true);
    } catch (err) {
      setError(
        'Save failed: ' + (err instanceof Error ? err.message : String(err))
      );
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#d4af37]/30 bg-[#160b09] shadow-2xl text-ivory">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#d4af37]/20 bg-[#160b09]/95 backdrop-blur-md px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#d4af37] px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/25">
                {isEditing ? 'Edit Fabric' : 'New Catalog Item'}
              </span>
              {isEditing && productId && (
                <span className="text-[10px] font-mono text-white/40 truncate max-w-[140px] sm:max-w-[200px]">
                  ID: {productId}
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl text-white mt-0.5">
              {isEditing ? name || 'Edit Fabric' : 'Add New Fabric'}
            </h2>
            <p className="text-[11px] text-[#d4af37]/80 font-medium mt-0.5">
              {isEditing
                ? 'Pulled live from Google Sheets — updates row directly & invalidates shop cache.'
                : 'Upload fabric photos & details — auto-publishes live to website.'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-ivory/10 text-ivory/70 hover:text-white hover:bg-[#d4af37]/20 transition-all disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loading Fresh Record Skeleton */}
        {isLoadingProduct ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mx-auto animate-pulse">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <p className="font-serif text-lg text-white">
              Connecting to Google Sheets Database…
            </p>
            <p className="text-[11px] text-white/50 max-w-sm mx-auto">
              Fetching fresh canonical record for ID <span className="text-[#d4af37] font-mono">{productId}</span> to guarantee no stale data is overwritten.
            </p>
          </div>
        ) : (
          /* Body */
          <div className="p-6 space-y-6">
            {error && (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-[12px] text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {revertNotice && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-[12px] text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>All fields reverted to the values fetched from Google Sheets.</span>
              </div>
            )}

            {/* Basic Info */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#d4af37]">
                  Basic Information
                </h3>
                {isEditing && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Live Sheet Linked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-semibold text-ivory/70 uppercase tracking-wider">
                    Product Title / Name *
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Banarasi Kadhwa Brocade"
                    className="w-full rounded-2xl border border-ivory/15 bg-black/40 px-4 py-2.5 text-[13px] text-ivory outline-none focus:border-[#d4af37] transition-colors"
                  />
                </div>

                {/* Website Visibility (Live / Draft) */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-ivory/70 uppercase tracking-wider">
                    Website Visibility *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLive(true)}
                      className={`flex-1 py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        isLive
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md'
                          : 'border-ivory/15 bg-black/30 text-ivory/50 hover:border-ivory/30'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isLive ? 'bg-emerald-400 animate-pulse' : 'bg-ivory/40'
                        }`}
                      />
                      Live on Website
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLive(false)}
                      className={`flex-1 py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        !isLive
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-md'
                          : 'border-ivory/15 bg-black/30 text-ivory/50 hover:border-ivory/30'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          !isLive ? 'bg-rose-400' : 'bg-ivory/40'
                        }`}
                      />
                      Draft / Not Live
                    </button>
                  </div>
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-ivory/70 uppercase tracking-wider">
                    Category *
                  </label>
                  <div className="relative">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-ivory/15 bg-black/40 px-4 py-2.5 text-[13px] text-ivory outline-none focus:border-[#d4af37] transition-colors"
                    >
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug} className="bg-[#180e0c] text-white">
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/40" />
                  </div>
                </div>

                {/* Stock Status Dropdown */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-ivory/70 uppercase tracking-wider">
                    Stock Level *
                  </label>
                  <div className="relative">
                    <select
                      value={stock}
                      onChange={(e) => setStock(e.target.value as Stock)}
                      className="w-full appearance-none rounded-2xl border border-ivory/15 bg-black/40 px-4 py-2.5 text-[13px] text-ivory outline-none focus:border-[#d4af37] transition-colors"
                    >
                      {STOCK_VALUES.map((s) => (
                        <option key={s} value={s} className="bg-[#180e0c] text-white">
                          {s === 'in'
                            ? 'In Stock'
                            : s === 'low'
                            ? 'Low Stock (Few Metres Left)'
                            : 'Out of Stock (Unavailable)'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/40" />
                  </div>
                </div>

                {/* Combo Eligibility Toggle */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-ivory/70 uppercase tracking-wider">
                    Combo Eligibility *
                  </label>
                  <button
                    type="button"
                    onClick={toggleComboEligibility}
                    className={`w-full py-2.5 px-3.5 rounded-2xl border text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-between ${
                      isComboEligible
                        ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37] shadow-md'
                        : 'border-ivory/15 bg-black/30 text-ivory/50 hover:border-ivory/30'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5" />
                      <span>{isComboEligible ? 'Combo Deal Eligible' : 'Standard Fabric'}</span>
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isComboEligible ? 'bg-[#d4af37] animate-pulse' : 'bg-ivory/30'
                      }`}
                    />
                  </button>
                </div>

                {/* Composition */}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-semibold text-ivory/70 uppercase tracking-wider">
                    Composition / Material Specs *
                  </label>
                  <input
                    value={composition}
                    onChange={(e) => setComposition(e.target.value)}
                    placeholder="e.g. Katan Silk · Tested Real Zari · Pure Mulberry"
                    className="w-full rounded-2xl border border-ivory/15 bg-black/40 px-4 py-2.5 text-[13px] text-ivory outline-none focus:border-[#d4af37] transition-colors"
                  />
                </div>

                {/* Width & Min Metres */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-ivory/70 uppercase tracking-wider">
                    Fabric Width
                  </label>
                  <input
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="44 in"
                    className="w-full rounded-2xl border border-ivory/15 bg-black/40 px-4 py-2.5 text-[13px] text-ivory outline-none focus:border-[#d4af37] transition-colors"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-ivory/70 uppercase tracking-wider">
                    Min. Order Metres
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    value={minMetres}
                    onChange={(e) =>
                      setMinMetres(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full rounded-2xl border border-ivory/15 bg-black/40 px-4 py-2.5 text-[13px] text-ivory outline-none focus:border-[#d4af37] transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className="space-y-4 pt-2 border-t border-ivory/10">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#d4af37]">
                Pricing &amp; Margins
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-ivory/70 uppercase tracking-wider">
                    Price Per Metre (₹) *
                  </label>
                  <div className="flex items-center rounded-2xl border border-ivory/15 bg-black/40 px-4 py-2 focus-within:border-[#d4af37] transition-colors">
                    <span className="text-[#d4af37] font-bold mr-2 text-[14px]">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={pricePerMetre}
                      onChange={(e) =>
                        setPricePerMetre(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      placeholder="e.g. 2500"
                      className="w-full bg-transparent text-[13px] text-ivory outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-ivory/70 uppercase tracking-wider">
                    MRP / Strikethrough Price (₹)
                  </label>
                  <div className="flex items-center rounded-2xl border border-ivory/15 bg-black/40 px-4 py-2 focus-within:border-[#d4af37] transition-colors">
                    <span className="text-white/40 font-bold mr-2 text-[14px]">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={mrp}
                      onChange={(e) =>
                        setMrp(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="Optional strikethrough price"
                      className="w-full bg-transparent text-[13px] text-ivory outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Tags & Filters */}
            <section className="space-y-3 pt-2 border-t border-ivory/10">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#d4af37] flex items-center gap-1.5">
                  <TagIcon className="h-3.5 w-3.5" /> Tags &amp; Storefront Filters
                </h3>
                <span className="text-[10px] text-white/40">{tags.length} active tags</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {EXPANDED_TAGS.map((t) => {
                  const active = tags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={`rounded-full border px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                        active
                          ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#d4af37] shadow-sm'
                          : 'border-ivory/15 text-ivory/50 hover:border-ivory/30 hover:text-ivory bg-black/20'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                  placeholder="Add custom tag (e.g. pure-georgette, handloom)…"
                  className="flex-1 rounded-xl border border-ivory/15 bg-black/40 px-3.5 py-1.5 text-[11px] text-ivory outline-none focus:border-[#d4af37]"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/15 text-[#d4af37] px-3.5 py-1.5 text-[11px] font-semibold hover:bg-[#d4af37]/25 transition-all"
                >
                  + Add Tag
                </button>
              </div>
            </section>

            {/* Suggested Garments Checklist */}
            <section className="space-y-3 pt-2 border-t border-ivory/10">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#d4af37]">
                Suggested Garment Types &amp; Yardage Calculator
              </h3>
              <p className="text-[10px] text-ivory/50">
                Garments pre-calculated for client yardage assistant on the product page.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GARMENT_YARDAGE.map((g) => {
                  const active = suggestedGarments.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGarment(g.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2 text-left text-[11px] transition-colors ${
                        active
                          ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#d4af37]'
                          : 'border-ivory/10 text-ivory/65 hover:border-ivory/25 bg-black/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        readOnly
                        className="accent-brand-gold h-3.5 w-3.5"
                      />
                      <span className="truncate">
                        {g.label} ({g.minMetres}–{g.maxMetres}m)
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Images */}
            <section className="space-y-4 pt-2 border-t border-ivory/10">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#d4af37] flex items-center gap-2">
                <Upload className="h-3.5 w-3.5" /> Product Images &amp; Uploads
              </h3>

              {/* Main Product Image Dropzone */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-ivory/70 uppercase tracking-wider">
                  Main Fabric Photo *
                </label>

                {image ? (
                  <div className="relative rounded-2xl border border-[#d4af37]/30 bg-night/70 p-4 flex items-center gap-4 shadow-lg">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[#d4af37]/40 shadow-inner bg-black">
                      <img
                        src={image}
                        alt="Product preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            '/images/fabrics/f01.jpg';
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-semibold">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> Photo Loaded Ready Live
                      </div>
                      <p className="text-[10px] text-ivory/50 truncate max-w-[280px]">
                        {image.startsWith('data:') ? 'Uploaded from device (base64)' : image}
                      </p>
                      <div className="flex gap-2">
                        <label className="cursor-pointer rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 px-3 py-1.5 text-[11px] font-semibold text-[#d4af37] hover:bg-[#d4af37]/30 transition-all inline-flex items-center gap-1.5">
                          <Upload className="h-3 w-3" /> Change Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, true)}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="rounded-xl bg-red-950/40 border border-red-500/30 px-3 py-1.5 text-[11px] text-red-300 hover:bg-red-900/40 transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border-2 border-dashed border-[#d4af37]/30 bg-night/30 hover:bg-[#d4af37]/5 hover:border-[#d4af37]/60 transition-all p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mb-1">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-[13px] font-bold text-ivory tracking-wide">
                        Click or Drag &amp; Drop Fabric Photo Here
                      </p>
                      <p className="text-[11px] text-ivory/50">
                        Direct upload (JPG, PNG, WebP)
                      </p>
                    </div>
                  </div>
                )}

                {/* Alternative Image URL input */}
                <div className="mt-3">
                  <p className="text-[10px] text-ivory/40 uppercase tracking-widest font-semibold mb-1">
                    Or paste image URL
                  </p>
                  <input
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="/images/fabrics/f01.jpg  or  https://..."
                    className="w-full rounded-xl border border-ivory/15 bg-night/50 px-3.5 py-2 text-[12px] text-ivory outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Additional Gallery Photos */}
              <div className="pt-2 border-t border-ivory/10">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[11px] text-ivory/60 font-semibold uppercase tracking-wider">
                    Additional Gallery Photos ({gallery.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-1 text-[11px] text-[#d4af37] hover:underline font-semibold">
                      <Upload className="h-3 w-3" /> Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                    <span className="text-ivory/20">|</span>
                    <button
                      type="button"
                      onClick={addGallerySlot}
                      className="flex items-center gap-1 text-[11px] text-[#d4af37] hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add URL Slot
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {gallery.map((url, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-night/40 p-2 rounded-xl border border-ivory/10"
                    >
                      {url && (
                        <img
                          src={url}
                          alt=""
                          className="h-8 w-8 object-cover rounded border border-[#d4af37]/30 shrink-0"
                        />
                      )}
                      <input
                        value={url}
                        onChange={(e) => updateGallery(i, e.target.value)}
                        placeholder={`Gallery photo ${i + 1} URL or uploaded file`}
                        className="flex-1 rounded-lg border border-ivory/15 bg-night/50 px-3 py-1.5 text-[12px] text-ivory outline-none focus:border-[#d4af37]"
                      />
                      <label className="cursor-pointer p-1.5 text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg shrink-0">
                        <Upload className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, false, i)}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeGallerySlot(i)}
                        className="flex h-8 w-8 items-center justify-center text-ivory/40 hover:text-red-400 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Descriptions */}
            <section className="space-y-4 pt-2 border-t border-ivory/10">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#d4af37]">
                Descriptions
              </h3>
              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">
                  Short Blurb * (shown on product cards)
                </label>
                <textarea
                  rows={2}
                  value={blurb}
                  onChange={(e) => setBlurb(e.target.value)}
                  placeholder="e.g. Whisper-light tulle with hand-couched gold zardozi..."
                  className="w-full rounded-2xl border border-ivory/15 bg-black/40 px-4 py-2.5 text-[13px] text-ivory outline-none focus:border-[#d4af37] resize-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">
                  Full Description (shown on product page)
                </label>
                <textarea
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Longer write-up for the product detail page..."
                  className="w-full rounded-2xl border border-ivory/15 bg-black/40 px-4 py-2.5 text-[13px] text-ivory outline-none focus:border-[#d4af37] resize-none"
                />
              </div>
            </section>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-[#d4af37]/20 bg-[#160b09]/95 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-2xl border border-ivory/20 px-5 py-2.5 text-[12px] font-semibold text-ivory/70 hover:text-white hover:border-ivory/40 transition-all uppercase tracking-wider disabled:opacity-50"
            >
              Cancel
            </button>

            {/* Discard / Revert Button (only in Edit mode when sheet data exists) */}
            {isEditing && sheetFetchedItem && (
              <button
                type="button"
                onClick={handleDiscardToSheet}
                disabled={isSaving || isLoadingProduct}
                title="Revert all fields back to Google Sheets values"
                className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 uppercase tracking-wider disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Revert to Sheet Values</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoadingProduct}
            className="rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[12px] tracking-[0.2em] uppercase px-6 py-3 shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#1F0505]" />
                <span>Saving to Google Sheets…</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-[#1F0505]" />
                <span>Saved &amp; Verified!</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                <span>{isEditing ? 'Save Changes & Sync Live →' : 'Save & Publish Live →'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
