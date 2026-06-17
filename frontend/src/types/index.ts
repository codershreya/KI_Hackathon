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

export interface AssessmentResult {
  projectId: string;
  generatedAt: string;
  gridOperator: GridOperator | null;
  technicalSummary: TechnicalSummary;
  regulatoryClaims: Claim[];
  subsidies: Subsidy[];
  openPoints: string[];
  nextSteps: Step[];
  installerQuestions: string[];
  trafficLight: TrafficLight;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
