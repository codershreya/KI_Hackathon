import type { ProjectInput, TechnicalSummary } from '../types';

// Orientation efficiency factors (fraction of south-facing yield)
const ORIENTATION_FACTOR: Record<string, number> = {
  S: 1.0, SE: 0.95, SW: 0.95,
  E: 0.85, W: 0.85,
  NE: 0.70, NW: 0.70,
  N: 0.55,
};

// Pitch correction factor (optimal ~30°)
function pitchFactor(deg: number): number {
  if (deg >= 25 && deg <= 40) return 1.0;
  if (deg >= 15) return 0.97;
  if (deg >= 5) return 0.90;
  return 0.87; // flat roof
}

// Regional average irradiance (kWh/kWp/year) — Germany average
const DEFAULT_IRRADIANCE_KWH_PER_KWP = 950;

// Module area density
const MODULE_EFFICIENCY = 0.20; // 20% → 200 Wp per m²

export function calcTechnical(input: ProjectInput): TechnicalSummary {
  const orientFactor = ORIENTATION_FACTOR[input.roofOrientation] ?? 0.85;
  const pitchF = pitchFactor(input.roofPitchDeg);
  const usableArea = input.roofAreaM2 * 0.75; // usability factor

  const estimatedKwp = parseFloat((usableArea * orientFactor * pitchF * MODULE_EFFICIENCY).toFixed(1));
  const moduleWp = 430; // typical module Wp
  const moduleCount = Math.round((estimatedKwp * 1000) / moduleWp);
  const moduleCountMin = Math.max(1, moduleCount - 2);
  const moduleCountMax = moduleCount + 2;

  const irradiance = DEFAULT_IRRADIANCE_KWH_PER_KWP;
  const annualKwh = Math.round(estimatedKwp * irradiance * 0.86); // 14% system losses

  // Self-consumption without storage
  const rawSC = input.annualKwhElec > 0
    ? Math.min(input.annualKwhElec / annualKwh, 1.0)
    : 0.45;
  const selfConsumptionPct = Math.round(rawSC * 100);

  // Self-consumption with storage (+15–25% depending on storage size)
  const storageFactor = input.planStorage ? 1.20 : 1.0;
  const selfConsumptionWithStoragePct = Math.min(
    Math.round(rawSC * storageFactor * 100),
    95
  );

  // Recommended storage: ~1 kWh per kWp
  const recommendedStorageKwh = Math.round(estimatedKwp);

  // Roof score: area (30%), orientation (30%), pitch (20%), shading placeholder (20%)
  const areaScore = Math.min(input.roofAreaM2 / 100, 1.0) * 10;
  const orientScore = orientFactor * 10;
  const pitchScore = pitchF * 10;
  const shadingScore = 8; // placeholder — unknown without image analysis
  const roofScore = parseFloat(
    (areaScore * 0.3 + orientScore * 0.3 + pitchScore * 0.2 + shadingScore * 0.2).toFixed(1)
  );

  const ORIENT_LABEL: Record<string, string> = {
    S: 'Süd', SE: 'Südost', SW: 'Südwest',
    E: 'Ost', W: 'West', N: 'Nord', NE: 'Nordost', NW: 'Nordwest',
  };

  return {
    estimatedKwp,
    moduleCountMin,
    moduleCountMax,
    annualKwh,
    selfConsumptionPct,
    selfConsumptionWithStoragePct,
    recommendedStorageKwh,
    roofScore,
    orientation: ORIENT_LABEL[input.roofOrientation] ?? input.roofOrientation,
    confidence: 'medium',
    notes: [],
  };
}
