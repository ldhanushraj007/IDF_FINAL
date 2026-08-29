import { useState, useEffect } from 'react';
import { suggestGarmentIds } from '../lib/suggestGarments';
import { GARMENT_YARDAGE } from '../data/garmentYardage';
import { X, Plus, Trash2, ImagePlus, ChevronDown, Upload, CheckCircle2 } from 'lucide-react';
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
  const [isLive, setIsLive] = useState(true);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean, galleryIndex?: number) => {
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

  const handleSave = () => {
    if (!name.trim()) return setError('Product name is required.');
    if (!image.trim()) return setError('At least one image URL or uploaded photo is required.');
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
      gallery: gallery.filter((g) => g.trim() !== ''),
      blurb: blurb.trim(),
      details: details.trim() || blurb.trim(),
      suggestedGarmentIds: suggestedGarments,
      hidden: !isLive,
    };

    onSave(newItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gold/30 bg-[#160b09] shadow-2xl text-ivory">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gold/20 bg-[#160b09]/95 backdrop-blur-md px-6 py-4">
          <div>
            <h2 className="font-serif text-2xl text-white">Add New Product</h2>
            <p className="text-[11px] text-gold/80 font-medium mt-0.5">
              Upload fabric photos &amp; details — auto-publishes live to website.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-ivory/10 text-ivory/70 hover:text-white hover:bg-gold/20 transition-all"
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
                <label className="mb-1 block text-[11px] font-semibold text-ivory/70 uppercase tracking-wider">
                  Product Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Banarasi Kadhwa Brocade"
                  className="w-full rounded-xl border border-ivory/15 bg-black/40 px-3.5 py-2.5 text-[13px] text-ivory outline-none focus:border-gold"
                />
              </div>

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
                    <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-ivory/40'}`} />
                    Live
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
                    <span className={`h-2 w-2 rounded-full ${!isLive ? 'bg-rose-400' : 'bg-ivory/40'}`} />
                    Not Live
                  </button>
                </div>
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
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold flex items-center gap-2">
              <Upload className="h-3.5 w-3.5" /> Product Images &amp; Uploads
            </h3>

            {/* Main Product Image Upload Dropzone */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-ivory/70 uppercase tracking-wider">
                Main Fabric Photo *
              </label>

              {image ? (
                <div className="relative rounded-2xl border border-gold/30 bg-night/70 p-4 flex items-center gap-4 shadow-lg">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gold/40 shadow-inner bg-black">
                    <img
                      src={image}
                      alt="Product preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/fabrics/f01.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> Photo Loaded Ready Live
                    </div>
                    <p className="text-[10px] text-ivory/50 truncate max-w-[240px]">
                      {image.startsWith('data:') ? 'Uploaded from device' : image}
                    </p>
                    <div className="flex gap-2">
                      <label className="cursor-pointer rounded-lg bg-gold/20 border border-gold/40 px-3 py-1.5 text-[11px] font-semibold text-gold hover:bg-gold/30 transition-all inline-flex items-center gap-1.5">
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
                        className="rounded-lg bg-red-950/40 border border-red-500/30 px-3 py-1.5 text-[11px] text-red-300 hover:bg-red-900/40 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl border-2 border-dashed border-gold/30 bg-night/30 hover:bg-gold/5 hover:border-gold/60 transition-all p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mb-1">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-[13px] font-bold text-ivory tracking-wide">
                      Click or Drag &amp; Drop Fabric Photo Here
                    </p>
                    <p className="text-[11px] text-ivory/50">
                      Upload directly from your phone or laptop (JPG, PNG, WebP)
                    </p>
                  </div>
                </div>
              )}

              {/* Alternative Image URL input */}
              <div className="mt-3">
                <p className="text-[10px] text-ivory/40 uppercase tracking-widest font-semibold mb-1">Or paste image URL</p>
                <input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="/images/fabrics/f01.jpg  or  https://..."
                  className="w-full rounded-xl border border-ivory/15 bg-night/50 px-3.5 py-2 text-[12px] text-ivory outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Additional Gallery Photos */}
            <div className="pt-2 border-t border-ivory/10">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[11px] text-ivory/60 font-semibold uppercase tracking-wider">
                  Additional Gallery Photos
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-1 text-[11px] text-gold hover:underline font-semibold">
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
                    className="flex items-center gap-1 text-[11px] text-gold hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add URL
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {gallery.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 bg-night/40 p-2 rounded-xl border border-ivory/10">
                    {url && (
                      <img src={url} alt="" className="h-8 w-8 object-cover rounded border border-gold/30 shrink-0" />
                    )}
                    <input
                      value={url}
                      onChange={(e) => updateGallery(i, e.target.value)}
                      placeholder={`Gallery photo ${i + 1} URL or uploaded file`}
                      className="flex-1 rounded-lg border border-ivory/15 bg-night/50 px-3 py-1.5 text-[12px] text-ivory outline-none focus:border-gold"
                    />
                    <label className="cursor-pointer p-1.5 text-gold hover:bg-gold/10 rounded-lg shrink-0">
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
              {gallery.length === 0 && (
                <p className="text-[11px] text-ivory/30 mt-1">
                  No additional gallery photos added yet.
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
        <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 border-t border-gold/20 bg-[#160b09]/95 backdrop-blur-md px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-ivory/20 px-5 py-3 text-[12px] font-semibold text-ivory/70 hover:text-white hover:border-ivory/40 transition-all uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[12px] tracking-[0.2em] uppercase px-6 py-3 shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center gap-2"
          >
            <ImagePlus className="h-4 w-4" />
            Save &amp; Publish Live →
          </button>
        </div>
      </div>
    </div>
  );
}
