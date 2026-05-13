import { useState, useRef, useEffect } from 'react';
import api from '../../lib/api';

export default function Chatbot() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    { from: 'ai', text: 'Hi! I\'m your AI librarian 📚 Ask me to find books, check due dates, or get recommendations!' }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text }]);
    setLoading(true);
    try {
      const { data } = await api.post('/chatbot', { message: text });
      let reply = data.reply;
      if (data.books?.length > 0) {
        reply += '\n\n' + data.books.map(b =>
          `📖 "${b.title}" by ${b.author} — ${parseInt(b.available_copies) > 0 ? '✅ Available' : '❌ Unavailable'} · Shelf ${b.shelf_location || 'N/A'}`
        ).join('\n');
      }
      if (data.transactions?.length > 0) {
        reply += '\n\n' + data.transactions.map(t =>
          `📋 "${t.title}" — due in ${t.days_left} day${t.days_left !== 1 ? 's' : ''}`
        ).join('\n');
      }
      setMessages(prev => [...prev, { from: 'ai', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { from: 'ai', text: 'Sorry, I had trouble with that. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          border: 'none', cursor: 'pointer', fontSize: 22,
          boxShadow: '0 8px 25px rgba(99,102,241,0.4)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 1000,
          width: 340, background: '#1e293b',
          border: '1px solid rgba(148,163,184,0.2)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', height: 440,
        }}>
          {/* Header */}
          <div style={{ background: '#16213e', borderBottom: '1px solid rgba(148,163,184,0.12)',
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>LibraryOS Assistant</div>
              <div style={{ fontSize: 11, color: '#34d399' }}>● Online</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                maxWidth: '85%', alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
                padding: '8px 12px', borderRadius: m.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.from === 'user' ? '#6366f1' : '#293548',
                fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap',
              }}>
                {m.from === 'ai' && <div style={{ fontSize: 10, color: '#818cf8', fontWeight: 700, marginBottom: 2 }}>ASSISTANT</div>}
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#293548', borderRadius: '16px 16px 16px 4px',
                padding: '10px 14px', fontSize: 18, letterSpacing: 4 }}>
                <span style={{ animation: 'pulse 1s infinite' }}>···</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid rgba(148,163,184,0.12)', padding: '10px 12px',
            display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about books, due dates..."
              style={{
                flex: 1, background: '#0f172a',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 8, padding: '7px 10px',
                fontSize: 12, color: '#f1f5f9', outline: 'none',
              }}
            />
            <button
              onClick={send}
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: loading ? '#293548' : '#6366f1',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, transition: 'background 0.15s',
              }}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
