import { useState, useRef, useEffect } from 'react'
import client from '../api/client'

export default function ExerciseChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm RehabSense AI 🤖\n\nDescribe your problem or injury and I'll suggest appropriate rehabilitation exercises for you." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const history = messages
        .slice(1)
        .filter(m => m.role === 'user' || m.role === 'bot')
        .map(m => ({ role: m.role === 'bot' ? 'model' : 'user', parts: [{ text: m.text }] }))
      const { data } = await client.post('/ai/chat', { message: msg, history })
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '❌ Could not connect to AI. Please check your API key.' }])
    }
    setLoading(false)
  }

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(o => !o)} title="AI Exercise Advisor">
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div className="chat-drawer fade-in">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{ fontSize: '1rem' }}>🤖</span>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.85rem' }}>AI Exercise Advisor</div>
                <div style={{ fontSize: '.62rem', color: 'var(--muted)' }}>Powered by Gemini</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>{m.text}</div>
            ))}
            {loading && <div className="chat-msg bot" style={{ color: 'var(--muted)' }}>Thinking<span className="dot" style={{ marginLeft: 4 }} /></div>}
            <div ref={endRef} />
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Describe your injury or condition…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            />
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '.78rem' }} onClick={send} disabled={loading}>
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  )
}
