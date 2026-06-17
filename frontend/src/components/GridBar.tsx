import type { GridOperator } from '../types';

interface Props {
  operator: GridOperator | null;
  analyzed: boolean;
}

export default function GridBar({ operator, analyzed }: Props) {
  return (
    <div className="gbar">
      <i className="ti ti-bolt" style={{ fontSize: 13, color: 'var(--color-text-warning)' }} aria-hidden />
      {operator ? (
        <>
          <span>
            Netzbetreiber: <strong>{operator.name}</strong>
          </span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>·</span>
          <span>
            {operator.city} · {operator.state}
          </span>
        </>
      ) : (
        <span>Netzbetreiber wird ermittelt…</span>
      )}
      {analyzed && (
        <span style={{ marginLeft: 'auto', color: 'var(--color-text-success)', fontSize: 10 }}>
          <i className="ti ti-check" style={{ fontSize: 12, verticalAlign: -1 }} aria-hidden /> Analysiert
        </span>
      )}
    </div>
  );
}
