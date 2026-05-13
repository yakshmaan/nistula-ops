import React, { useState } from 'react';
import Inbox from './pages/Inbox';
import Guests from './pages/Guests';
import Analytics from './pages/Analytics';
import GuestProfile from './pages/GuestProfile';
import './App.css';

export default function App() {
  const [page, setPage] = useState('inbox');
  const [selectedGuest, setSelectedGuest] = useState(null);

  const navigate = (p, data = null) => {
    setPage(p);
    if (data) setSelectedGuest(data);
  };

  return (
    <div className="app">
      <Sidebar page={page} navigate={navigate} />
      <main className="main-content">
        {page === 'inbox' && <Inbox navigate={navigate} />}
        {page === 'guests' && <Guests navigate={navigate} />}
        {page === 'analytics' && <Analytics />}
        {page === 'guest-profile' && <GuestProfile guestId={selectedGuest} navigate={navigate} />}
      </main>
    </div>
  );
}

function Sidebar({ page, navigate }) {
  const nav = [
    { id: 'inbox', label: 'Unified Inbox', icon: '◈' },
    { id: 'guests', label: 'Guest CRM', icon: '◉' },
    { id: 'analytics', label: 'Intelligence', icon: '◎' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-symbol">निस्तुला</span>
        <span className="brand-sub">OPS</span>
      </div>
      <nav className="sidebar-nav">
        {nav.map(n => (
          <button
            key={n.id}
            className={`nav-item ${page === n.id ? 'active' : ''}`}
            onClick={() => navigate(n.id)}
          >
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{n.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="status-dot" />
        <span>AI Online</span>
      </div>
    </aside>
  );
}
