import { useState, useEffect } from 'react';
import { suggestGarmentIds } from '../lib/suggestGarments';
import { GARMENT_YARDAGE } from '../data/garmentYardage';
import { X, Plus, Trash2, ImagePlus, ChevronDown } from 'lucide-react';
import {
  CATEGORY_VALUES,
  STOCK_VALUES,
  TAG_VALUES,
  TAG_LABELS,
  type Item,
  type Stock,
  type Tag,
  type Category,
} from '../data/catalog';

import { DEFAULT_CATEGORIES } from '../lib/categories';

interface Props {
  onSave: (item: Item) => void;
  onClose: () => void;
}

function generateId(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    `fabric-${Math.random().toString(36).slice(2, 7)}`
  );
}

export default function AddProductModal({ onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(DEFAULT_CATEGORIES[0].slug);
  const [composition, setComposition] = useState('');
  const [width, setWidth] = useState('44 in');
  const [pricePerMetre, setPricePerMetre] = useState<number | ''>('');
  const [mrp, setMrp] = useState<number | ''>('');
  const [minMetres, setMinMetres] = useState<number | ''>(0.5);
  const [stock, setStock] = useState<Stock>('in');
  const [tags, setTags] = useState<Tag[]>(['new-arrival']);
  const [image, setImage] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [blurb, setBlurb] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [suggestedGarments, setSuggestedGarments] = useState<string[]>([]);
  const [hasManuallyEditedGarments, setHasManuallyEditedGarments] = useState(false);

  // Trigger auto-suggestion whenever name or categoryId changes (until manual override)
  useEffect(() => {
    if (!hasManuallyEditedGarments) {
      const suggestions = suggestGarmentIds({ categoryId, name, description: blurb });
      setSuggestedGarments(suggestions);
    }
  }, [name, categoryId, blurb, hasManuallyEditedGarments]);

  const toggleGarment = (id: string) => {
    setHasManuallyEditedGarments(true);
    setSuggestedGarments((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleTag = (tag: Tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const addGallerySlot = () => setGallery((prev) => [...prev, '']);
  const removeGallerySlot = (i: number) =>
    setGallery((prev) => prev.filter((_, idx) => idx !== i));
  const updateGallery = (i: number, val: string) =>
    setGallery((prev) => prev.map((v, idx) => (idx === i ? val : v)));

  const handleSave = () => {
    if (!name.trim()) return setError('Product name is required.');
    if (!image.trim()) return setError('At least one image URL is required.');
    if (!blurb.trim()) return setError('A short description (blurb) is required.');
    if (!pricePerMetre || Number(pricePerMetre) <= 0)
      return setError('A valid price per metre is required.');
    if (!composition.trim()) return setError('Composition / fabric description is required.');

    setError('');

    const matchedCat = DEFAULT_CATEGORIES.find(c => c.slug === categoryId);

    const newItem: Item = {
      id: generateId(name),
      name: name.trim(),
      category: (matchedCat ? matchedCat.name : 'Contemporary') as Category,
      categoryId,
      composition: composition.trim(),
      width: width.trim() || '44 in',
      pricePerMetre: Number(pricePerMetre),
      ...(mrp && Number(mrp) > 0 ? { mrp: Number(mrp) } : {}),
      minMetres: Number(minMetres) || 0.5,
      stock,
      tags,
      image: image.trim(),
      blurb: blurb.trim(),
      ...(gallery.filter((g) => g.trim()).length > 0
        ? { gallery: gallery.filter((g) => g.trim()) }
        : {}),
      ...(details.trim() ? { details: details.trim() } : {}),
      suggestedGarmentIds: suggestedGarments,
    };

    onSave(newItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[4px] border border-gold/20 bg-chocolate shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/15 bg-chocolate px-6 py-4">
          <div>
            <h2 className="font-serif text-xl text-ivory">Add New Product</h2>
            <p className="text-[11px] text-ivory/40 mt-0.5">
              Fill in the details below, then click Save &amp; Publish Live.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded text-ivory/50 hover:text-ivory transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded border border-maroon/30 bg-maroon/10 px-4 py-3 text-[12px] text-maroon">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] text-ivory/50">Product Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Banarasi Kadhwa Brocade"
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">Category *</label>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full appearance-none rounded border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold"
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/40" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">Stock Status</label>
                <div className="relative">
                  <select
                    value={stock}
                    onChange={(e) => setStock(e.target.value as Stock)}
                    className="w-full appearance-none rounded border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold"
                  >
                    {STOCK_VALUES.map((s) => (
                      <option key={s} value={s}>
                        {s === 'in' ? 'In Stock' : s === 'low' ? 'Low Stock' : 'Out of Stock'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/40" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] text-ivory/50">
                  Composition / Material *
                </label>
                <input
                  value={composition}
                  onChange={(e) => setComposition(e.target.value)}
                  placeholder="e.g. Katan Silk · Tested Real Zari"
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">Width</label>
                <input
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="44 in"
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">Min. Metres</label>
                <input
                  type="number"
                  min={1}
                  value={minMetres}
                  onChange={(e) => setMinMetres(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold"
                />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
              Pricing
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">
                  Price Per Metre (₹) *
                </label>
                <input
                  type="number"
                  min={0}
                  value={pricePerMetre}
                  onChange={(e) =>
                    setPricePerMetre(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="e.g. 2500"
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">
                  MRP / Original Price (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Optional — for save badge"
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold"
                />
              </div>
            </div>
          </section>

          {/* Garment Suggestions Checklist */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
              Suggested Garment Types (How Much Fabric Do I Need?)
            </h3>
            <p className="text-[10px] text-ivory/50">Select garments that apply to this fabric. Pre-filled based on description keywords.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {GARMENT_YARDAGE.map((g) => {
                const active = suggestedGarments.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGarment(g.id)}
                    className={`flex items-center gap-2 rounded border p-2 text-left text-[11px] transition-colors ${
                      active
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-ivory/10 text-ivory/65 hover:border-ivory/20'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      readOnly
                      className="accent-brand-gold h-3.5 w-3.5"
                    />
                    <span>{g.label} ({g.minMetres}–{g.maxMetres}m)</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Tags */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
              Tags / Filters
            </h3>
            <div className="flex flex-wrap gap-2">
              {TAG_VALUES.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                      active
                        ? 'border-gold bg-gold/15 text-gold'
                        : 'border-ivory/15 text-ivory/50 hover:border-ivory/30 hover:text-ivory'
                    }`}
                  >
                    {TAG_LABELS[tag]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Images */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
              Images
            </h3>

            <div>
              <label className="mb-1 block text-[11px] text-ivory/50">Main Image URL *</label>
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/images/fabrics/f01.jpg  or  https://..."
                className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold"
              />
              {image && (
                <div className="mt-2 h-24 w-24 overflow-hidden rounded border border-gold/20">
                  <img
                    src={image}
                    alt="preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[11px] text-ivory/50">Gallery Images (additional photos)</label>
                <button
                  type="button"
                  onClick={addGallerySlot}
                  className="flex items-center gap-1 text-[11px] text-gold hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add image
                </button>
              </div>
              <div className="space-y-2">
                {gallery.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={url}
                      onChange={(e) => updateGallery(i, e.target.value)}
                      placeholder={`Gallery image ${i + 1} URL`}
                      className="flex-1 rounded border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={() => removeGallerySlot(i)}
                      className="flex h-10 w-10 items-center justify-center text-ivory/40 hover:text-maroon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {gallery.length === 0 && (
                <p className="text-[11px] text-ivory/30 mt-1">
                  No gallery images yet — the main image will be shown on the product page.
                </p>
              )}
            </div>
          </section>

          {/* Descriptions */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
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
                className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold resize-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-ivory/50">
                Full Description (optional — shown on product page)
              </label>
              <textarea
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Longer write-up for the product detail page..."
                className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold resize-none"
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-gold/15 bg-chocolate px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost-light text-[13px] px-4 py-2.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-gold btn-sheen text-[13px] px-6 py-2.5 flex items-center gap-2"
          >
            <ImagePlus className="h-4 w-4" />
            Save &amp; Publish Live
          </button>
        </div>
      </div>
    </div>
  );
}
