import type { RegulatoryStatus } from '../types';

const CONFIG: Record<RegulatoryStatus, { emoji: string; label: string; cls: string }> = {
  valid:        { emoji: '🟢', label: 'Aktuell',       cls: 'bg' },
  announced:    { emoji: '🟡', label: 'Angekündigt',   cls: 'by' },
  transitional: { emoji: '🟠', label: 'Übergangsfrist', cls: 'by' },
  expired:      { emoji: '⚫', label: 'Abgelaufen',    cls: 'bgrey' },
  unclear:      { emoji: '🔴', label: 'Unklar',        cls: 'bd' },
};

interface Props {
  status: RegulatoryStatus;
  small?: boolean;
}

export default function StatusPill({ status, small }: Props) {
  const { emoji, label, cls } = CONFIG[status];
  return (
    <span className={`badge ${cls}`} style={small ? { fontSize: 9 } : undefined}>
      {emoji} {label}
    </span>
  );
}
