import type { SystemOption } from '../types';

interface Props {
  option: SystemOption;
  isSelected: boolean;
  onExplore: () => void;
}

const ACCENT: Record<string, string> = {
  A: '#64748b',
  B: '#166534',
  C: '#4338ca',
};
const ACCENT_LIGHT: Record<string, string> = {
  A: '#f1f5f9',
  B: '#f0fdf4',
  C: '#eef2ff',
};
const ACCENT_BORDER: Record<string, string> = {
  A: '#94a3b8',
  B: '#16a34a',
  C: '#6366f1',
};

const RATING_LABELS = [
  ['technicalEfficiency', 'Technical Efficiency'],
  ['runningEfficiency', 'Running Efficiency'],
  ['economicValue', 'Economic Value'],
  ['regulatorySimplicity', 'Regulatory Simplicity'],
  ['futureReadiness', 'Future Readiness'],
] as const;

function Stars({ value }: { value: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i
          key={i}
          className={i <= value ? 'ti ti-star-filled' : 'ti ti-star'}
          style={{ fontSize: 9, color: i <= value ? '#f59e0b' : 'var(--color-border)' }}
        />
      ))}
    </span>
  );
}

export default function OptionCard({ option, isSelected, onExplore }: Props) {
  const accent = ACCENT[option.label];
  const accentLight = ACCENT_LIGHT[option.label];
  const accentBorder = ACCENT_BORDER[option.label];

  return (
    <div style={{
      border: `2px solid ${isSelected ? accent : accentBorder}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isSelected ? `0 0 0 2px ${accent}33` : 'none',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Header */}
      <div style={{ background: accent, padding: '10px 14px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Option {option.label}
            </span>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 1 }}>{option.name}</div>
            <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>{option.tagline}</div>
          </div>
          {option.label === 'B' && (
            <span style={{ background: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap' }}>
              ★ Recommended
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* System specs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {[
            ['ti-solar-panel', 'PV Size', `${option.pvKwp} kWp`],
            ['ti-battery', 'Battery', option.batteryKwh > 0 ? `${option.batteryKwh} kWh` : 'None'],
            ['ti-bolt', 'Inverter', `${option.inverterKw} kW`],
            ['ti-car', 'Wallbox', option.wallboxCompatible ? '✓ Compatible' : '✗ Not included'],
            ['ti-home', 'Heat Pump', option.heatPumpCompatible ? '✓ Compatible' : '✗ Limited'],
          ].map(([icon, label, value]) => (
            <div key={label as string} style={{
              background: accentLight,
              borderRadius: 5,
              padding: '5px 8px',
              border: `1px solid ${accentBorder}22`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                <i className={`ti ${icon}`} style={{ fontSize: 9, color: accent }} />
                <span style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>{label}</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Ratings */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>
            Ratings
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {RATING_LABELS.map(([key, label]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{label}</span>
                <Stars value={option.ratings[key]} />
              </div>
            ))}
          </div>
        </div>

        {/* Financials */}
        <div style={{ background: accentLight, borderRadius: 6, padding: '8px 10px', border: `1px solid ${accentBorder}33` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              ['Investment', `€${option.estimatedInvestmentMin.toLocaleString()}–${option.estimatedInvestmentMax.toLocaleString()}`],
              ['Annual Production', `${option.estimatedAnnualProduction.toLocaleString()} kWh`],
              ['Est. Annual Savings', `€${option.estimatedAnnualSavings.toLocaleString()}`],
              ['Self-Consumption', `${option.selfConsumptionPct}%`],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>{label}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: accent }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
          {option.summary}
        </p>

        {/* CTA */}
        <button
          onClick={onExplore}
          style={{
            marginTop: 'auto',
            padding: '8px 14px',
            background: isSelected ? accent : 'transparent',
            color: isSelected ? '#fff' : accent,
            border: `1.5px solid ${accent}`,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          <i className="ti ti-robot" style={{ fontSize: 12 }} />
          {isSelected ? 'Selected — AI Consultant Open' : 'Explore with AI'}
        </button>
      </div>
    </div>
  );
}
