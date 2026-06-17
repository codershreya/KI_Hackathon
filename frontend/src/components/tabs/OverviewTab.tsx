import type { AssessmentResult, RegulatoryStatus } from '../../types';
import StatusPill from '../StatusPill';

interface Props {
  result: AssessmentResult | null;
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'hoch',
  medium: 'mittel',
  low: 'niedrig',
};
const CONFIDENCE_CLS: Record<string, string> = {
  high: 'bg',
  medium: 'by',
  low: 'bd',
};

function SubsidyAmountColor(status: RegulatoryStatus) {
  return status === 'valid' ? 'var(--color-text-success)' : 'var(--color-text-warning)';
}

export default function OverviewTab({ result }: Props) {
  if (!result) {
    return (
      <div className="empty-state">
        <i className="ti ti-solar-panel" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
        Geben Sie Ihre Projektdaten ein und klicken Sie auf <strong>Analysieren</strong>.
      </div>
    );
  }

  const { technicalSummary: ts, regulatoryClaims, subsidies, openPoints } = result;

  return (
    <>
      {/* AI roof analysis card */}
      <div className="rcard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-camera" style={{ fontSize: 13 }} /> KI-Dachanalyse
          </div>
          <span className={`badge ${CONFIDENCE_CLS[ts.confidence]}`}>
            Konfidenz: {CONFIDENCE_LABEL[ts.confidence]}
          </span>
        </div>
        <div className="rgrid">
          <div>
            <div className="ml">Module (est.)</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>
              {ts.moduleCountMin} – {ts.moduleCountMax}
            </div>
          </div>
          <div>
            <div className="ml">Kapazität</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>~{ts.estimatedKwp} kWp</div>
          </div>
          <div>
            <div className="ml">Ausrichtung</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{ts.orientation}</div>
          </div>
        </div>
        {ts.notes.length > 0 && (
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 5 }}>
            <i className="ti ti-info-circle" style={{ fontSize: 11, verticalAlign: -1 }} />{' '}
            {ts.notes.join(' · ')}
          </div>
        )}
      </div>

      {/* Metric cards */}
      <div className="mets">
        <div className="mc">
          <div className="ml">
            <i className="ti ti-solar-panel" style={{ fontSize: 11, verticalAlign: -1 }} /> Anlagengröße
          </div>
          <div className="mv">{ts.estimatedKwp} kWp</div>
          <div className="ms">{ts.moduleCountMax} Module</div>
        </div>
        <div className="mc">
          <div className="ml">
            <i className="ti ti-chart-bar" style={{ fontSize: 11, verticalAlign: -1 }} /> Jahresertrag
          </div>
          <div className="mv">{ts.annualKwh.toLocaleString('de-DE')} kWh</div>
          <div className="ms">PVGIS · ±15%</div>
        </div>
        <div className="mc">
          <div className="ml">
            <i className="ti ti-home" style={{ fontSize: 11, verticalAlign: -1 }} /> Eigenverbrauch
          </div>
          <div className="mv">{ts.selfConsumptionPct} %</div>
          <div className="ms">{ts.selfConsumptionWithStoragePct}% mit Speicher</div>
        </div>
        <div className="mc">
          <div className="ml">
            <i className="ti ti-battery" style={{ fontSize: 11, verticalAlign: -1 }} /> Speicher
          </div>
          <div className="mv">{ts.recommendedStorageKwh} kWh</div>
          <div className="ms">empfohlen</div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
        Quelle: PVGIS-SARAH3 (EU JRC) · 52,4° N · Systemverluste 14% · Unsicherheit ±15%
      </div>

      {/* Regulatory checklist */}
      <div className="stitle">
        <i className="ti ti-clipboard-check" style={{ fontSize: 14 }} /> Regulierungs-Checkliste
      </div>

      {regulatoryClaims.map((claim, i) => (
        <div key={i} className="ri">
          <StatusPill status={claim.status} />
          <div>
            <div className="rt">{claim.text}</div>
            <div className="rd">{claim.detail}</div>
            <div className="rs">{claim.sourceRef}</div>
          </div>
        </div>
      ))}

      {/* Subsidies */}
      <div className="stitle">
        <i className="ti ti-coin-euro" style={{ fontSize: 14 }} /> Förderungen
      </div>
      <div className="subs">
        {subsidies.map((sub, i) => (
          <div key={i} className="sc">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="sn">{sub.name}</div>
              <StatusPill status={sub.status} small />
            </div>
            <div className="sa" style={{ color: SubsidyAmountColor(sub.status) }}>
              {sub.amount}
            </div>
            <div className="sd">
              {sub.warning ? `⚠️ ${sub.description}` : sub.description}
            </div>
          </div>
        ))}
      </div>

      {/* Open points */}
      <div className="stitle">
        <i className="ti ti-help-circle" style={{ fontSize: 14 }} /> Offene Punkte
      </div>
      {openPoints.map((pt, i) => (
        <div key={i} className="oq">
          <i className="ti ti-point" style={{ fontSize: 11, flexShrink: 0, marginTop: 1 }} />
          {pt}
        </div>
      ))}

      <div className="disc">
        ⚠️ Erste Orientierung — ersetzt keine Rechts- oder Fachberatung. Quellen: EEG 2023,
        §3 Nr.72 EStG, VDE-AR-N 4105, MaStRV, §14a EnWG, KfW, BNetzA.
      </div>
    </>
  );
}
