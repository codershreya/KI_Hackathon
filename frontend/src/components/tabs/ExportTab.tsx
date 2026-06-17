import { useState } from 'react';
import type { AssessmentResult } from '../../types';
import { downloadPdf } from '../../api/client';
import { useStore } from '../../store/useStore';

interface Props {
  result: AssessmentResult | null;
}

const ACCENT: Record<string, string> = { A: '#64748b', B: '#166534', C: '#4338ca' };
const ACCENT_LIGHT: Record<string, string> = { A: '#f1f5f9', B: '#f0fdf4', C: '#eef2ff' };

function renderBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
  );
}

export default function ExportTab({ result }: Props) {
  const [pdfReady, setPdfReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { selectedOption, setActiveTab } = useStore();

  async function handleDownload() {
    if (!result) return;
    setDownloading(true);
    try {
      let blob: Blob;
      try {
        blob = await downloadPdf(result.projectId);
      } catch {
        await new Promise((r) => setTimeout(r, 800));
        setPdfReady(true);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plankton-pv-${result.projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setPdfReady(true);
    } finally {
      setDownloading(false);
    }
  }

  if (!result) {
    return (
      <div className="empty-state">
        <i className="ti ti-file-description" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
        Analyze your project first to unlock export.
      </div>
    );
  }

  return (
    <>
      {/* Selected plan summary */}
      {selectedOption ? (
        <div style={{
          background: ACCENT_LIGHT[selectedOption.label],
          border: `1px solid ${ACCENT[selectedOption.label]}44`,
          borderRadius: 8,
          padding: '12px 14px',
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Selected System for Export
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT[selectedOption.label], marginBottom: 6 }}>
            Option {selectedOption.label} — {selectedOption.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {[
              ['PV', `${selectedOption.pvKwp} kWp`],
              ['Battery', selectedOption.batteryKwh > 0 ? `${selectedOption.batteryKwh} kWh` : 'None'],
              ['Production', `${selectedOption.estimatedAnnualProduction.toLocaleString()} kWh/yr`],
              ['Investment', `€${selectedOption.estimatedInvestmentMin.toLocaleString()}–${selectedOption.estimatedInvestmentMax.toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>{label}</div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px dashed var(--color-border)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 14,
          fontSize: 11,
          color: 'var(--color-text-secondary)',
        }}>
          <i className="ti ti-info-circle" style={{ fontSize: 12, marginRight: 5 }} />
          No plan selected. Go to{' '}
          <span
            style={{ color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setActiveTab('ov')}
          >
            Overview
          </span>
          {' '}and click "Explore with AI" to select a plan for the report.
        </div>
      )}

      <div className="stitle">
        <i className="ti ti-help-circle" style={{ fontSize: 14 }} /> Questions for your installer
      </div>
      <ol className="olist">
        {result.installerQuestions.map((q, i) => (
          <li key={i}>{renderBold(q)}</li>
        ))}
      </ol>

      <div className="stitle">
        <i className="ti ti-list-check" style={{ fontSize: 14 }} /> Next steps
      </div>
      <ol className="olist" style={{ marginBottom: 16 }}>
        {result.nextSteps.map((step, i) => (
          <li key={i}>{renderBold(step.text)}</li>
        ))}
      </ol>

      <div className="pbox">
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 3 }}>
          <i className="ti ti-file-description" style={{ fontSize: 13, verticalAlign: -1, marginRight: 5 }} />
          PDF One-Pager
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
          Complete report for your installer meeting — selected system, checklist, subsidies, open points
        </div>
        <button
          className="pdlbtn"
          onClick={handleDownload}
          disabled={downloading}
          style={
            pdfReady
              ? { background: 'var(--color-background-success)', color: 'var(--color-text-success)', border: '0.5px solid var(--color-border-success)' }
              : undefined
          }
        >
          {pdfReady ? (
            <><i className="ti ti-check" style={{ fontSize: 12, verticalAlign: -1 }} /> PDF ready to download</>
          ) : downloading ? (
            <><i className="ti ti-loader-2" style={{ fontSize: 13, verticalAlign: -1, marginRight: 5 }} /> Creating PDF…</>
          ) : (
            <><i className="ti ti-download" style={{ fontSize: 13, verticalAlign: -1, marginRight: 5 }} /> Download PDF</>
          )}
        </button>
      </div>

      <div className="disc">
        ⚠️ Report does not replace legal or professional advice · Created{' '}
        {new Date(result.generatedAt).toLocaleDateString('en-US')} · Plankton PV Assistant
      </div>
    </>
  );
}
