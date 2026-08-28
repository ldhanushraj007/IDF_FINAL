import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, AlertCircle, Ruler } from 'lucide-react';
import {
  GARMENT_CONFIGS,
  MEASUREMENT_DISCLAIMER,
  estimateFabric,
  cmToInches,
  inchesToCm,
  type GarmentType,
  type MeasurementUnit,
  type EstimationResult,
} from '../lib/measurementEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called when user clicks "Use X metres" — sets the product page quantity */
  onSelectMetres?: (metres: number) => void;
  /** If known, the fabric width to pre-fill */
  fabricWidthInches?: number;
}

type Step = 'garment' | 'measurements' | 'result';

export default function MeasurementGuide({ isOpen, onClose, onSelectMetres, fabricWidthInches = 44 }: Props) {
  const [step, setStep] = useState<Step>('garment');
  const [garment, setGarment] = useState<GarmentType>('saree');
  const [unit, setUnit] = useState<MeasurementUnit>('inches');
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EstimationResult | null>(null);

  const config = GARMENT_CONFIGS.find(g => g.type === garment)!;

  const reset = useCallback(() => {
    setStep('garment');
    setGarment('saree');
    setMeasurements({});
    setResult(null);
  }, []);

  const handleClose = () => {
    onClose();
    setTimeout(reset, 400);
  };

  const handleCalculate = () => {
    const parsed: Record<string, number> = {};
    for (const [k, v] of Object.entries(measurements)) {
      const n = parseFloat(v);
      if (!isNaN(n) && n > 0) {
        // Always pass to engine in inches
        parsed[k] = unit === 'cm' ? cmToInches(n) : n;
      }
    }
    const r = estimateFabric(garment, parsed, fabricWidthInches, unit);
    setResult(r);
    setStep('result');
  };

  const handleSelectMetres = () => {
    if (!result) return;
    onSelectMetres?.(result.recommended);
    handleClose();
  };

  const isStepValid = () => {
    if (step === 'garment') return true;
    if (step === 'measurements') {
      // Check required fields
      return config.fields.every(f => !f.required || (measurements[f.key] && parseFloat(measurements[f.key]) > 0));
    }
    return true;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-end justify-center bg-[#1F0505]/60 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg bg-white max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(31,5,5,0.08)' }}
            >
              <div className="flex items-center gap-2.5">
                <Ruler className="h-4 w-4 text-[#1F0505]/40" />
                <h2 className="font-serif text-[20px] text-[#1F0505]">Measurement Guide</h2>
              </div>
              <button type="button" onClick={handleClose} className="text-[#1F0505]/40 hover:text-[#1F0505]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6">
              {/* Step 1: Garment Selection */}
              {step === 'garment' && (
                <div>
                  <p className="text-[13px] text-[#1F0505]/50 mb-5">
                    Select your garment type to get a personalised fabric estimate.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GARMENT_CONFIGS.map((g) => (
                      <button
                        key={g.type}
                        type="button"
                        onClick={() => setGarment(g.type)}
                        className={`px-3 py-3 text-[12px] font-sans font-semibold text-left transition-all ${
                          garment === g.type
                            ? 'bg-[#1F0505] text-white'
                            : 'border border-[#1F0505]/15 text-[#1F0505]/60 hover:border-[#1F0505]/40 hover:text-[#1F0505]'
                        }`}
                      >
                        {g.label}
                        <span className="block text-[10px] font-normal mt-0.5 opacity-60">
                          {g.defaultRange[0]}–{g.defaultRange[1]}m
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (config.fields.length === 0) {
                        // Skip measurements step for garments without fields
                        handleCalculate();
                      } else {
                        setStep('measurements');
                      }
                    }}
                    className="btn btn-dark btn-sheen mt-6 w-full"
                  >
                    {config.fields.length === 0 ? 'Get Estimate' : 'Enter Measurements'}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Step 2: Measurements */}
              {step === 'measurements' && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-[13px] text-[#1F0505]/50">
                      Enter measurements for <strong className="text-[#1F0505]">{config.label}</strong>.
                      Required fields are marked *.
                    </p>
                    {/* Unit toggle */}
                    <div className="flex border border-[#1F0505]/15 shrink-0">
                      {(['inches', 'cm'] as MeasurementUnit[]).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUnit(u)}
                          className={`px-3 py-1.5 text-[10px] font-semibold font-sans uppercase transition-colors ${
                            unit === u ? 'bg-[#1F0505] text-white' : 'text-[#1F0505]/50 hover:text-[#1F0505]'
                          }`}
                        >
                          {u === 'inches' ? 'in' : 'cm'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {config.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#1F0505]/40 mb-1.5">
                          {field.label} {field.required && <span className="text-[#1F0505]">*</span>}
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={measurements[field.key] || ''}
                            onChange={(e) => setMeasurements(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={`e.g. ${unit === 'cm' ? Math.round(inchesToCm(field.rangeInches[0])) : field.rangeInches[0]}`}
                            className="flex-1 border border-[#1F0505]/15 px-3 py-2 text-[13px] text-[#1F0505] focus:border-[#1F0505] focus:outline-none"
                          />
                          <span className="text-[12px] text-[#1F0505]/30 w-6 shrink-0">{unit === 'cm' ? 'cm' : 'in'}</span>
                        </div>
                        <p className="text-[11px] text-[#1F0505]/30 mt-1">{field.help}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setStep('garment')} className="btn btn-outline !px-4">
                      <ChevronLeft className="h-4 w-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleCalculate}
                      disabled={!isStepValid()}
                      className="btn btn-dark btn-sheen flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Calculate →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Result */}
              {step === 'result' && result && (
                <div>
                  <div className="bg-[#FFE6E9] px-6 py-5 text-center">
                    <p className="font-sans text-[10px] font-semibold tracking-[0.2em] uppercase text-[#1F0505]/50 mb-2">
                      Recommended Fabric
                    </p>
                    <p className="font-serif text-[64px] text-[#1F0505] leading-none font-medium">
                      {result.recommended}
                    </p>
                    <p className="font-sans text-[14px] text-[#1F0505]/60 mt-1">metres</p>
                    <p className="font-sans text-[11px] text-[#1F0505]/40 mt-2">
                      Range: {result.minMetres} – {result.maxMetres} metres
                    </p>
                  </div>

                  <div className="mt-5">
                    <p className="text-[13px] text-[#1F0505]/60 leading-relaxed">
                      {result.explanation}
                    </p>
                    <p className="text-[11px] text-[#1F0505]/30 mt-2">
                      Based on {result.fabricWidthConsidered} fabric width.
                    </p>
                  </div>

                  {/* Disclaimer */}
                  <div className="mt-4 flex items-start gap-2 bg-[#FFE6E9]/40 px-4 py-3">
                    <AlertCircle className="h-4 w-4 shrink-0 text-[#1F0505]/40 mt-0.5" />
                    <p className="text-[11px] text-[#1F0505]/40 leading-relaxed">
                      {MEASUREMENT_DISCLAIMER}
                    </p>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={reset} className="btn btn-outline !px-4">
                      <ChevronLeft className="h-4 w-4" /> Start Over
                    </button>
                    {onSelectMetres && (
                      <button
                        type="button"
                        onClick={handleSelectMetres}
                        className="btn btn-dark btn-sheen flex-1"
                      >
                        Use {result.recommended} metres
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
