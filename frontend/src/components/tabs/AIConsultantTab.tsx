import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { CANNED_RESPONSES } from '../../data/mockAssessment';
import { sendChatMessage } from '../../api/client';
import type { AssessmentResult } from '../../types';

interface Props {
  result: AssessmentResult | null;
}

interface Message {
  role: 'user' | 'assistant';
  html: string;
}

const DISCLAIMER = '⚠️ Does not replace legal advice.';

const QUICK_QUESTIONS = [
  { label: 'Obligation to register?', q: 'Do I have to register my PV system?' },
  { label: 'Subsidies?',              q: 'Which subsidies do I get?' },
  { label: 'Tax?',                    q: 'Do I have to pay tax on income?' },
  { label: 'Wallbox §14a?',           q: 'What rules apply to my wallbox?' },
  { label: 'Feed-in tariff?',         q: 'How high is my feed-in tariff?' },
];

const ACCENT: Record<string, string> = { A: '#64748b', B: '#166534', C: '#4338ca' };

const DEFAULT_MESSAGES: Message[] = [
  { role: 'user', html: 'Do I have to register my PV system?' },
  {
    role: 'assistant',
    html:
      '<strong>Yes — two obligations:</strong><br><br>'
      + '<strong>1. MaStR registration</strong><br>Within 1 month after commissioning (marktstammdatenregister.de)<br>'
      + '<span style="font-size:10px;color:var(--color-text-secondary)">📖 §§3 No.1, 5 MaStRV · 🟢 Current since 01.07.2017</span><br><br>'
      + '<strong>2. Network registration with Avacon AG</strong><br>At least 4 weeks before installation<br>'
      + '<span style="font-size:10px;color:var(--color-text-secondary)">📖 §13 NAV · 🟢 Current · netz@avacon.de</span>'
      + '<br><br>' + DISCLAIMER,
  },
];

export default function AIConsultantTab({ result }: Props) {
  const { selectedOption, setSelectedOption, setActiveTab, addChatMessage } = useStore();
  const [messages, setMessages] = useState<Message[]>(DEFAULT_MESSAGES);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }

  function addMsg(role: 'user' | 'assistant', html: string) {
    setMessages((prev) => [...prev, { role, html }]);
    addChatMessage({ role, content: html, timestamp: new Date().toISOString() });
    scrollToBottom();
  }

  async function askLlm(userMsg: string) {
    addMsg('user', userMsg);

    const loadingHtml = `<span style="color:var(--color-text-secondary);font-style:italic">Searching regulatory database…<br>`
      + '<span style="font-size:10px">→ EEG · EnWG · VDE-AR-N 4105 · MaStRV</span></span>';
    setMessages((prev) => [...prev, { role: 'assistant', html: loadingHtml }]);
    scrollToBottom();

    try {
      const pId = result?.projectId ?? 'temp-project';
      const res = await sendChatMessage(pId, userMsg, selectedOption);
      addChatMessage({ role: 'assistant', content: res.answer, timestamp: new Date().toISOString() });
      setMessages((prev) => {
        const copy = [...prev];
        if (copy[copy.length - 1]?.role === 'assistant') {
          copy[copy.length - 1] = {
            role: 'assistant',
            html: res.answer.replace(/\n/g, '<br>') + '<br><br>' + DISCLAIMER,
          };
        }
        return copy;
      });
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        if (copy[copy.length - 1]?.role === 'assistant') {
          copy[copy.length - 1] = {
            role: 'assistant',
            html: `<span style="color:var(--color-text-danger)">Error — backend not reachable.</span><br><br>` + DISCLAIMER,
          };
        }
        return copy;
      });
    }
    scrollToBottom();
  }

  function handleQuickQuestion(q: string) {
    const answer = CANNED_RESPONSES[q];
    if (answer) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', html: q },
        { role: 'assistant', html: answer.en + '<br><br>' + DISCLAIMER },
      ]);
      scrollToBottom();
    } else {
      askLlm(q);
    }
  }

  function handleSend() {
    const q = input.trim();
    if (!q) return;
    setInput('');
    askLlm(q);
  }

  return (
    <>
      {/* Pinned selected plan */}
      {selectedOption ? (
        <div style={{
          background: `${ACCENT[selectedOption.label]}11`,
          border: `1px solid ${ACCENT[selectedOption.label]}44`,
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}>
          <div style={{
            background: ACCENT[selectedOption.label],
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
            textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            Option {selectedOption.label}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)', flexShrink: 0 }}>
            {selectedOption.name}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
            {[
              [`${selectedOption.pvKwp} kWp`, 'ti-solar-panel'],
              [selectedOption.batteryKwh > 0 ? `${selectedOption.batteryKwh} kWh battery` : 'No battery', 'ti-battery'],
              [`${selectedOption.estimatedAnnualProduction.toLocaleString()} kWh/yr`, 'ti-chart-bar'],
              [`${selectedOption.selfConsumptionPct}% self-use`, 'ti-home'],
              [`€${selectedOption.estimatedInvestmentMin.toLocaleString()}–${selectedOption.estimatedInvestmentMax.toLocaleString()}`, 'ti-coin-euro'],
            ].map(([val, icon]) => (
              <span key={val as string} style={{ fontSize: 10, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className={`ti ${icon}`} style={{ fontSize: 9, color: ACCENT[selectedOption.label] }} />
                {val}
              </span>
            ))}
          </div>
          <button
            onClick={() => { setSelectedOption(null); setActiveTab('ov'); }}
            style={{ fontSize: 9, color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}
            title="Change plan"
          >
            <i className="ti ti-x" style={{ fontSize: 11 }} />
          </button>
        </div>
      ) : (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px dashed var(--color-border)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <i className="ti ti-info-circle" style={{ fontSize: 13, color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            No plan selected. Go to{' '}
            <span
              style={{ color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setActiveTab('ov')}
            >
              Overview
            </span>
            {' '}and click <strong>"Explore with AI"</strong> on a recommendation for context-aware answers.
          </span>
        </div>
      )}

      {/* Quick questions */}
      <div className="qbtns">
        {QUICK_QUESTIONS.map(({ label, q }) => (
          <button key={label} className="qb" onClick={() => handleQuickQuestion(q)}>
            {label}
          </button>
        ))}
      </div>

      {/* Source context panel */}
      {selectedOption && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-books" style={{ fontSize: 10 }} />
            Sources: EEG 2023 · EnWG §14a · VDE-AR-N 4105 · MaStRV · KfW 270 · §3 Nr.72 EStG
          </div>
        </div>
      )}

      {/* Chat */}
      <div ref={chatRef} style={{ maxHeight: 340, overflowY: 'auto', paddingRight: 2 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`cm ${msg.role === 'user' ? 'cmu' : ''}`}>
            <div
              className={`cb ${msg.role === 'user' ? 'cbu' : 'cba'}`}
              dangerouslySetInnerHTML={{ __html: msg.html }}
            />
          </div>
        ))}
      </div>

      <div className="cir">
        <input
          type="text"
          placeholder={selectedOption ? `Ask about Option ${selectedOption.label} — ${selectedOption.name}…` : 'Enter your question…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          style={{
            padding: '0 12px',
            background: '#1a472a',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            cursor: 'pointer',
            fontSize: 12,
          }}
          aria-label="Send"
        >
          <i className="ti ti-send" style={{ fontSize: 13, verticalAlign: -1 }} />
        </button>
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
        Every answer contains sources with validity status
      </div>
    </>
  );
}
