import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';

export function StudyPlayer() {
  const { data, navigateTo } = useApp();
  const { t } = useI18n();
  const chatEndRef = useRef(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I\'m your AI study assistant. Ask me about any topic or concept!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'assistant', text: 'No API key configured. Add VITE_GROQ_API_KEY to your .env file.' }]);
        setLoading(false);
        return;
      }

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are a helpful study assistant for a Class 10 Maharashtra State Board student. Explain concepts simply, give examples, and help with homework. Be encouraging and supportive.' },
            ...messages.map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: userMsg }
          ],
          max_tokens: 500,
        })
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Network error. Please check your connection.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="sp-hero">
        <div className="sp-hero-content">
          <div className="sp-hero-badge">AI Powered</div>
          <h1 className="sp-hero-title">{t('chatTitle')}</h1>
          <p className="sp-hero-subtitle">{t('chatSubtitle')}</p>
          {data.subjects.length > 0 && (
            <div className="sp-subject-chips">
              {data.subjects.map(sub => (
                <span key={sub.id} className="sp-chip" onClick={() => setInput(`Tell me about ${sub.name} - explain all chapters`)}>
                  {sub.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.subjects.length > 0 && (
        <div className="card">
          <h2>{t('chooseSubject')}</h2>
          <div className="sp-grid">
            {data.subjects.map(sub => (
              <div key={sub.id} className="sp-card" onClick={() => { navigateTo('subjects'); }}>
                <div className="sp-card-icon" style={{backgroundColor: sub.color + '22', color: sub.color}}>
                  {sub.name.charAt(0)}
                </div>
                <div className="sp-card-name">{sub.name}</div>
                <div className="sp-card-progress">
                  {sub.chapters.filter(c => c.done).length}/{sub.chapters.length} chapters
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className={`chat-bubble ${msg.role}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <div className="chat-bubble assistant">Thinking...</div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={t('chatPlaceholder')}
          />
          <button className="chat-send" onClick={sendMessage} disabled={loading || !input.trim()}>
            &#10148;
          </button>
        </div>
      </div>
    </div>
  );
}