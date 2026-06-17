import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { CANNED_RESPONSES } from '../../data/mockAssessment';
import type { AssessmentResult } from '../../types';

interface Props {
  result: AssessmentResult | null;
  onSwitchToChat: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  html: string;
}

const QUICK_QUESTIONS = [
  { label: 'Anmeldepflicht?',     question: 'Muss ich die Anlage anmelden?' },
  { label: 'Förderungen?',        question: 'Welche Förderung bekomme ich?' },
  { label: 'Steuer?',             question: 'Muss ich Einnahmen versteuern?' },
  { label: 'Wallbox §14a?',       question: 'Was gilt für meine Wallbox?' },
  { label: 'Einspeisevergütung?', question: 'Wie hoch ist meine Einspeisevergütung?' },
];

const DISCLAIMER = '<span style="font-size:10px;color:var(--color-text-tertiary)">⚠️ Ersetzt keine Rechtsberatung.</span>';

export default function ChatTab({ onSwitchToChat }: Props) {
  const { addChatMessage } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'user',
      html: 'Muss ich meine PV-Anlage anmelden?',
    },
    {
      role: 'assistant',
      html:
        '<strong>Ja — zwei Pflichten:</strong><br><br>' +
        '<strong>1. MaStR-Registrierung</strong><br>' +
        'Binnen 1 Monat nach Inbetriebnahme (marktstammdatenregister.de)<br>' +
        '<span style="font-size:10px;color:var(--color-text-secondary)">📖 §§3 Nr.1, 5 MaStRV · 🟢 Aktuell seit 01.07.2017</span><br><br>' +
        '<strong>2. Netzanmeldung bei Avacon AG</strong><br>' +
        'Mindestens 4 Wochen vor Installation<br>' +
        '<span style="font-size:10px;color:var(--color-text-secondary)">📖 §13 NAV · 🟢 Aktuell · netz@avacon.de</span><br><br>' +
        DISCLAIMER,
    },
  ]);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }

  function addMessage(role: 'user' | 'assistant', html: string) {
    setMessages((prev) => [...prev, { role, html }]);
    addChatMessage({ role, content: html, timestamp: new Date().toISOString() });
    scrollToBottom();
  }

  function handleQuickQuestion(question: string) {
    onSwitchToChat();
    addMessage('user', question);
    const answer = CANNED_RESPONSES[question];
    setTimeout(() => {
      addMessage(
        'assistant',
        (answer ?? 'Ich suche in der Wissensbasis…<br><span style="font-size:10px">→ EEG · EnWG · VDE-AR-N 4105 · MaStRV</span>') +
          '<br><br>' +
          DISCLAIMER
      );
    }, 350);
  }

  function handleSend() {
    const q = input.trim();
    if (!q) return;
    setInput('');
    addMessage('user', q);
    setTimeout(() => {
      addMessage(
        'assistant',
        '<span style="color:var(--color-text-secondary);font-style:italic">Suche in Regulierungsdatenbank…<br>' +
          '<span style="font-size:10px">→ EEG · EnWG · VDE-AR-N 4105 · MaStRV</span></span><br><br>' +
          DISCLAIMER
      );
    }, 400);
  }

  return (
    <>
      <div className="qbtns">
        {QUICK_QUESTIONS.map(({ label, question }) => (
          <button key={label} className="qb" onClick={() => handleQuickQuestion(question)}>
            {label}
          </button>
        ))}
      </div>

      <div
        ref={chatRef}
        style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 2 }}
      >
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
          placeholder="Ihre Frage eingeben..."
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
          aria-label="Senden"
        >
          <i className="ti ti-send" style={{ fontSize: 13, verticalAlign: -1 }} />
        </button>
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
        Jede Antwort enthält Quellenangaben mit Gültigkeitsstatus
      </div>
    </>
  );
}
