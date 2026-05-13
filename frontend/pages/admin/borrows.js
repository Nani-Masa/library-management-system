import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function AdminBorrows() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loans, setLoans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin'))
      router.push('/dashboard');
  }, [user, authLoading]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    api.get('/borrow/active')
      .then(r => setLoans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const now = new Date();

  const filtered = loans.filter(loan => {
    const matchSearch =
      loan.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      loan.title?.toLowerCase().includes(search.toLowerCase()) ||
      loan.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      loan.author?.toLowerCase().includes(search.toLowerCase());
    const daysLeft = Math.ceil((new Date(loan.due_date) - now) / 86400000);
    const matchFilter =
      filterStatus === 'all'      ? true :
      filterStatus === 'overdue'  ? daysLeft < 0 :
      filterStatus === 'due_soon' ? daysLeft >= 0 && daysLeft <= 3 :
      filterStatus === 'on_time'  ? daysLeft > 3 : true;
    return matchSearch && matchFilter;
  });

  const overdue = loans.filter(l => Math.ceil((new Date(l.due_date) - now) / 86400000) < 0);
  const dueSoon = loans.filter(l => { const d = Math.ceil((new Date(l.due_date) - now) / 86400000); return d >= 0 && d <= 3; });
  const onTime  = loans.filter(l => Math.ceil((new Date(l.due_date) - now) / 86400000) > 3);

  if (authLoading || !user) return null;

  return (
    <>
      <Head><title>Active Loans — LibraryOS Admin</title></Head>
      <Layout>
        <div className="page-enter">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 4 }}>Admin / Active Loans</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}>Active Loans</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
              View all books currently borrowed by students
            </p>
          </div>

          {/* Info banner */}
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>ℹ️</span>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              This is a <strong style={{ color: 'var(--text)' }}>read-only view</strong> of all active loans.
              Borrow and return requests are handled by the <strong style={{ color: '#fbbf24' }}>Librarian</strong>.
              You can impose fines on overdue books from the{' '}
              <span onClick={() => router.push('/admin/fines')} style={{ color: '#818cf8', cursor: 'pointer', textDecoration: 'underline' }}>Fine Management</span> page.
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Total Active',  value: loans.length,   color: '#818cf8', icon: '📋', filter: 'all' },
              { label: 'Overdue',       value: overdue.length, color: '#fb7185', icon: '⚠️', filter: 'overdue' },
              { label: 'Due in 3 Days', value: dueSoon.length, color: '#fbbf24', icon: '⏰', filter: 'due_soon' },
              { label: 'On Time',       value: onTime.length,  color: '#34d399', icon: '✅', filter: 'on_time' },
            ].map(s => (
              <div key={s.label}
                onClick={() => setFilter(s.filter)}
                style={{
                  background: filterStatus === s.filter ? `rgba(99,102,241,0.08)` : 'var(--surface)',
                  border: `1px solid ${filterStatus === s.filter ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                  borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 14px', marginBottom: 12 }}>
            <span style={{ color: 'var(--subtle)' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name, student ID, book title or author..."
              style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 13, flex: 1, outline: 'none' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>✕</button>}
            <span style={{ fontSize: 11, color: 'var(--subtle)', paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { key: 'all',      label: 'All loans' },
              { key: 'overdue',  label: '⚠️ Overdue' },
              { key: 'due_soon', label: '⏰ Due soon' },
              { key: 'on_time',  label: '✅ On time' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '5px 14px', borderRadius: 100, fontSize: 11, fontWeight: 500,
                cursor: 'pointer', border: 'none',
                background: filterStatus === f.key ? '#6366f1' : 'var(--surface2)',
                color: filterStatus === f.key ? 'white' : 'var(--muted)',
                transition: 'all 0.15s',
              }}>{f.label}</button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8, marginBottom: 8 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                {search ? `No results for "${search}"` : 'No active loans'}
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {search ? 'Try a different search term' : 'All books have been returned'}
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                    {['Student', 'Book', 'Issued', 'Due Date', 'Status', 'Fine (if overdue)'].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '12px 16px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((loan, i) => {
                    const daysLeft = Math.ceil((new Date(loan.due_date) - now) / 86400000);
                    const isOverdue = daysLeft < 0;
                    const isDueSoon = !isOverdue && daysLeft <= 3;
                    const calcFine  = isOverdue ? Math.abs(daysLeft) * 2.00 : 0;

                    return (
                      <tr key={loan.id}
                        onClick={() => setSelected(selected === loan.id ? null : loan.id)}
                        style={{
                          borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                          background: selected === loan.id ? 'rgba(99,102,241,0.04)' : 'transparent',
                          cursor: 'pointer', transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { if (selected !== loan.id) e.currentTarget.style.background = 'var(--surface2)'; }}
                        onMouseLeave={e => { if (selected !== loan.id) e.currentTarget.style.background = 'transparent'; }}>

                        {/* Student */}
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                              {loan.user_name?.slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{loan.user_name}</div>
                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{loan.student_id ? `ID: ${loan.student_id}` : 'No ID'}</div>
                            </div>
                          </div>
                        </td>

                        {/* Book */}
                        <td style={{ padding: '13px 16px', maxWidth: 180 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loan.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{loan.author}</div>
                        </td>

                        {/* Issued */}
                        <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--muted)' }}>
                          {new Date(loan.issued_at).toLocaleDateString()}
                          <div style={{ fontSize: 10, color: 'var(--subtle)' }}>
                            {Math.floor((now - new Date(loan.issued_at)) / 86400000)}d ago
                          </div>
                        </td>

                        {/* Due date */}
                        <td style={{ padding: '13px 16px', fontSize: 12, fontWeight: 600, color: isOverdue ? '#fb7185' : isDueSoon ? '#fbbf24' : 'var(--text)' }}>
                          {new Date(loan.due_date).toLocaleDateString()}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{
                            fontSize: 11, padding: '3px 10px', borderRadius: 100, fontWeight: 600,
                            background: isOverdue ? 'rgba(251,113,133,0.15)' : isDueSoon ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
                            color: isOverdue ? '#fb7185' : isDueSoon ? '#fbbf24' : '#34d399',
                          }}>
                            {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                          </span>
                        </td>

                        {/* Fine */}
                        <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: calcFine > 0 ? '#fb7185' : 'var(--subtle)' }}>
                          {calcFine > 0 ? (
                            <div>
                              <div>₹{calcFine.toFixed(2)}</div>
                              <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)' }}>
                                {Math.abs(daysLeft)} days × ₹2
                              </div>
                            </div>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Expanded detail row */}
              {selected && (() => {
                const loan = loans.find(l => l.id === selected);
                if (!loan) return null;
                const daysLeft = Math.ceil((new Date(loan.due_date) - now) / 86400000);
                const isOverdue = daysLeft < 0;
                return (
                  <div style={{ borderTop: '1px solid var(--border)', background: 'rgba(99,102,241,0.04)', padding: '16px 20px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                      📋 Full Loan Details — {loan.user_name}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: isOverdue ? 12 : 0 }}>
                      {[
                        ['Student Name',  loan.user_name],
                        ['Student ID',    loan.student_id || 'N/A'],
                        ['Book Title',    loan.title],
                        ['Author',        loan.author],
                        ['Issued Date',   new Date(loan.issued_at).toLocaleDateString()],
                        ['Due Date',      new Date(loan.due_date).toLocaleDateString()],
                        ['Days Borrowed', `${Math.floor((now - new Date(loan.issued_at)) / 86400000)} days`],
                        ['Status',        isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days remaining`],
                      ].map(([label, value]) => (
                        <div key={label} style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 10, color: 'var(--subtle)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    {isOverdue && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => router.push('/admin/fines')} style={{ padding: '8px 18px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          💰 Go to Fine Management
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--muted)' }}>
            💡 Click any row to see full loan details · Overdue fines: ₹2 per day
          </div>
        </div>
      </Layout>
    </>
  );
}
