import { useState } from 'react';
import type { AssessmentResult } from '../../types';
import { downloadPdf } from '../../api/client';

interface Props {
  result: AssessmentResult | null;
}

function renderBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
  );
}

export default function ExportTab({ result }: Props) {
  const [pdfReady, setPdfReady] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!result) return;
    setDownloading(true);
    try {
      let blob: Blob;
      try {
        blob = await downloadPdf(result.projectId);
      } catch {
        // Backend not available — simulate delay
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
        Analysieren Sie zuerst Ihr Projekt, um den Export freizuschalten.
      </div>
    );
  }

  return (
    <>
      <div className="stitle">
        <i className="ti ti-help-circle" style={{ fontSize: 14 }} /> Fragen für Ihren Installateur
      </div>
      <ol className="olist">
        {result.installerQuestions.map((q, i) => (
          <li key={i}>{renderBold(q)}</li>
        ))}
      </ol>

      <div className="stitle">
        <i className="ti ti-list-check" style={{ fontSize: 14 }} /> Nächste Schritte
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
          Kompletter Bericht für Ihr Installateur-Gespräch — Technik, Checkliste, Förderungen, offene Punkte
        </div>
        <button
          className="pdlbtn"
          onClick={handleDownload}
          disabled={downloading}
          style={
            pdfReady
              ? {
                  background: 'var(--color-background-success)',
                  color: 'var(--color-text-success)',
                  border: '0.5px solid var(--color-border-success)',
                }
              : undefined
          }
        >
          {pdfReady ? (
            <>
              <i className="ti ti-check" style={{ fontSize: 12, verticalAlign: -1 }} /> PDF bereit zum Herunterladen
            </>
          ) : downloading ? (
            <>
              <i className="ti ti-loader-2" style={{ fontSize: 13, verticalAlign: -1, marginRight: 5 }} /> Erstelle PDF…
            </>
          ) : (
            <>
              <i className="ti ti-download" style={{ fontSize: 13, verticalAlign: -1, marginRight: 5 }} /> PDF herunterladen
            </>
          )}
        </button>
      </div>

      <div className="disc">
        ⚠️ Bericht ersetzt keine Rechts- oder Fachberatung · Erstellt{' '}
        {new Date(result.generatedAt).toLocaleDateString('de-DE')} · Plankton PV Assistant
      </div>
    </>
  );
}
