import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const FEATURES = [
  { icon: '🤖', title: 'AI Recommendations',  desc: 'Personalized picks based on your reading history and genre preferences.' },
  { icon: '📊', title: 'Live Analytics',        desc: 'Real-time dashboards with borrowing trends, peak hours, and top titles.' },
  { icon: '🗺️', title: 'Interactive Map',       desc: 'Visual shelf locator — navigate to any book\'s physical location.' },
  { icon: '⭐', title: 'Save & Wishlist',       desc: 'Save books you want to read later and borrow them instantly from your list.' },
  { icon: '🏫', title: 'Room Booking',          desc: 'Calendar-based study room reservations with conflict detection.' },
  { icon: '🔔', title: 'Smart Alerts',          desc: 'Automated reminders for due dates, reservations, and availability.' },
];

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const dark = mounted ? theme === 'dark' : true;

  return (
    <>
      <Head>
        <title>LibraryOS — Smart AI Library Management</title>
        <meta name="description" content="AI-powered library management system for modern universities" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        transition: 'background 0.3s, color 0.3s',
      }}>

        {/* ── Nav ─────────────────────────────────── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: dark ? 'rgba(15,23,42,0.88)' : 'rgba(248,250,252,0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 32px',
          transition: 'background 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📚</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>LibraryOS</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={toggleTheme}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                width: 36, height: 36, borderRadius: 8, fontSize: 16,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
              {mounted ? (dark ? '☀️' : '🌙') : '☀️'}
            </button>
            <Link href="/login">
              <button style={{
                padding: '8px 16px', background: 'transparent',
                border: '1px solid var(--border2)',
                borderRadius: 8, color: 'var(--muted)',
                fontSize: 13, cursor: 'pointer',
              }}>Sign in</button>
            </Link>
            <Link href="/register">
              <button style={{
                padding: '8px 16px', background: '#6366f1',
                border: 'none', borderRadius: 8,
                color: 'white', fontSize: 13,
                fontWeight: 600, cursor: 'pointer',
              }}>Get started free</button>
            </Link>
          </div>
        </nav>

        {/* ── Hero ─────────────────────────────────── */}
        <section style={{ padding: '140px 32px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: -60, left: '50%',
            transform: 'translateX(-50%)',
            width: 500, height: 250,
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px 4px 10px', borderRadius: 100,
            border: '1px solid rgba(99,102,241,0.35)',
            background: 'rgba(99,102,241,0.08)',
            fontSize: 11, color: '#818cf8', marginBottom: 28,
            position: 'relative',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
            Now with AI book recommendations
          </div>

          {/* Hero title */}
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 700, letterSpacing: '-2px',
            lineHeight: 1.15, maxWidth: 720,
            margin: '0 auto 20px',
          }}>
            <span style={{ color: 'var(--text)' }}>The intelligent library</span>
            <br />
            <span style={{ color: '#6366f1' }}>for modern universities.</span>
          </h1>

          <p style={{
            fontSize: 15, color: 'var(--muted)',
            maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.8,
          }}>
            AI-powered book discovery, smart reservations, community reviews,
            and real-time analytics — all in one elegant platform.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 60 }}>
            <Link href="/register">
              <button style={{
                padding: '12px 28px', background: '#6366f1',
                border: 'none', borderRadius: 10,
                color: 'white', fontSize: 14,
                fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                🚀 Get started free
              </button>
            </Link>
            <Link href="/login">
              <button style={{
                padding: '12px 28px',
                background: 'var(--surface)',
                border: '1px solid var(--border2)',
                borderRadius: 10, color: 'var(--text)',
                fontSize: 14, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
                Sign in →
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            gap: 48, flexWrap: 'wrap',
            paddingTop: 32,
            borderTop: '1px solid var(--border)',
            maxWidth: 520, margin: '0 auto',
          }}>
            {[
              ['12,400+', 'Books catalogued'],
              ['3,200',   'Active students'],
              ['98%',     'Satisfaction rate'],
            ].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}>{n}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ─────────────────────────────── */}
        <section style={{ padding: '0 32px 80px', maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center', fontSize: 28,
            fontWeight: 700, letterSpacing: '-0.5px',
            marginBottom: 8, color: 'var(--text)',
          }}>
            Everything a modern library needs
          </h2>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>
            Powerful features designed for students, librarians, and administrators
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16, padding: 20,
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'rgba(99,102,241,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, marginBottom: 12,
                }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Highlights banner ────────────────────── */}
        <section style={{
          margin: '0 32px 80px', maxWidth: 1100,
          marginLeft: 'auto', marginRight: 'auto',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20, padding: '32px 40px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 24 }}>
            {[
              { icon: '💬', title: 'AI Chatbot',        desc: 'Ask anything in plain English' },
              { icon: '📖', title: 'Reading Tracker',   desc: 'Set goals and track progress' },
              { icon: '🎁', title: 'Book Marketplace',  desc: 'Donate and exchange books' },
              { icon: '🌙', title: 'Dark / Light Mode', desc: 'Comfortable for any environment' },
              { icon: '📱', title: 'Mobile Friendly',   desc: 'Works on any screen size' },
            ].map(h => (
              <div key={h.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(99,102,241,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{h.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{h.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{h.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ───────────────────────────────── */}
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '24px 32px',
          textAlign: 'center',
          color: 'var(--subtle)', fontSize: 12,
        }}>
          LibraryOS © 2024 — Built for university excellence
        </footer>
      </div>
    </>
  );
}
