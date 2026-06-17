import type { AssessmentResult } from '../types';

const STATUS_BADGE: Record<string, string> = {
  valid:        '<span style="background:#f0fdf4;color:#15803d;padding:1px 6px;border-radius:10px;font-size:10px">🟢 Aktuell</span>',
  announced:    '<span style="background:#fffbeb;color:#d97706;padding:1px 6px;border-radius:10px;font-size:10px">🟡 Angekündigt</span>',
  transitional: '<span style="background:#fffbeb;color:#d97706;padding:1px 6px;border-radius:10px;font-size:10px">🟠 Übergangsfrist</span>',
  expired:      '<span style="background:#f3f4f6;color:#6b7280;padding:1px 6px;border-radius:10px;font-size:10px">⚫ Abgelaufen</span>',
  unclear:      '<span style="background:#fef2f2;color:#dc2626;padding:1px 6px;border-radius:10px;font-size:10px">🔴 Unklar</span>',
};

function renderHtml(assessment: AssessmentResult): string {
  const { technicalSummary: ts, gridOperator, regulatoryClaims, subsidies, openPoints, nextSteps } = assessment;
  const date = new Date(assessment.generatedAt).toLocaleDateString('de-DE');

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 15mm; }
  h1 { font-size: 18px; color: #1a472a; margin-bottom: 4px; }
  h2 { font-size: 13px; font-weight: 600; color: #1a472a; margin: 14px 0 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
  .meta { font-size: 10px; color: #6b7280; margin-bottom: 12px; }
  .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 8px; }
  .card { background: #f9fafb; border-radius: 6px; padding: 8px 10px; }
  .card-label { font-size: 9px; color: #6b7280; margin-bottom: 2px; }
  .card-value { font-size: 15px; font-weight: 600; }
  .card-sub { font-size: 9px; color: #9ca3af; }
  .row { display: flex; gap: 8px; align-items: flex-start; padding: 5px 0; border-bottom: 0.5px solid #e5e7eb; }
  .row:last-child { border-bottom: none; }
  .row-title { font-weight: 600; font-size: 11px; }
  .row-detail { font-size: 10px; color: #6b7280; margin-top: 1px; }
  .row-ref { font-size: 9px; color: #9ca3af; font-style: italic; margin-top: 1px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .sc { border: 0.5px solid #e5e7eb; border-radius: 6px; padding: 8px; }
  .sc-name { font-size: 11px; font-weight: 600; margin-bottom: 2px; }
  .sc-amount { font-size: 12px; font-weight: 600; color: #15803d; }
  .sc-desc { font-size: 9px; color: #6b7280; }
  .oq { background: #fffbeb; border-radius: 5px; padding: 5px 8px; margin-bottom: 3px; font-size: 10px; }
  ol { padding-left: 18px; }
  ol li { padding: 2px 0; font-size: 10px; }
  .footer { margin-top: 16px; padding-top: 8px; border-top: 0.5px solid #e5e7eb; font-size: 9px; color: #9ca3af; font-style: italic; }
  @page { size: A4; margin: 15mm; }
</style>
</head>
<body>
<h1>☀️ Plankton PV Assistant</h1>
<div class="meta">
  ${gridOperator ? `Netzbetreiber: ${gridOperator.name} · ${gridOperator.city} · ${gridOperator.state}` : ''} &nbsp;|&nbsp; Erstellt: ${date}
</div>

<h2>Technische Zusammenfassung</h2>
<div class="grid4">
  <div class="card"><div class="card-label">Anlagengröße</div><div class="card-value">${ts.estimatedKwp} kWp</div><div class="card-sub">${ts.moduleCountMax} Module (est.)</div></div>
  <div class="card"><div class="card-label">Jahresertrag</div><div class="card-value">${ts.annualKwh.toLocaleString('de-DE')} kWh</div><div class="card-sub">PVGIS ±15%</div></div>
  <div class="card"><div class="card-label">Eigenverbrauch</div><div class="card-value">${ts.selfConsumptionPct}%</div><div class="card-sub">${ts.selfConsumptionWithStoragePct}% mit Speicher</div></div>
  <div class="card"><div class="card-label">Speicher</div><div class="card-value">${ts.recommendedStorageKwh} kWh</div><div class="card-sub">empfohlen</div></div>
</div>

<h2>Regulierungs-Checkliste</h2>
${regulatoryClaims
  .slice(0, 8)
  .map(
    (c) => `<div class="row">
  ${STATUS_BADGE[c.status] ?? STATUS_BADGE.unclear}
  <div>
    <div class="row-title">${c.text}</div>
    <div class="row-detail">${c.detail}</div>
    <div class="row-ref">${c.sourceRef}</div>
  </div>
</div>`
  )
  .join('')}

<h2>Förderungen</h2>
<div class="grid2">
${subsidies
  .map(
    (s) => `<div class="sc">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div class="sc-name">${s.name}</div>${STATUS_BADGE[s.status] ?? ''}
  </div>
  <div class="sc-amount">${s.amount}</div>
  <div class="sc-desc">${s.description}</div>
</div>`
  )
  .join('')}
</div>

<h2>Offene Punkte</h2>
${openPoints.map((p) => `<div class="oq">° ${p}</div>`).join('')}

<h2>Nächste Schritte</h2>
<ol>
${nextSteps.map((s) => `<li>${s.text}</li>`).join('')}
</ol>

<div class="footer">
  ⚠️ Erste Orientierung — ersetzt keine Rechts- oder Fachberatung.
  Quellen: EEG 2023, §3 Nr.72 EStG, VDE-AR-N 4105, MaStRV, §14a EnWG, KfW, BNetzA.
  Plankton PV Assistant · ${date}
</div>
</body>
</html>`;
}

export async function generatePdf(assessment: AssessmentResult): Promise<Buffer> {
  // Dynamic import to avoid startup cost when Puppeteer is not installed
  const puppeteer = await import('puppeteer').catch(() => null);

  if (!puppeteer) {
    throw new Error('puppeteer not installed — run: npm install puppeteer');
  }

  const html = renderHtml(assessment);

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
