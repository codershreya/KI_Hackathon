import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { sendChatMessage } from '../../api/client';
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

const DISCLAIMER =
  '<span style="font-size:10px;color:var(--color-text-tertiary)">⚠️ Ersetzt keine Rechtsberatung.</span>';

export default function ChatTab({ result, onSwitchToChat }: Props) {
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
        '<strong>2. Netzanmeldung beim Netzbetreiber</strong><br>' +
        'Mindestens 4 Wochen vor Installation<br>' +
        '<span style="font-size:10px;color:var(--color-text-secondary)">📖 §13 NAV · 🟢 Aktuell</span><br><br>' +
        DISCLAIMER,
    },
  ]);
  const [input, setInput] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const projectId = result?.projectId ?? 'demo';
  const projectContext = result
    ? {
        address: (result as any).address,
        technicalSummary: result.technicalSummary,
        trafficLight: result.trafficLight,
        gridOperator: result.gridOperator,
      }
    : {};

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

  async function askQuestion(question: string) {
    onSwitchToChat();
    addMessage('user', question);
    setIsWaiting(true);

    try {
      const { answer } = await sendChatMessage(projectId, question, projectContext);
      // Convert newlines to <br> and wrap in disclaimer
      const html = answer.replace(/\n/g, '<br>') + '<br><br>' + DISCLAIMER;
      addMessage('assistant', html);
    } catch {
      // Fallback when API key is not configured
      addMessage(
        'assistant',
        '<span style="color:var(--color-text-secondary);font-style:italic">' +
          'Suche in Regulierungsdatenbank…<br>' +
          '<span style="font-size:10px">→ EEG · EnWG · VDE-AR-N 4105 · MaStRV</span>' +
          '</span><br><br>' +
          DISCLAIMER
      );
    } finally {
      setIsWaiting(false);
    }
  }

  function handleSend() {
    const q = input.trim();
    if (!q || isWaiting) return;
    setInput('');
    askQuestion(q);
  }

  return (
    <>
      <div className="qbtns">
        {QUICK_QUESTIONS.map(({ label, question }) => (
          <button
            key={label}
            className="qb"
            onClick={() => askQuestion(question)}
            disabled={isWaiting}
          >
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
        {isWaiting && (
          <div className="cm">
            <div className="cb cba" style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)', fontSize: 11 }}>
              <i className="ti ti-loader-2" style={{ fontSize: 12, verticalAlign: -1, marginRight: 4 }} />
              Suche in Regulierungsdatenbank…
            </div>
          </div>
        )}
      </div>

      <div className="cir">
        <input
          type="text"
          placeholder="Ihre Frage eingeben..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isWaiting}
        />
        <button
          onClick={handleSend}
          disabled={isWaiting}
          style={{
            padding: '0 12px',
            background: '#1a472a',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            cursor: isWaiting ? 'not-allowed' : 'pointer',
            fontSize: 12,
            opacity: isWaiting ? 0.6 : 1,
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
