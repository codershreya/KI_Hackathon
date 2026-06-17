import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { getSources } from '../api/client';
import StatusPill from './StatusPill';
import type { RegulatoryDocument } from '../types';

export default function SourceInspector() {
  const { selectedSourceId, setSelectedSourceId } = useStore();
  const [doc, setDoc] = useState<RegulatoryDocument | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedSourceId) {
      setDoc(null);
      return;
    }
    setLoading(true);
    getSources()
      .then((docs) => {
        const found = docs.find((d) => d.id === selectedSourceId) ?? null;
        setDoc(found);
      })
      .catch(() => setDoc(null))
      .finally(() => setLoading(false));
  }, [selectedSourceId]);

  if (!selectedSourceId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setSelectedSourceId(null)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 40,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 320,
        background: 'var(--color-bg)', borderLeft: '1px solid var(--color-border)',
        zIndex: 50, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 16px rgba(0,0,0,0.1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Source</span>
          <button
            onClick={() => setSelectedSourceId(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-text-secondary)', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px', flex: 1 }}>
          {loading && (
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              <i className="ti ti-loader-2" style={{ fontSize: 13, marginRight: 4 }} />
              Loading…
            </div>
          )}

          {!loading && !doc && (
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              Source not found.
            </div>
          )}

          {!loading && doc && (
            <>
              <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>{doc.title}</h3>

              <div style={{ marginBottom: 8 }}>
                <StatusPill status={doc.status} small />
              </div>

              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', marginBottom: 12 }}>
                <tbody>
                  {[
                    ['Source', doc.source],
                    ['Version', doc.version],
                    ['Valid from', doc.validFrom],
                    ['Valid until', doc.validUntil ?? 'indefinite'],
                    ['Tags', doc.tags.join(', ')],
                  ].map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '4px 0', color: 'var(--color-text-secondary)', width: '40%' }}>{label}</td>
                      <td style={{ padding: '4px 0', fontWeight: 500 }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 4 }}>Content</div>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6, background: 'var(--color-surface)', padding: 10, borderRadius: 4, border: '1px solid var(--color-border)' }}>
                {doc.chunkText}
              </p>

              {doc.sourceUrl && (
                <a
                  href={doc.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, color: 'var(--color-accent)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12 }}
                >
                  <i className="ti ti-external-link" style={{ fontSize: 11 }} />
                  Open source
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
