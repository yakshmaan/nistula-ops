import React, { useState, useEffect } from 'react';
import { getDashboard } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#c9a84c', '#4a9b6f', '#c45c5c', '#4a9be8', '#c13584', '#ff6600'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 6, fontSize: 12, fontFamily: 'DM Mono' }}>
        <div style={{ color: 'var(--text)' }}>{payload[0].name}: {payload[0].value}</div>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">LOADING INTELLIGENCE...</div>;
  if (!data) return <div className="empty-state"><div className="empty-state-text">No data yet</div></div>;

  const { overview, channels, intents, sentiments } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Intelligence Dashboard</div>
          <div className="page-subtitle">Conversation signals · Guest intelligence · AI performance</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px' }}>
        <div className="stat-grid" style={{ padding: '24px 0' }}>
          {[
            { label: 'Total Guests', value: overview.total_guests, type: '' },
            { label: 'Total Messages', value: overview.total_messages, type: '' },
            { label: 'Pending Replies', value: overview.pending_replies, type: 'highlight' },
            { label: 'Needs Human Review', value: overview.needs_human_review, type: 'alert' },
            { label: 'Avg AI Confidence', value: `${Math.round(overview.avg_ai_confidence * 100)}%`, type: 'highlight' },
            { label: 'Agent Edit Rate', value: `${overview.agent_edit_rate}%`, type: '' },
            { label: 'Total Complaints', value: overview.total_complaints, type: overview.total_complaints > 0 ? 'alert' : '' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.type}`}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <div className="card">
            <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Messages by Channel</div>
            {channels.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet</div> : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={channels.map(c => ({ name: c.channel, value: c.count }))} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                      {channels.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {channels.map((c, i) => (
                    <div key={c.channel} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                        <span style={{ textTransform: 'capitalize' }}>{c.channel}</span>
                      </div>
                      <span style={{ fontFamily: 'DM Mono' }}>{c.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="card">
            <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Intent Distribution</div>
            {intents.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={intents.map(i => ({ name: i.intent, value: i.count }))} layout="vertical">
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'DM Mono' }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-dim)', fontSize: 11 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="var(--gold)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="card">
            <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Guest Sentiment</div>
            {sentiments.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet</div> : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={sentiments.map(s => ({ name: s.sentiment, value: s.count }))} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                      {sentiments.map((s) => (
                        <Cell key={s.sentiment} fill={s.sentiment === 'positive' ? '#4a9b6f' : s.sentiment === 'negative' ? '#c45c5c' : '#7a7a7a'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {sentiments.map(s => {
                    const total = sentiments.reduce((a, b) => a + b.count, 0);
                    const color = s.sentiment === 'positive' ? '#4a9b6f' : s.sentiment === 'negative' ? '#c45c5c' : '#7a7a7a';
                    return (
                      <div key={s.sentiment}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                          <span style={{ textTransform: 'capitalize' }}>{s.sentiment}</span>
                          <span style={{ fontFamily: 'DM Mono', color }}>{Math.round(s.count / total * 100)}%</span>
                        </div>
                        <div style={{ height: 3, background: 'var(--bg-4)', borderRadius: 2 }}>
                          <div style={{ width: `${s.count / total * 100}%`, height: '100%', background: color, borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
