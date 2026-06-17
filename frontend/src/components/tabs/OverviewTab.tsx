import { useState } from 'react';
import type { AssessmentResult } from '../../types';
import StatusPill from '../StatusPill';
import SourceInspector from '../SourceInspector';
import OptionCard from '../OptionCard';
import { useStore } from '../../store/useStore';

interface Props {
  result: AssessmentResult | null;
}

const CONFIDENCE_CLS: Record<string, string> = { high: 'bg', medium: 'by', low: 'bd' };
const CONFIDENCE_LABEL: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low' };

export default function OverviewTab({ result }: Props) {
  const { selectedOption, setSelectedOption, setActiveTab, setSelectedSourceId } = useStore();
  const [showRegulatory, setShowRegulatory] = useState(false);

  if (!result) {
    return (
      <div className="empty-state">
        <i className="ti ti-solar-panel" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
        Enter your project details and click <strong>Analyze</strong> to generate personalized system recommendations.
      </div>
    );
  }

  const { technicalSummary: ts, systemOptions, regulatoryClaims, subsidies, openPoints } = result;

  function handleExplore(optionLabel: 'A' | 'B' | 'C') {
    const opt = systemOptions.find((o) => o.label === optionLabel) ?? null;
    setSelectedOption(opt);
    setActiveTab('ai');
  }

  return (
    <>
      {/* Technical baseline strip */}
      <div className="mets" style={{ marginBottom: 12 }}>
        <div className="mc">
          <div className="ml"><i className="ti ti-solar-panel" style={{ fontSize: 11, verticalAlign: -1 }} /> Roof Potential</div>
          <div className="mv">{ts.estimatedKwp} kWp</div>
          <div className="ms">max baseline</div>
        </div>
        <div className="mc">
          <div className="ml"><i className="ti ti-chart-bar" style={{ fontSize: 11, verticalAlign: -1 }} /> Annual Yield</div>
          <div className="mv">{ts.annualKwh.toLocaleString('en-US')} kWh</div>
          <div className="ms">PVGIS · ±15%</div>
        </div>
        <div className="mc">
          <div className="ml"><i className="ti ti-home" style={{ fontSize: 11, verticalAlign: -1 }} /> Self-use (no battery)</div>
          <div className="mv">{ts.selfConsumptionPct}%</div>
          <div className="ms">{ts.selfConsumptionWithStoragePct}% with battery</div>
        </div>
        <div className="mc">
          <div className="ml"><i className="ti ti-battery" style={{ fontSize: 11, verticalAlign: -1 }} /> Recommended Battery</div>
          <div className="mv">{ts.recommendedStorageKwh} kWh</div>
          <div className="ms">
            <span className={`badge ${CONFIDENCE_CLS[ts.confidence]}`}>{CONFIDENCE_LABEL[ts.confidence]} confidence</span>
          </div>
        </div>
      </div>

      {/* 3 Option cards */}
      <div className="stitle" style={{ marginBottom: 10 }}>
        <i className="ti ti-layout-grid" style={{ fontSize: 14 }} /> 3 Personalized System Options
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {systemOptions.map((opt) => (
          <OptionCard
            key={opt.label}
            option={opt}
            isSelected={selectedOption?.label === opt.label}
            onExplore={() => handleExplore(opt.label)}
          />
        ))}
      </div>

      {ts.notes.length > 0 && (
        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          <i className="ti ti-info-circle" style={{ fontSize: 11, verticalAlign: -1 }} />{' '}
          {ts.notes.join(' · ')}
        </div>
      )}

      {/* Regulatory details — collapsible */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: 10,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          userSelect: 'none',
        }}
        onClick={() => setShowRegulatory(!showRegulatory)}
      >
        <i className="ti ti-clipboard-check" style={{ fontSize: 13, color: 'var(--color-accent)' }} />
        <span style={{ fontSize: 11, fontWeight: 600 }}>Regulatory Details & Subsidies</span>
        <i
          className={`ti ${showRegulatory ? 'ti-chevron-up' : 'ti-chevron-down'}`}
          style={{ fontSize: 11, marginLeft: 'auto', color: 'var(--color-text-tertiary)' }}
        />
      </div>

      {showRegulatory && (
        <>
          <div style={{ marginTop: 10 }}>
            <div className="stitle">
              <i className="ti ti-clipboard-check" style={{ fontSize: 14 }} /> Regulatory Checklist
            </div>
            {regulatoryClaims.map((claim, i) => (
              <div
                key={i}
                className="ri"
                style={{ cursor: claim.sourceIds.length > 0 ? 'pointer' : 'default' }}
                onClick={() => claim.sourceIds[0] && setSelectedSourceId(claim.sourceIds[0])}
                title={claim.sourceIds.length > 0 ? 'View source' : undefined}
              >
                <StatusPill status={claim.status} />
                <div style={{ flex: 1 }}>
                  <div className="rt">{claim.text}</div>
                  <div className="rd">{claim.detail}</div>
                  <div className="rs">
                    {claim.sourceRef}
                    {claim.sourceIds.length > 0 && (
                      <span style={{ marginLeft: 6, color: 'var(--color-accent)', fontSize: 9 }}>
                        <i className="ti ti-external-link" style={{ fontSize: 9 }} /> Details
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <SourceInspector />

            <div className="stitle" style={{ marginTop: 12 }}>
              <i className="ti ti-coin-euro" style={{ fontSize: 14 }} /> Subsidies
            </div>
            <div className="subs">
              {subsidies.map((sub, i) => (
                <div key={i} className="sc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="sn">{sub.name}</div>
                    <StatusPill status={sub.status} small />
                  </div>
                  <div className="sa" style={{ color: sub.status === 'valid' ? 'var(--color-text-success)' : 'var(--color-text-warning)' }}>
                    {sub.amount}
                  </div>
                  <div className="sd">{sub.warning ? `⚠️ ${sub.description}` : sub.description}</div>
                </div>
              ))}
            </div>

            {openPoints.length > 0 && (
              <>
                <div className="stitle" style={{ marginTop: 12 }}>
                  <i className="ti ti-help-circle" style={{ fontSize: 14 }} /> Open Points
                </div>
                {openPoints.map((pt, i) => (
                  <div key={i} className="oq">
                    <i className="ti ti-point" style={{ fontSize: 11, flexShrink: 0, marginTop: 1 }} />
                    {pt}
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="disc">
            First orientation — does not replace legal or professional advice. Sources: EEG 2023, §3.72 EStG, VDE-AR-N 4105, MaStRV, §14a EnWG, KfW, BNetzA.
          </div>
        </>
      )}
    </>
  );
}
