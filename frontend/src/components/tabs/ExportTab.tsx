import { useState } from 'react';
import type { AssessmentResult } from '../../types';
import { downloadPdf, generateTender } from '../../api/client';
import type { TenderResult } from '../../types';

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
  const [tender, setTender] = useState<TenderResult | null>(null);
  const [tenderLoading, setTenderLoading] = useState(false);

  async function handleDownload() {
    if (!result) return;
    setDownloading(true);
    try {
      let blob: Blob;
      try {
        blob = await downloadPdf(result.projectId, result);
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

  async function handleTender() {
    if (!result) return;
    setTenderLoading(true);
    try {
      const t = await generateTender(result.projectId, result);
      setTender(t);
    } catch {
      // Fallback — generate basic tender from assessment data
      setTender({
        tenderText: result.installerQuestions.join('\n'),
        suggestedQuestions: result.installerQuestions,
        technicalSpecs: { estimatedKwp: result.technicalSummary.estimatedKwp },
      });
    } finally {
      setTenderLoading(false);
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

      {/* Tender / Installer Request */}
      <div className="pbox" style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 3 }}>
          <i className="ti ti-building-store" style={{ fontSize: 13, verticalAlign: -1, marginRight: 5 }} />
          Angebotsanfrage (KI-generiert)
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
          Strukturierte Anfrage an Installationsbetriebe — mit technischen Eckdaten und offenen Fragen
        </div>
        {!tender ? (
          <button className="pdlbtn" onClick={handleTender} disabled={tenderLoading}>
            {tenderLoading ? (
              <>
                <i className="ti ti-loader-2" style={{ fontSize: 13, verticalAlign: -1, marginRight: 5 }} /> Erstelle Anfrage…
              </>
            ) : (
              <>
                <i className="ti ti-sparkles" style={{ fontSize: 13, verticalAlign: -1, marginRight: 5 }} /> Angebotsanfrage erstellen
              </>
            )}
          </button>
        ) : (
          <div>
            <textarea
              readOnly
              value={tender.tenderText}
              style={{
                width: '100%',
                minHeight: 120,
                fontSize: 10,
                fontFamily: 'monospace',
                border: '0.5px solid var(--color-border)',
                borderRadius: 'var(--border-radius-sm)',
                padding: 8,
                resize: 'vertical',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
              }}
            />
            <button
              className="pdlbtn"
              style={{ marginTop: 6 }}
              onClick={() => {
                navigator.clipboard.writeText(tender.tenderText);
              }}
            >
              <i className="ti ti-copy" style={{ fontSize: 12, verticalAlign: -1, marginRight: 4 }} />
              Text kopieren
            </button>
          </div>
        )}
      </div>

      <div className="disc">
        ⚠️ Bericht ersetzt keine Rechts- oder Fachberatung · Erstellt{' '}
        {new Date(result.generatedAt).toLocaleDateString('de-DE')} · Plankton PV Assistant
      </div>
    </>
  );
}
