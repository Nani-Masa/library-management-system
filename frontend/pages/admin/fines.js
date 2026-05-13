import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import toast from 'react-hot-toast';

function ImposeModal({ txn, onConfirm, onCancel }) {
  const [amount, setAmount]   = useState(txn.calculated_fine || '');
  const [note, setNote]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid fine amount');
      return;
    }
    setLoading(true);
    await onConfirm(txn.id, parseFloat(amount), note);
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', background: 'var(--input-bg)',
    border: '1px solid var(--border2)',
    borderRadius: 8, padding: '9px 12px',
    fontSize: 13, color: 'var(--text)',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 20, padding: 24, width: '100%', maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>💰</div>
        <div style={{ fontSize: 15, fontWeight: 700, textAlign: 'center', marginBottom: 4, color: 'var(--text)' }}>Impose Fine</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginBottom: 20 }}>
          Student: <strong style={{ color: 'var(--text)' }}>{txn.user_name}</strong>
          {' · '} Book: <strong style={{ color: 'var(--text)' }}>{txn.book_title?.slice(0, 30)}</strong>
        </div>

        {/* Overdue info */}
        <div style={{ background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--muted)' }}>Due date</span>
            <span style={{ color: '#fb7185', fontWeight: 600 }}>{new Date(txn.due_date).toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--muted)' }}>Overdue days</span>
            <span style={{ color: '#fb7185', fontWeight: 600 }}>{txn.overdue_days} days</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--muted)' }}>Suggested fine (₹2/day)</span>
            <span style={{ color: '#fb7185', fontWeight: 700 }}>${parseFloat(txn.calculated_fine || 0).toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
              Fine amount ($) <span style={{ color: '#fb7185' }}>*</span>
            </label>
            <input
              type="number" step="0.01" min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 5.00"
              required style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
              Reason / Note (optional)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Book returned late by 10 days"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onCancel} style={{
              flex: 1, padding: '10px', background: 'var(--surface2)',
              border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--muted)', fontSize: 13, cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '10px',
              background: loading ? '#b91c1c' : '#dc2626',
              border: 'none', borderRadius: 8,
              color: 'white', fontSize: 13,
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Imposing…' : '💰 Impose Fine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminFines() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [overdue, setOverdue]   = useState([]);
  const [allFines, setAllFines] = useState([]);
  const [tab, setTab]           = useState('overdue');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/dashboard');
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [o, f] = await Promise.all([
        api.get('/fines/overdue'),
        api.get('/fines'),
      ]);
      setOverdue(o.data);
      setAllFines(f.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.role === 'admin') loadData(); }, [user]);

  const handleImpose = async (txnId, amount, note) => {
    try {
      await api.post(`/fines/impose/${txnId}`, { fine_amount: amount, fine_note: note });
      toast.success(`💰 Fine of ₹${amount.toFixed(2)} imposed successfully!`);
      setModal(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to impose fine');
    }
  };

  const handlePaid = async (txnId) => {
    try {
      await api.put(`/fines/pay/${txnId}`);
      toast.success('✅ Fine marked as paid!');
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleWaive = async (txnId) => {
    if (!confirm('Waive this fine? This cannot be undone.')) return;
    try {
      await api.put(`/fines/waive/${txnId}`);
      toast.success('Fine waived successfully');
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const totalPending = allFines.filter(f => !f.fine_paid).reduce((s, f) => s + parseFloat(f.fine_amount || 0), 0);
  const totalCollected = allFines.filter(f => f.fine_paid).reduce((s, f) => s + parseFloat(f.fine_amount || 0), 0);

  if (authLoading || !user) return null;

  return (
    <>
      <Head><title>Fine Management — LibraryOS Admin</title></Head>
      <Layout>
        <div className="page-enter">
          {modal && (
            <ImposeModal
              txn={modal}
              onConfirm={handleImpose}
              onCancel={() => setModal(null)}
            />
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 4 }}>Admin / Fine Management</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}>Fine Management</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Impose, track, and manage student fines</p>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Overdue Books',    value: overdue.length,                  color: '#fb7185', icon: '⚠️' },
              { label: 'Active Fines',     value: allFines.filter(f => !f.fine_paid).length, color: '#fbbf24', icon: '💰' },
              { label: 'Pending Amount',   value: `₹${totalPending.toFixed(2)}`,   color: '#fb7185', icon: '💸' },
              { label: 'Collected',        value: `₹${totalCollected.toFixed(2)}`, color: '#34d399', icon: '✅' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface)', padding: 4, borderRadius: 12, width: 'fit-content', border: '1px solid var(--border)' }}>
            {[
              { key: 'overdue', label: `⚠️ Overdue Books (${overdue.length})` },
              { key: 'fines',   label: `💰 All Fines (${allFines.length})` },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '7px 16px', borderRadius: 8, border: 'none',
                background: tab === t.key ? '#6366f1' : 'transparent',
                color: tab === t.key ? 'white' : 'var(--muted)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s',
              }}>{t.label}</button>
            ))}
          </div>

          {/* Overdue Books Tab */}
          {tab === 'overdue' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: 20 }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8, marginBottom: 8 }} />)}
                </div>
              ) : overdue.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>No overdue books</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>All books have been returned on time</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Student', 'Book', 'Due Date', 'Overdue', 'Suggested Fine', 'Action'].map(h => (
                        <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 16px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overdue.map((txn, i) => (
                      <tr key={txn.id} style={{ borderBottom: i < overdue.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{txn.user_name}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{txn.student_id || txn.user_email}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)', maxWidth: 160 }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{txn.book_title}</div>
                          <div style={{ fontSize: 10, color: 'var(--subtle)' }}>{txn.book_author}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#fb7185', fontWeight: 600 }}>
                          {new Date(txn.due_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, fontWeight: 600, background: 'rgba(251,113,133,0.15)', color: '#fb7185' }}>
                            {txn.overdue_days} days
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
                          ${parseFloat(txn.calculated_fine || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {txn.fine_imposed ? (
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                              Fine imposed
                            </span>
                          ) : (
                            <button onClick={() => setModal(txn)} style={{
                              padding: '6px 14px', background: 'rgba(220,38,38,0.12)',
                              border: '1px solid rgba(220,38,38,0.3)',
                              borderRadius: 7, color: '#f87171',
                              fontSize: 11, fontWeight: 600, cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.2)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,0.12)'}>
                              💰 Impose Fine
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* All Fines Tab */}
          {tab === 'fines' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: 20 }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8, marginBottom: 8 }} />)}
                </div>
              ) : allFines.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>No fines recorded yet</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Student', 'Book', 'Fine Amount', 'Imposed By', 'Note', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 16px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allFines.map((f, i) => (
                      <tr key={f.id} style={{ borderBottom: i < allFines.length - 1 ? '1px solid var(--border)' : 'none', opacity: f.fine_paid ? 0.6 : 1 }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{f.user_name}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{f.student_id || f.user_email}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)', maxWidth: 140 }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.book_title}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: f.fine_paid ? '#34d399' : '#fb7185' }}>
                          ${parseFloat(f.fine_amount).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--muted)' }}>
                          {f.imposed_by_name || 'System'}
                          {f.fine_imposed_at && <div style={{ fontSize: 10, color: 'var(--subtle)' }}>{new Date(f.fine_imposed_at).toLocaleDateString()}</div>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--muted)', maxWidth: 140 }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.fine_note || '—'}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: 10, padding: '3px 10px', borderRadius: 100, fontWeight: 600,
                            background: f.fine_paid ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.15)',
                            color: f.fine_paid ? '#34d399' : '#fb7185',
                          }}>
                            {f.fine_paid ? '✅ Paid' : '⏳ Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {!f.fine_paid && (
                            <div style={{ display: 'flex', gap: 5 }}>
                              <button onClick={() => handlePaid(f.id)} style={{
                                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399',
                              }}>Paid</button>
                              <button onClick={() => handleWaive(f.id)} style={{
                                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                background: 'rgba(148,163,184,0.1)', border: '1px solid var(--border)', color: 'var(--muted)',
                              }}>Waive</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
