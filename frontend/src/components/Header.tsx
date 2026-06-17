export default function Header() {
  return (
    <div className="hdr">
      <i className="ti ti-sun" style={{ fontSize: 18 }} aria-hidden />
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>Plankton PV Assistant</div>
        <div style={{ fontSize: 10, opacity: 0.7 }}>What rules really apply?</div>
      </div>
      <div style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>
        KI-Hackathon Energie 2026
      </div>
    </div>
  );
}
