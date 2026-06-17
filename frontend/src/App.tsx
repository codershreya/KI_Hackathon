import { useStore } from './store/useStore';
import { assess } from './api/client';
import { MOCK_ASSESSMENT } from './data/mockAssessment';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GridBar from './components/GridBar';
import OverviewTab from './components/tabs/OverviewTab';
import ChatTab from './components/tabs/ChatTab';
import ExportTab from './components/tabs/ExportTab';

type Tab = 'ov' | 'ch' | 'ex';

const TAB_LABELS: { id: Tab; icon: string; label: string }[] = [
  { id: 'ov', icon: 'ti-home', label: 'Übersicht' },
  { id: 'ch', icon: 'ti-message', label: 'Chat' },
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
  } = useStore();

  async function handleAnalyze() {
    setIsAnalyzing(true);
    try {
      let result;
      try {
        result = await assess(projectInput);
      } catch {
        // Fall back to mock data when backend is not available
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
          <div style={{ display: activeTab === 'ch' ? 'block' : 'none' }}>
            <ChatTab result={assessmentResult} onSwitchToChat={() => setActiveTab('ch')} />
          </div>
          <div style={{ display: activeTab === 'ex' ? 'block' : 'none' }}>
            <ExportTab result={assessmentResult} />
          </div>
        </div>
      </div>
    </div>
  );
}
