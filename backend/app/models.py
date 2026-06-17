"""Pydantic models — direct port of src/types/index.ts."""
from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


# ── Enumerations ────────────────────────────────────────────────────────────


class BuildingType(str, Enum):
    single_family = "single_family"
    multi_family = "multi_family"
    commercial = "commercial"


class UseType(str, Enum):
    residential = "residential"
    commercial = "commercial"


class Orientation(str, Enum):
    N = "N"
    NE = "NE"
    E = "E"
    SE = "SE"
    S = "S"
    SW = "SW"
    W = "W"
    NW = "NW"


class RegulatoryStatus(str, Enum):
    valid = "valid"
    announced = "announced"
    transitional = "transitional"
    expired = "expired"
    unclear = "unclear"


class TrafficLight(str, Enum):
    green = "green"
    amber = "amber"
    red = "red"


class Confidence(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class Priority(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


# ── Domain models ────────────────────────────────────────────────────────────


class ProjectInput(BaseModel):
    address: str
    roofAreaM2: float
    roofOrientation: Orientation
    roofPitchDeg: float
    buildingType: BuildingType
    useType: UseType
    annualKwhElec: float = 0
    annualKwhHeat: Optional[float] = None
    hasEV: bool = False
    existingPvKwp: Optional[float] = None
    existingPvYear: Optional[int] = None
    planStorage: bool = False
    planWallbox: bool = False
    planHeatPump: bool = False
    gridOperatorId: Optional[str] = None


class GridOperator(BaseModel):
    id: str
    name: str
    city: str
    state: str
    portalUrl: str
    email: Optional[str] = None


class RegulatoryDocument(BaseModel):
    id: str
    title: str
    source: str
    sourceUrl: str
    version: str
    validFrom: str
    validUntil: Optional[str] = None
    status: RegulatoryStatus
    tags: List[str]
    chunkText: str


class Claim(BaseModel):
    text: str
    detail: str
    sourceRef: str
    sourceIds: List[str]
    status: RegulatoryStatus
    uncertainty: Optional[str] = None
    technicalNote: Optional[str] = None


class Step(BaseModel):
    text: str
    priority: Priority


class Subsidy(BaseModel):
    name: str
    shortName: str
    status: RegulatoryStatus
    amount: str
    description: str
    warning: Optional[str] = None


class TechnicalSummary(BaseModel):
    estimatedKwp: float
    moduleCountMin: int
    moduleCountMax: int
    annualKwh: int
    selfConsumptionPct: int
    selfConsumptionWithStoragePct: int
    recommendedStorageKwh: int
    roofScore: float
    orientation: str
    confidence: Confidence
    notes: List[str]


class AssessmentResult(BaseModel):
    projectId: str
    generatedAt: str
    gridOperator: Optional[GridOperator] = None
    technicalSummary: TechnicalSummary
    regulatoryClaims: List[Claim]
    subsidies: List[Subsidy]
    openPoints: List[str]
    nextSteps: List[Step]
    installerQuestions: List[str]
    trafficLight: TrafficLight
    rawLlmTrace: Optional[str] = None


class GeoLocation(BaseModel):
    lat: float
    lng: float
    displayName: str


class RetrievedChunk(BaseModel):
    id: str
    text: str
    source: str
    title: str
    status: RegulatoryStatus
    validFrom: str
    validUntil: Optional[str] = None
    tags: List[str]
    score: float
