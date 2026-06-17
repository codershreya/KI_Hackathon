import { create } from 'zustand';
import type {
  ProjectInput,
  AssessmentResult,
  ChatMessage,
  SystemOption,
} from '../types';

interface AppState {
  projectInput: ProjectInput;
  assessmentResult: AssessmentResult | null;
  isAnalyzing: boolean;
  analyzed: boolean;
  activeTab: 'ov' | 'ai' | 'ex';
  chatMessages: ChatMessage[];
  selectedSourceId: string | null;
  selectedOption: SystemOption | null;

  setProjectInput: (input: Partial<ProjectInput>) => void;
  setAssessmentResult: (result: AssessmentResult | null) => void;
  setIsAnalyzing: (v: boolean) => void;
  setAnalyzed: (v: boolean) => void;
  setActiveTab: (tab: 'ov' | 'ai' | 'ex') => void;
  addChatMessage: (msg: ChatMessage) => void;
  setSelectedSourceId: (id: string | null) => void;
  setSelectedOption: (option: SystemOption | null) => void;
}

const defaultInput: ProjectInput = {
  address: 'Musterstraße 12, 30161 Hannover',
  roofAreaM2: 80,
  roofOrientation: 'S',
  roofPitchDeg: 30,
  buildingType: 'single_family',
  useType: 'residential',
  annualKwhElec: 4200,
  hasEV: true,
  existingPvKwp: null,
  existingPvYear: null,
  planStorage: true,
  planWallbox: true,
  planHeatPump: false,
  gridOperatorId: null,
};

export const useStore = create<AppState>((set) => ({
  projectInput: defaultInput,
  assessmentResult: null,
  isAnalyzing: false,
  analyzed: false,
  activeTab: 'ov',
  chatMessages: [],
  selectedSourceId: null,
  selectedOption: null,

  setProjectInput: (input) =>
    set((s) => ({ projectInput: { ...s.projectInput, ...input } })),
  setAssessmentResult: (result) => set({ assessmentResult: result }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  setAnalyzed: (v) => set({ analyzed: v }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  setSelectedSourceId: (id) => set({ selectedSourceId: id }),
  setSelectedOption: (option) => set({ selectedOption: option }),
}));
