import React, { useState, useEffect } from 'react';
import { getGuest } from '../services/api';

export default function GuestProfile({ guestId, navigate }) {
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guestId) {
      getGuest(guestId).then(res => { setGuest(res.data); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [guestId]);

  if (loading) return <div className="loading">LOADING PROFILE...</div>;
  if (!guest) return <div className="empty-state"><div className="empty-state-text">Guest not found</div></div>;

  const sentimentColor = guest.sentiment_score >= 0.7 ? '#4a9b6f' : guest.sentiment_score >= 0.4 ? '#c9a84c' : '#c45c5c';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate('guests')}>← Back</button>
          <div>
            <div className="page-title">{guest.name}</div>
            <div className="page-subtitle">{guest.email || 'No email'} · {guest.channel}</div>
          </div>
        </div>
        {guest.is_repeat && <span className="badge badge-gold">Repeat Guest</span>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Stays', value: guest.total_stays },
            { label: 'Total Spent', value: `₹${guest.total_spent.toLocaleString()}`, highlight: true },
            { label: 'Messages', value: guest.messages.length },
            { label: 'Sentiment', value: `${Math.round(guest.sentiment_score * 100)}%`, color: sentimentColor },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.highlight ? 'highlight' : ''}`}>
              <div className="stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Conversation History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
              {guest.messages.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No messages yet</div> :
                guest.messages.map(m => (
                  <div key={m.id} style={{
                    padding: '10px 12px', borderRadius: 6,
                    background: m.direction === 'outbound' ? 'var(--gold-glow)' : 'var(--bg-3)',
                    border: `1px solid ${m.direction === 'outbound' ? 'var(--gold-dim)' : 'var(--border)'}`,
                    fontSize: 13
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {m.direction === 'outbound' ? 'Nistula' : 'Guest'}
                      </span>
                      {m.sentiment && <span className={`badge badge-${m.sentiment === 'positive' ? 'positive' : m.sentiment === 'negative' ? 'negative' : 'neutral'}`}>{m.sentiment}</span>}
                    </div>
                    <div style={{ lineHeight: 1.5 }}>{m.content}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'DM Mono' }}>{new Date(m.created_at).toLocaleString()}</div>
                  </div>
                ))
              }
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Guest Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Phone', value: guest.phone || '—' },
                  { label: 'Email', value: guest.email || '—' },
                  { label: 'Source Channel', value: guest.channel },
                  { label: 'Notes', value: guest.notes || '—' },
                ].map(d => (
                  <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{d.label}</span>
                    <span>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bookings</div>
              {guest.bookings.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No bookings yet</div> :
                guest.bookings.map(b => (
                  <div key={b.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{new Date(b.check_in).toLocaleDateString()} → {new Date(b.check_out).toLocaleDateString()}</span>
                      <span className={`badge badge-${b.status === 'confirmed' ? 'positive' : b.status === 'cancelled' ? 'negative' : 'neutral'}`}>{b.status}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>₹{b.amount.toLocaleString()}</div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
