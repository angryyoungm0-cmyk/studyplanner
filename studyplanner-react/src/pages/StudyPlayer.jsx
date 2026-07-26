import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SYLLABUS } from '../data/syllabus';

const SUGGESTIONS = [
  'Explain the main concept',
  'Give me practice problems',
  'Summarize this chapter',
  'What are the important formulas?'
];

export function StudyPlayer() {
  const { data } = useApp();
  const [view, setView] = useState('subjects');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatHistoryRef = useRef([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const apiKey = (data.settings.groqApiKey || '').trim();

  const selectSubject = (key) => {
    setSelectedSubject(key);
    setSelectedChapter(null);
    setView('chapters');
    setMessages([]);
    chatHistoryRef.current = [];
  };

  const selectChapter = (chId) => {
    setSelectedChapter(chId);
    setView('chat');
    setMessages([]);
    chatHistoryRef.current = [];
  };

  const goBack = () => {
    if (view === 'chat') { setView('chapters'); setSelectedChapter(null); setMessages([]); chatHistoryRef.current = []; }
    else if (view === 'chapters') { setView('subjects'); setSelectedSubject(null); }
  };

  const startFresh = () => {
    setView('subjects');
    setSelectedSubject(null);
    setSelectedChapter(null);
    setMessages([]);
    chatHistoryRef.current = [];
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'error', content: 'Please set your Groq API key in Settings first!' }]);
      return;
    }

    const userMsg = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const sub = SYLLABUS[selectedSubject];
    const ch = sub.chapters.find(c => c.id === selectedChapter);
    chatHistoryRef.current.push({ role: 'user', content: userMsg });

    const systemPrompt = `You are StudyPlayer, an AI tutor for Maharashtra State Board 10th grade students. You are helping with the subject "${sub.name}" and specifically the chapter "${ch.name}".

Rules:
- Answer in simple, clear language that a 10th grader can understand
- Use examples and step-by-step explanations
- For math problems, show complete working
- Relate concepts to real life when possible
- If asked about something outside this chapter, politely redirect to the relevant topic
- Use markdown for formatting (bold, lists, code blocks for math)
- Be encouraging and supportive
- Keep answers concise but complete
- If the student seems confused, try explaining in a different way`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistoryRef.current
          ],
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'API request failed');

      const aiText = result.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      chatHistoryRef.current.push({ role: 'assistant', content: aiText });
      setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', content: `Error: ${err.message}` }]);
    }

    setLoading(false);
  };

  const formatResponse = (text) => {
    return text
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  if (!apiKey) {
    return (
      <div className="container">
        <div className="sp-hero">
          <div className="sp-hero-icon">SP</div>
          <h1>StudyPlayer AI</h1>
          <p>Your personal AI study tutor for Maharashtra Board Class 10</p>
        </div>
        <div className="card sp-no-key">
          <p>You need a Groq API key to use StudyPlayer AI.</p>
          <p style={{marginTop:'0.5rem'}}>
            1. Go to <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer">console.groq.com</a> and get a free key<br/>
            2. Go to <strong>Settings</strong> and enter your API key
          </p>
          <p style={{marginTop:'1rem',color:'var(--success)',fontSize:'0.85rem'}}>
            The API is free and fast!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{display:'flex',flexDirection:'column',maxWidth:'700px'}}>
      <div className="sp-hero">
        <div className="sp-hero-icon">SP</div>
        <h1>StudyPlayer AI</h1>
        <p>Your personal AI study tutor for Maharashtra Board Class 10</p>
      </div>

      {view === 'subjects' && (
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
            <h2 style={{fontSize:'1.1rem'}}>Choose a Subject</h2>
          </div>
          <div className="sp-grid">
            {Object.entries(SYLLABUS).map(([key, sub]) => (
              <div key={key} className="sp-card" onClick={() => selectSubject(key)}>
                <div className="sp-card-icon">{sub.icon}</div>
                <div className="sp-card-name">{sub.name}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'chapters' && selectedSubject && (
        <>
          <div className="sp-chat-header">
            <button className="sp-back-btn" onClick={goBack}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className="sp-chat-header-info">
              <div className="sp-chat-header-avatar">{SYLLABUS[selectedSubject].icon}</div>
              <div>
                <div style={{fontWeight:600,fontSize:'0.95rem'}}>{SYLLABUS[selectedSubject].name}</div>
                <div style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>Select a chapter</div>
              </div>
            </div>
          </div>
          <div className="sp-grid" style={{marginTop:'1rem'}}>
            {SYLLABUS[selectedSubject].chapters.map(ch => (
              <div key={ch.id} className="sp-card" onClick={() => selectChapter(ch.id)}>
                <div className="sp-card-name">{ch.name}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'chat' && selectedChapter && (
        <>
          <div className="sp-chat-header">
            <button className="sp-back-btn" onClick={goBack}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className="sp-chat-header-info">
              <div className="sp-chat-header-avatar">SP</div>
              <div>
                <div style={{fontWeight:600,fontSize:'0.95rem'}} id="spChatTitle">
                  {SYLLABUS[selectedSubject].chapters.find(c => c.id === selectedChapter)?.name}
                </div>
                <div style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>
                  {SYLLABUS[selectedSubject].name} - StudyPlayer AI
                </div>
              </div>
            </div>
            <button className="sp-back-btn" onClick={startFresh} title="New chat" style={{marginLeft:'auto'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
          </div>

          <div className="sp-chat-messages">
            {messages.length === 0 && (
              <div className="sp-welcome-msg">
                <div className="sp-welcome-avatar">SP</div>
                <div className="sp-welcome-text">
                  <h3>Hi there! I'm StudyPlayer</h3>
                  <p>Ask me anything about <strong>
                    {SYLLABUS[selectedSubject].chapters.find(c => c.id === selectedChapter)?.name}
                  </strong> from Maharashtra Board 10th {SYLLABUS[selectedSubject].name}.</p>
                  <div className="sp-suggestions">
                    {SUGGESTIONS.map((sug, i) => (
                      <button key={i} className="sp-suggestion-chip" onClick={() => sendMessage(sug)}>
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`sp-msg ${msg.role === 'user' ? 'sp-msg-user' : 'sp-msg-ai'}`}>
                <div className="sp-msg-avatar">{msg.role === 'user' ? 'You' : 'SP'}</div>
                <div
                  className="sp-msg-bubble"
                  style={msg.role === 'error' ? {color:'var(--danger)'} : {}}
                  dangerouslySetInnerHTML={{__html: msg.role === 'ai' ? formatResponse(msg.content) : msg.content}}
                />
              </div>
            ))}

            {loading && (
              <div className="sp-msg sp-msg-ai">
                <div className="sp-msg-avatar">SP</div>
                <div className="sp-msg-bubble">
                  <div className="sp-typing"><span></span><span></span><span></span></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="sp-input-area">
            <div className="sp-input-wrapper">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask a question..."
              />
              <button
                className="sp-send-btn"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
