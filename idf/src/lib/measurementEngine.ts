/**
 * measurementEngine.ts
 * ====================
 * Centralized fabric estimation logic, isolated from UI.
 *
 * IMPORTANT: These are ESTIMATES only. The disclaimer must always be shown:
 * "Your tailor may recommend a different quantity depending on the garment
 * pattern, fabric width, design, construction and tailoring preferences."
 */

export type GarmentType =
  | 'saree'
  | 'blouse'
  | 'lehenga'
  | 'skirt'
  | 'gown'
  | 'dress'
  | 'kurta'
  | 'sherwani'
  | 'jacket'
  | 'dupatta'
  | 'custom';

export type MeasurementUnit = 'inches' | 'cm';

export interface GarmentInfo {
  type: GarmentType;
  label: string;
  fields: MeasurementFieldDef[];
  /** Base fabric requirement in metres when no measurements are given */
  defaultRange: [number, number];
}

export interface MeasurementFieldDef {
  key: string;
  label: string;
  help: string;
  required?: boolean;
  /** Reasonable range in inches */
  rangeInches: [number, number];
}

export interface EstimationResult {
  minMetres: number;
  maxMetres: number;
  recommended: number;
  explanation: string;
  fabricWidthConsidered: string;
}

/** Convert inches to centimetres */
export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

/** Convert centimetres to inches */
export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}

/** All supported garment configurations */
export const GARMENT_CONFIGS: GarmentInfo[] = [
  {
    type: 'saree',
    label: 'Saree',
    fields: [],
    defaultRange: [5.5, 6.5],
  },
  {
    type: 'blouse',
    label: 'Blouse',
    fields: [
      { key: 'bust', label: 'Bust', help: 'Measure around the fullest part of the bust while keeping the tape comfortably level.', required: true, rangeInches: [28, 52] },
      { key: 'waist', label: 'Waist', help: 'Measure around the natural waist without pulling the tape tightly.', rangeInches: [22, 48] },
      { key: 'shoulder', label: 'Shoulder', help: 'Measure across the shoulder from one shoulder point to the other.', rangeInches: [12, 22] },
      { key: 'sleeveLength', label: 'Sleeve Length', help: 'Measure from the shoulder point to where you want the sleeve to end.', rangeInches: [4, 26] },
      { key: 'blouseLength', label: 'Blouse Length', help: 'Measure from the shoulder to the desired hemline.', rangeInches: [14, 30] },
    ],
    defaultRange: [0.8, 1.2],
  },
  {
    type: 'lehenga',
    label: 'Lehenga',
    fields: [
      { key: 'waist', label: 'Waist', help: 'Measure around the natural waist without pulling the tape tightly.', required: true, rangeInches: [22, 48] },
      { key: 'hip', label: 'Hip', help: 'Measure around the fullest part of the hip.', rangeInches: [30, 56] },
      { key: 'length', label: 'Length', help: 'Measure from the waist to the desired hem (floor length is approximately 40–42 inches).', required: true, rangeInches: [30, 48] },
    ],
    defaultRange: [3.5, 5.0],
  },
  {
    type: 'skirt',
    label: 'Skirt',
    fields: [
      { key: 'waist', label: 'Waist', help: 'Measure around the natural waist without pulling the tape tightly.', required: true, rangeInches: [22, 48] },
      { key: 'hip', label: 'Hip', help: 'Measure around the fullest part of the hip.', rangeInches: [30, 56] },
      { key: 'length', label: 'Length', help: 'Measure from the waist to where you want the skirt to end.', required: true, rangeInches: [16, 48] },
    ],
    defaultRange: [2.0, 3.5],
  },
  {
    type: 'gown',
    label: 'Gown',
    fields: [
      { key: 'bust', label: 'Bust', help: 'Measure around the fullest part of the bust while keeping the tape comfortably level.', required: true, rangeInches: [28, 52] },
      { key: 'waist', label: 'Waist', help: 'Measure around the natural waist without pulling the tape tightly.', rangeInches: [22, 48] },
      { key: 'hip', label: 'Hip', help: 'Measure around the fullest part of the hip.', rangeInches: [30, 56] },
      { key: 'length', label: 'Length', help: 'Measure from the highest shoulder point to the floor or desired hemline.', required: true, rangeInches: [48, 68] },
      { key: 'sleeveLength', label: 'Sleeve Length', help: 'Measure from the shoulder point to where you want the sleeve to end. Skip if sleeveless.', rangeInches: [4, 26] },
    ],
    defaultRange: [4.0, 6.0],
  },
  {
    type: 'dress',
    label: 'Dress',
    fields: [
      { key: 'bust', label: 'Bust', help: 'Measure around the fullest part of the bust while keeping the tape comfortably level.', required: true, rangeInches: [28, 52] },
      { key: 'waist', label: 'Waist', help: 'Measure around the natural waist without pulling the tape tightly.', rangeInches: [22, 48] },
      { key: 'hip', label: 'Hip', help: 'Measure around the fullest part of the hip.', rangeInches: [30, 56] },
      { key: 'length', label: 'Length', help: 'Measure from the shoulder to the desired hemline.', required: true, rangeInches: [30, 60] },
    ],
    defaultRange: [2.5, 4.0],
  },
  {
    type: 'kurta',
    label: 'Kurta',
    fields: [
      { key: 'chest', label: 'Chest', help: 'Measure around the fullest part of the chest with arms relaxed at your sides.', required: true, rangeInches: [30, 56] },
      { key: 'shoulder', label: 'Shoulder', help: 'Measure across the shoulder from one shoulder point to the other.', rangeInches: [14, 24] },
      { key: 'length', label: 'Kurta Length', help: 'Measure from the highest shoulder point to the desired hemline.', required: true, rangeInches: [28, 50] },
      { key: 'sleeveLength', label: 'Sleeve Length', help: 'Measure from the shoulder point to the wrist or desired sleeve end.', rangeInches: [6, 28] },
    ],
    defaultRange: [2.5, 3.5],
  },
  {
    type: 'sherwani',
    label: 'Sherwani',
    fields: [
      { key: 'chest', label: 'Chest', help: 'Measure around the fullest part of the chest with arms relaxed at your sides.', required: true, rangeInches: [34, 56] },
      { key: 'shoulder', label: 'Shoulder', help: 'Measure across the shoulder from one shoulder point to the other.', rangeInches: [16, 24] },
      { key: 'waist', label: 'Waist', help: 'Measure around the natural waist without pulling the tape tightly.', rangeInches: [28, 50] },
      { key: 'sleeveLength', label: 'Sleeve Length', help: 'Measure from the shoulder point to the wrist.', rangeInches: [22, 30] },
      { key: 'length', label: 'Sherwani Length', help: 'Measure from the shoulder to the desired hemline (typically knee or below).', required: true, rangeInches: [36, 52] },
    ],
    defaultRange: [4.0, 5.5],
  },
  {
    type: 'jacket',
    label: 'Jacket',
    fields: [
      { key: 'chest', label: 'Chest / Bust', help: 'Measure around the fullest part of the chest or bust.', required: true, rangeInches: [30, 56] },
      { key: 'shoulder', label: 'Shoulder', help: 'Measure across the shoulder from one shoulder point to the other.', rangeInches: [14, 24] },
      { key: 'sleeveLength', label: 'Sleeve Length', help: 'Measure from the shoulder point to the wrist.', rangeInches: [20, 30] },
      { key: 'length', label: 'Jacket Length', help: 'Measure from the shoulder to the desired hemline.', required: true, rangeInches: [20, 36] },
    ],
    defaultRange: [2.0, 3.0],
  },
  {
    type: 'dupatta',
    label: 'Dupatta',
    fields: [],
    defaultRange: [2.25, 2.75],
  },
  {
    type: 'custom',
    label: 'Custom / Other',
    fields: [],
    defaultRange: [2.0, 4.0],
  },
];

/**
 * Estimate fabric requirement based on garment type, measurements, and fabric width.
 *
 * This intentionally returns a RANGE rather than a single number.
 * Never present false precision.
 */
export function estimateFabric(
  garmentType: GarmentType,
  measurements: Record<string, number>,
  fabricWidthInches: number,
  _unit: MeasurementUnit = 'inches',
): EstimationResult {
  const config = GARMENT_CONFIGS.find(g => g.type === garmentType);
  if (!config) {
    return {
      minMetres: 2,
      maxMetres: 4,
      recommended: 4,
      explanation: 'Unable to determine garment type. Please consult your tailor.',
      fabricWidthConsidered: `${fabricWidthInches} in`,
    };
  }

  // For garments without measurement fields (saree, dupatta, custom), return defaults
  if (config.fields.length === 0) {
    const [min, max] = config.defaultRange;
    return {
      minMetres: min,
      maxMetres: max,
      recommended: max,
      explanation: getDefaultExplanation(garmentType),
      fabricWidthConsidered: `${fabricWidthInches} in`,
    };
  }

  // Width factor: narrower fabric needs more metres
  const widthFactor = fabricWidthInches <= 36 ? 1.3
    : fabricWidthInches <= 44 ? 1.15
    : fabricWidthInches <= 48 ? 1.0
    : fabricWidthInches <= 54 ? 0.9
    : 0.85;

  let baseMin = config.defaultRange[0];
  let baseMax = config.defaultRange[1];

  // Adjust based on provided measurements
  const mKeys = Object.keys(measurements).filter(k => measurements[k] > 0);

  if (mKeys.length > 0) {
    // Calculate from measurements
    switch (garmentType) {
      case 'blouse': {
        const bust = measurements.bust || 36;
        const length = measurements.blouseLength || 18;
        const sleeve = measurements.sleeveLength || 8;
        const bodyReq = (length + 4) / 39.37; // body panels
        const sleeveReq = sleeve > 12 ? 0.3 : 0.15;
        baseMin = bodyReq + sleeveReq;
        baseMax = baseMin + 0.3;
        // Larger bust needs more
        if (bust > 40) { baseMin += 0.2; baseMax += 0.2; }
        break;
      }
      case 'lehenga':
      case 'skirt': {
        const waist = measurements.waist || 30;
        const length = measurements.length || 40;
        const lengthM = (length + 6) / 39.37; // length + hem allowance
        const panels = Math.ceil((waist * 2.5) / fabricWidthInches); // flare factor
        baseMin = lengthM * panels * 0.7;
        baseMax = lengthM * panels * 0.9;
        break;
      }
      case 'gown':
      case 'dress': {
        const bust = measurements.bust || 36;
        const length = measurements.length || 55;
        const sleeve = measurements.sleeveLength || 0;
        const lengthM = (length + 6) / 39.37;
        baseMin = lengthM * 1.5;
        baseMax = lengthM * 2.0;
        if (bust > 40) { baseMin += 0.3; baseMax += 0.3; }
        if (sleeve > 16) { baseMin += 0.3; baseMax += 0.3; }
        break;
      }
      case 'kurta': {
        const chest = measurements.chest || 38;
        const length = measurements.length || 36;
        const sleeve = measurements.sleeveLength || 22;
        const bodyM = ((length + 4) * 2) / 39.37;
        const sleeveM = sleeve > 16 ? 0.5 : 0.3;
        baseMin = bodyM + sleeveM;
        baseMax = baseMin + 0.5;
        if (chest > 44) { baseMin += 0.3; baseMax += 0.3; }
        break;
      }
      case 'sherwani': {
        const chest = measurements.chest || 40;
        const length = measurements.length || 44;
        const sleeve = measurements.sleeveLength || 24;
        const bodyM = ((length + 4) * 2.2) / 39.37;
        const sleeveM = 0.5;
        baseMin = bodyM + sleeveM;
        baseMax = baseMin + 0.5;
        if (chest > 44) { baseMin += 0.3; baseMax += 0.3; }
        break;
      }
      case 'jacket': {
        const chest = measurements.chest || 38;
        const length = measurements.length || 26;
        const sleeve = measurements.sleeveLength || 24;
        const bodyM = ((length + 4) * 2) / 39.37;
        const sleeveM = sleeve > 20 ? 0.4 : 0.25;
        baseMin = bodyM + sleeveM;
        baseMax = baseMin + 0.5;
        if (chest > 44) { baseMin += 0.3; baseMax += 0.3; }
        break;
      }
    }
  }

  // Apply width factor
  baseMin = baseMin * widthFactor;
  baseMax = baseMax * widthFactor;

  // Round to nearest 0.25
  const roundQ = (n: number) => Math.ceil(n * 4) / 4;
  const minMetres = Math.max(0.5, roundQ(baseMin));
  const maxMetres = Math.max(minMetres, roundQ(baseMax));
  const recommended = maxMetres;

  return {
    minMetres,
    maxMetres,
    recommended,
    explanation: getExplanation(garmentType, mKeys.length > 0),
    fabricWidthConsidered: `${fabricWidthInches} in`,
  };
}

function getDefaultExplanation(type: GarmentType): string {
  switch (type) {
    case 'saree': return 'A standard saree requires approximately 5.5 to 6.5 metres of fabric, depending on draping style and pallu length.';
    case 'dupatta': return 'A standard dupatta requires approximately 2.25 to 2.75 metres of fabric.';
    case 'custom': return 'For custom garments, we recommend consulting your tailor for a precise fabric requirement.';
    default: return 'Estimate based on standard garment construction.';
  }
}

function getExplanation(type: GarmentType, hasMeasurements: boolean): string {
  if (!hasMeasurements) return getDefaultExplanation(type);
  return `Estimated based on your measurements and fabric width. The recommended quantity includes standard seam, hem and construction allowances for a ${type}.`;
}

export const MEASUREMENT_DISCLAIMER =
  'Fabric requirements are estimates. Your tailor or designer may recommend a different quantity depending on garment pattern, fabric width, construction, design and tailoring preferences.';
