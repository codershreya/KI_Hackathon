import { useStore } from './store/useStore';
import { assess } from './api/client';
import { MOCK_ASSESSMENT } from './data/mockAssessment';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GridBar from './components/GridBar';
import OverviewTab from './components/tabs/OverviewTab';
import AIConsultantTab from './components/tabs/AIConsultantTab';
import ExportTab from './components/tabs/ExportTab';

type Tab = 'ov' | 'ai' | 'ex';

const TAB_LABELS: { id: Tab; icon: string; label: string }[] = [
  { id: 'ov', icon: 'ti-layout-grid', label: 'Overview' },
  { id: 'ai', icon: 'ti-robot', label: 'AI Consultant' },
  { id: 'ex', icon: 'ti-file-description', label: 'Export & PDF' },
];

export default function App() {
  const {
    projectInput,
    assessmentResult,
    isAnalyzing,
    analyzed,
    activeTab,
    setAssessmentResult,
    setIsAnalyzing,
    setAnalyzed,
    setActiveTab,
    setSelectedOption,
  } = useStore();

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setSelectedOption(null);
    try {
      let result;
      try {
        result = await assess(projectInput);
      } catch {
        await new Promise((r) => setTimeout(r, 1200));
        result = MOCK_ASSESSMENT;
      }
      setAssessmentResult(result);
      setAnalyzed(true);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="app">
      <Header />
      <div className="body-row">
        <Sidebar
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
          analyzed={analyzed}
        />

        <div className="main">
          {assessmentResult && (
            <GridBar operator={assessmentResult.gridOperator} analyzed={analyzed} />
          )}

          <div className="tabs">
            {TAB_LABELS.map(({ id, icon, label }) => (
              <div
                key={id}
                className={`t ${activeTab === id ? 'on' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <i
                  className={`ti ${icon}`}
                  style={{ fontSize: 12, verticalAlign: -1, marginRight: 3 }}
                />
                {label}
              </div>
            ))}
          </div>

          <div style={{ display: activeTab === 'ov' ? 'block' : 'none' }}>
            <OverviewTab result={assessmentResult} />
          </div>
          <div style={{ display: activeTab === 'ai' ? 'block' : 'none' }}>
            <AIConsultantTab result={assessmentResult} />
          </div>
          <div style={{ display: activeTab === 'ex' ? 'block' : 'none' }}>
            <ExportTab result={assessmentResult} />
          </div>
        </div>
      </div>
    </div>
  );
}
