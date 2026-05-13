import React, { useState, useEffect } from 'react';
import { getGuests } from '../services/api';

function SentimentBar({ score }) {
  const color = score >= 0.7 ? '#4a9b6f' : score >= 0.4 ? '#c9a84c' : '#c45c5c';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 60, height: 3, background: 'var(--bg-4)', borderRadius: 2 }}>
        <div style={{ width: `${score * 100}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'DM Mono', color }}>{Math.round(score * 100)}</span>
    </div>
  );
}

function getChannelClass(channel) {
  const map = { 'airbnb': 'ch-airbnb', 'booking.com': 'ch-booking', 'whatsapp': 'ch-whatsapp', 'instagram': 'ch-instagram', 'makemytrip': 'ch-makemytrip', 'expedia': 'ch-expedia', 'agoda': 'ch-agoda' };
  return map[channel] || 'ch-direct';
}

export default function Guests({ navigate }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    getGuests().then(res => { setGuests(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = guests
    .filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || (g.email || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'sentiment') return b.sentiment_score - a.sentiment_score;
      if (sortBy === 'stays') return b.total_stays - a.total_stays;
      if (sortBy === 'spent') return b.total_spent - a.total_spent;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Guest CRM</div>
          <div className="page-subtitle">{guests.length} guests tracked</div>
        </div>
      </div>
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
        <input placeholder="Search guests..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 12px', borderRadius: 6, fontSize: 13 }}>
          <option value="created_at">Newest</option>
          <option value="sentiment">By Sentiment</option>
          <option value="stays">By Stays</option>
          <option value="spent">By Spent</option>
        </select>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px' }}>
        {loading ? <div className="loading">LOADING GUESTS...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Guest', 'Channel', 'Stays', 'Spent', 'Sentiment', 'Messages', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '14px 12px', textAlign: 'left', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => navigate('guest-profile', g.id)}>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ fontWeight: 500 }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>{g.email || '—'}</div>
                  </td>
                  <td style={{ padding: '14px 12px' }}><span className={`channel-tag ${getChannelClass(g.channel)}`}>{g.channel}</span></td>
                  <td style={{ padding: '14px 12px', fontFamily: 'DM Mono', fontSize: 13 }}>{g.total_stays}</td>
                  <td style={{ padding: '14px 12px', fontFamily: 'DM Mono', fontSize: 13 }}>₹{g.total_spent.toLocaleString()}</td>
                  <td style={{ padding: '14px 12px' }}><SentimentBar score={g.sentiment_score} /></td>
                  <td style={{ padding: '14px 12px', fontFamily: 'DM Mono', fontSize: 13 }}>{g.message_count}</td>
                  <td style={{ padding: '14px 12px' }}>
                    {g.is_repeat ? <span className="badge badge-gold">Repeat</span> : <span className="badge badge-neutral">New</span>}
                  </td>
                  <td style={{ padding: '14px 12px', color: 'var(--text-muted)', fontSize: 16 }}>→</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
