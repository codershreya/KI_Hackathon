import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { BuildingType, Orientation } from '../types';

interface Props {
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analyzed: boolean;
}

const ORIENTATIONS: { value: Orientation; label: string }[] = [
  { value: 'S',  label: 'Süd (optimal)' },
  { value: 'SW', label: 'Südwest' },
  { value: 'SE', label: 'Südost' },
  { value: 'W',  label: 'West' },
  { value: 'E',  label: 'Ost' },
  { value: 'N',  label: 'Nord' },
  { value: 'N',  label: 'Flachdach' },
];

export default function Sidebar({ onAnalyze, isAnalyzing, analyzed }: Props) {
  const { projectInput, setProjectInput } = useStore();
  const [photoName, setPhotoName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleComponent(key: 'planStorage' | 'planWallbox' | 'planHeatPump') {
    setProjectInput({ [key]: !projectInput[key] });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhotoName(file.name);
  }

  return (
    <div className="sb">
      <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 8 }}>Ihr Projekt</div>

      <div className="sl">
        <i className="ti ti-map-pin" style={{ fontSize: 11, verticalAlign: -1 }} /> Adresse
      </div>
      <input
        type="text"
        value={projectInput.address}
        onChange={(e) => setProjectInput({ address: e.target.value })}
      />

      <div className="sl">Gebäudetyp</div>
      <select
        value={projectInput.buildingType}
        onChange={(e) => setProjectInput({ buildingType: e.target.value as BuildingType })}
      >
        <option value="single_family">Einfamilienhaus</option>
        <option value="multi_family">Zweifamilienhaus / MFH</option>
        <option value="commercial">Gewerbe</option>
      </select>

      <div className="sl">Dach</div>
      <div className="sb-row">
        <div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Fläche (m²)</div>
          <input
            type="number"
            value={projectInput.roofAreaM2}
            min={10}
            max={500}
            onChange={(e) => setProjectInput({ roofAreaM2: Number(e.target.value) })}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Neigung (°)</div>
          <input
            type="number"
            value={projectInput.roofPitchDeg}
            min={0}
            max={60}
            onChange={(e) => setProjectInput({ roofPitchDeg: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="sl">Ausrichtung</div>
      <select
        value={projectInput.roofOrientation}
        onChange={(e) => setProjectInput({ roofOrientation: e.target.value as Orientation })}
      >
        {ORIENTATIONS.map((o) => (
          <option key={o.label} value={o.value}>{o.label}</option>
        ))}
      </select>

      <div className="sl">Verbrauch (kWh/Jahr)</div>
      <input
        type="number"
        value={projectInput.annualKwhElec}
        min={500}
        max={50000}
        onChange={(e) => setProjectInput({ annualKwhElec: Number(e.target.value) })}
      />

      <div className="sl">Komponenten</div>
      <div>
        {/* PV is always on */}
        <span className="tag">PV-Anlage ✓</span>
        <span
          className={`tag ${projectInput.planStorage ? '' : 'off'}`}
          onClick={() => toggleComponent('planStorage')}
        >
          Batteriespeicher {projectInput.planStorage ? '✓' : ''}
        </span>
        <span
          className={`tag ${projectInput.planWallbox ? '' : 'off'}`}
          onClick={() => toggleComponent('planWallbox')}
        >
          Wallbox {projectInput.planWallbox ? '✓' : ''}
        </span>
        <span
          className={`tag ${projectInput.planHeatPump ? '' : 'off'}`}
          onClick={() => toggleComponent('planHeatPump')}
        >
          Wärmepumpe {projectInput.planHeatPump ? '✓' : ''}
        </span>
      </div>

      <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', marginBottom: 4 }}>
          <input
            type="checkbox"
            checked={projectInput.hasEV}
            onChange={(e) => setProjectInput({ hasEV: e.target.checked })}
          />
          E-Auto vorhanden
        </label>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={projectInput.existingPvKwp !== null}
            onChange={(e) =>
              setProjectInput({ existingPvKwp: e.target.checked ? 0 : null, existingPvYear: e.target.checked ? new Date().getFullYear() : null })
            }
          />
          Bestandsanlage
        </label>
      </div>

      <div className="sl">
        <i className="ti ti-camera" style={{ fontSize: 11, verticalAlign: -1 }} /> Dachfoto (optional)
      </div>
      <div
        className="upload"
        onClick={() => fileRef.current?.click()}
      >
        {photoName ? (
          <>
            <i className="ti ti-check" style={{ fontSize: 14, display: 'block', marginBottom: 2 }} />
            {photoName}
          </>
        ) : (
          <>
            <i className="ti ti-upload" style={{ fontSize: 16, display: 'block', marginBottom: 2 }} />
            JPG / PNG hochladen
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <button className="abtn" onClick={onAnalyze} disabled={isAnalyzing}>
        {isAnalyzing ? (
          <>
            <i className="ti ti-loader-2" style={{ fontSize: 12, verticalAlign: -1 }} /> Analysiere…
          </>
        ) : analyzed ? (
          <>
            <i className="ti ti-check" style={{ fontSize: 12, verticalAlign: -1 }} /> Analysiert
          </>
        ) : (
          <>
            <i className="ti ti-search" style={{ fontSize: 12, verticalAlign: -1 }} /> Analysieren
          </>
        )}
      </button>

      <div className="pviz">PVGIS · Nominatim · Claude claude-sonnet-4-6</div>
    </div>
  );
}
