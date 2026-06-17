export type BuildingType = 'single_family' | 'multi_family' | 'commercial';
export type UseType = 'residential' | 'commercial';
export type Orientation = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
export type RegulatoryStatus = 'valid' | 'announced' | 'transitional' | 'expired' | 'unclear';
export type TrafficLight = 'green' | 'amber' | 'red';
export type Confidence = 'high' | 'medium' | 'low';

export interface ProjectInput {
  address: string;
  roofAreaM2: number;
  roofOrientation: Orientation;
  roofPitchDeg: number;
  buildingType: BuildingType;
  useType: UseType;
  annualKwhElec: number;
  annualKwhHeat?: number;
  hasEV: boolean;
  existingPvKwp: number | null;
  existingPvYear: number | null;
  planStorage: boolean;
  planWallbox: boolean;
  planHeatPump: boolean;
  gridOperatorId: string | null;
  language?: 'de' | 'en';
}

export interface GridOperator {
  id: string;
  name: string;
  city: string;
  state: string;
  portalUrl: string;
  email?: string;
}

export interface RegulatoryDocument {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  version: string;
  validFrom: string;
  validUntil: string | null;
  status: RegulatoryStatus;
  tags: string[];
  chunkText: string;
}

export interface Claim {
  text: string;
  detail: string;
  sourceRef: string;
  sourceIds: string[];
  status: RegulatoryStatus;
  uncertainty?: string;
  technicalNote?: string;
}

export interface Step {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Subsidy {
  name: string;
  shortName: string;
  status: RegulatoryStatus;
  amount: string;
  description: string;
  warning?: string;
}

export interface TechnicalSummary {
  estimatedKwp: number;
  moduleCountMin: number;
  moduleCountMax: number;
  annualKwh: number;
  selfConsumptionPct: number;
  selfConsumptionWithStoragePct: number;
  recommendedStorageKwh: number;
  roofScore: number;
  orientation: string;
  confidence: Confidence;
  notes: string[];
}

export interface OptionRatings {
  technicalEfficiency: number;   // 1–5
  runningEfficiency: number;
  economicValue: number;
  regulatorySimplicity: number;
  futureReadiness: number;
}

export interface SystemOption {
  label: 'A' | 'B' | 'C';
  name: string;
  tagline: string;
  pvKwp: number;
  batteryKwh: number;
  inverterKw: number;
  wallboxCompatible: boolean;
  heatPumpCompatible: boolean;
  ratings: OptionRatings;
  estimatedInvestmentMin: number;
  estimatedInvestmentMax: number;
  estimatedAnnualProduction: number;
  estimatedAnnualSavings: number;
  selfConsumptionPct: number;
  summary: string;
}

export interface AssessmentResult {
  projectId: string;
  generatedAt: string;
  gridOperator: GridOperator | null;
  technicalSummary: TechnicalSummary;
  systemOptions: SystemOption[];
  regulatoryClaims: Claim[];
  subsidies: Subsidy[];
  openPoints: string[];
  nextSteps: Step[];
  installerQuestions: string[];
  trafficLight: TrafficLight;
  rawLlmTrace?: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  displayName: string;
}

export interface RetrievedChunk {
  id: string;
  text: string;
  source: string;
  title: string;
  status: RegulatoryStatus;
  validFrom: string;
  validUntil: string | null;
  tags: string[];
  score: number;
}

// ─── Consultation types (kept for backwards compat) ───────────────────────────

export interface ConsultationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CollectedData {
  buildingType?: string;
  apartments?: number;
  meters?: number;
  residents?: number;
  homeOffice?: boolean;
  annualKwhElec?: number;
  existingPv?: boolean;
  existingBattery?: boolean;
  existingWallbox?: boolean;
  existingHeatPump?: boolean;
  pool?: boolean;
  otherLoads?: string;
  meterCabinetStatus?: string;
  roofAreaM2?: number;
  roofOrientation?: string;
  roofPitchDeg?: number;
  roofMaterial?: string;
  shadingInfo?: string;
  address?: string;
  budgetRange?: string;
  aestheticPrefs?: string;
  backupPower?: boolean;
  estimatedKwp?: number;
  annualYieldKwh?: number;
  selfConsumptionPct?: number;
  recommendedBatteryKwh?: number;
}

export interface RecommendationOption {
  label: 'A' | 'B' | 'C';
  name: string;
  pvKwp: number;
  batteryKwh: number;
  inverterKw: number;
  annualKwh: number;
  selfConsumptionPct: number;
  pros: string[];
  cons: string[];
  investmentMin: number;
  investmentMax: number;
  suitabilityScore: number;
  description: string;
}

export interface ConsultationSession {
  id: string;
  messages: ConsultationMessage[];
  phase: number;
  collectedData: CollectedData;
  options: RecommendationOption[] | null;
  reportReady: boolean;
  language: 'de' | 'en';
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationResponse {
  message: string;
  phase: number;
  phaseLabel: string;
  collectedData: CollectedData;
  options: RecommendationOption[] | null;
  reportReady: boolean;
  sessionId: string;
}
