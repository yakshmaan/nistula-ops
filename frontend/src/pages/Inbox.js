import React, { useState, useEffect } from 'react';
import { getInbox, sendMessage, sendInbound, getConversation } from '../services/api';

const CHANNELS = ['airbnb', 'booking.com', 'whatsapp', 'instagram', 'makemytrip', 'expedia', 'agoda'];

function getChannelClass(channel) {
  const map = { 'airbnb': 'ch-airbnb', 'booking.com': 'ch-booking', 'whatsapp': 'ch-whatsapp', 'instagram': 'ch-instagram', 'makemytrip': 'ch-makemytrip', 'expedia': 'ch-expedia', 'agoda': 'ch-agoda' };
  return map[channel] || 'ch-direct';
}

function getConfidenceColor(score) {
  if (score >= 0.8) return '#4a9b6f';
  if (score >= 0.6) return '#c9a84c';
  return '#c45c5c';
}

export default function Inbox({ navigate }) {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [editedReply, setEditedReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSimulate, setShowSimulate] = useState(false);
  const [simForm, setSimForm] = useState({ guest_name: '', channel: 'whatsapp', content: '', email: '' });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadInbox = async () => {
    try {
      const res = await getInbox();
      setMessages(res.data);
    } catch (e) {}
    setLoading(false);
  };

  const selectMessage = async (msg) => {
    setSelected(msg);
    setEditedReply(msg.ai_draft || '');
    try {
      const res = await getConversation(msg.guest_id);
      setConversation(res.data);
    } catch (e) {}
  };

  const handleSend = async (edited) => {
    if (!selected) return;
    setSending(true);
    try {
      await sendMessage({ message_id: selected.id, final_content: editedReply, agent_edited: edited });
      setMessages(prev => prev.filter(m => m.id !== selected.id));
      setSelected(null);
      setConversation(null);
    } catch (e) {}
    setSending(false);
  };

  const handleSimulate = async () => {
    try {
      await sendInbound(simForm);
      setShowSimulate(false);
      setSimForm({ guest_name: '', channel: 'whatsapp', content: '', email: '' });
      loadInbox();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const filtered = filter === 'all' ? messages : filter === 'review' ? messages.filter(m => m.needs_human_review) : messages.filter(m => m.intent === filter);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 340, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="page-header" style={{ padding: '20px 20px 16px' }}>
          <div>
            <div className="page-title" style={{ fontSize: 22 }}>Inbox</div>
            <div className="page-subtitle">{messages.length} pending</div>
          </div>
          <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setShowSimulate(true)}>+ Simulate</button>
        </div>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'review', 'enquiry', 'complaint', 'cancellation'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '3px 10px', borderRadius: 4, border: '1px solid', fontSize: 11,
              fontFamily: 'DM Mono', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
              background: filter === f ? 'var(--gold-glow)' : 'transparent',
              borderColor: filter === f ? 'var(--gold-dim)' : 'var(--border)',
              color: filter === f ? 'var(--gold)' : 'var(--text-muted)'
            }}>{f}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <div className="loading">LOADING...</div> :
           filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">◈</div><div className="empty-state-text">No messages</div></div>
          ) : filtered.map(msg => (
            <div key={msg.id} onClick={() => selectMessage(msg)} style={{
              padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
              background: selected?.id === msg.id ? 'var(--bg-3)' : 'transparent',
              borderLeft: msg.needs_human_review ? '3px solid var(--negative)' : '3px solid transparent',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{msg.guest_name}</span>
                <span className={`channel-tag ${getChannelClass(msg.channel)}`}>{msg.channel}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.content}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {msg.intent && <span className={`badge badge-${msg.sentiment === 'positive' ? 'positive' : msg.sentiment === 'negative' ? 'negative' : 'neutral'}`}>{msg.intent}</span>}
                  {msg.needs_human_review && <span className="badge badge-warning">Review</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 40 }}>
                    <div className="confidence-bar">
                      <div className="confidence-fill" style={{ width: `${(msg.confidence_score || 0) * 100}%`, background: getConfidenceColor(msg.confidence_score || 0) }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>{Math.round((msg.confidence_score || 0) * 100)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div className="empty-state" style={{ height: '100%' }}>
            <div className="empty-state-icon">◈</div>
            <div className="empty-state-text">Select a message</div>
          </div>
        ) : (
          <>
            <div className="page-header" style={{ padding: '16px 24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'Cormorant Garamond', fontSize: 20 }}>{selected.guest_name}</span>
                  <span className={`channel-tag ${getChannelClass(selected.channel)}`}>{selected.channel}</span>
                  {selected.needs_human_review && <span className="badge badge-warning">Needs Review</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono', marginTop: 3 }}>
                  AI Confidence: {Math.round((selected.confidence_score || 0) * 100)}% · Intent: {selected.intent || 'unknown'} · Sentiment: {selected.sentiment || 'unknown'}
                </div>
              </div>
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate('guest-profile', selected.guest_id)}>View Profile →</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {conversation?.messages?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Conversation History</div>
                  {conversation.messages.map((m, i) => (
                    <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: m.direction === 'outbound' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%', padding: '10px 14px', borderRadius: 8,
                        background: m.direction === 'outbound' ? 'var(--gold-glow)' : 'var(--bg-3)',
                        border: `1px solid ${m.direction === 'outbound' ? 'var(--gold-dim)' : 'var(--border)'}`,
                        fontSize: 13
                      }}>
                        {m.content}
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'DM Mono' }}>
                          {m.direction === 'outbound' ? 'Nistula' : 'Guest'} · {new Date(m.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 8 }}>GUEST MESSAGE</div>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>{selected.content}</div>
              </div>
              {conversation?.analysis && Object.keys(conversation.analysis).length > 0 && (
                <div style={{ background: 'var(--gold-glow)', border: '1px solid var(--gold-dim)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--gold)', marginBottom: 10 }}>◎ CONVERSATION INTELLIGENCE</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Conversion likelihood: </span><span>{Math.round((conversation.analysis.conversion_likelihood || 0) * 100)}%</span></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Drop-off risk: </span><span style={{ color: conversation.analysis.drop_off_risk === 'high' ? 'var(--negative)' : 'var(--text)' }}>{conversation.analysis.drop_off_risk}</span></div>
                    <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--text-muted)' }}>Recommended action: </span><span>{conversation.analysis.recommended_action}</span></div>
                  </div>
                </div>
              )}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Draft Reply</div>
                  <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: getConfidenceColor(selected.confidence_score || 0) }}>{Math.round((selected.confidence_score || 0) * 100)}% confident</span>
                </div>
                <textarea rows={6} value={editedReply} onChange={e => setEditedReply(e.target.value)} placeholder="AI draft will appear here..." />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--bg-2)' }}>
              <button className="btn btn-ghost" onClick={() => { setSelected(null); setConversation(null); }}>Dismiss</button>
              <button className="btn btn-ghost" onClick={() => handleSend(true)} disabled={sending}>Send Edited</button>
              <button className="btn btn-primary" onClick={() => handleSend(false)} disabled={sending}>{sending ? 'Sending...' : 'Send AI Reply ◈'}</button>
            </div>
          </>
        )}
      </div>

      {showSimulate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 28, width: 480 }}>
            <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 22, marginBottom: 20 }}>Simulate Inbound Message</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Guest name" value={simForm.guest_name} onChange={e => setSimForm(p => ({ ...p, guest_name: e.target.value }))} />
              <input placeholder="Email (optional)" value={simForm.email} onChange={e => setSimForm(p => ({ ...p, email: e.target.value }))} />
              <select value={simForm.channel} onChange={e => setSimForm(p => ({ ...p, channel: e.target.value }))}
                style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 14px', borderRadius: 6, fontSize: 13 }}>
                {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea rows={4} placeholder="Message from guest..." value={simForm.content} onChange={e => setSimForm(p => ({ ...p, content: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setShowSimulate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSimulate}>Send to AI ◈</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
