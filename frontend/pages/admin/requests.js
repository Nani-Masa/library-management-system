import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  PENDING:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  icon: '⏳' },
  APPROVED:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: '✅' },
  REJECTED:  { color: '#fb7185', bg: 'rgba(251,113,133,0.12)', icon: '❌' },
  CANCELLED: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  icon: '🚫' },
};

function ReviewModal({ request, onApprove, onReject, onClose }) {
  const [note, setNote]     = useState('');
  const [loading, setLoading] = useState(false);
  const [action, setAction]   = useState(null);

  const handle = async (type) => {
    setLoading(true); setAction(type);
    if (type === 'approve') await onApprove(request.id, note);
    else await onReject(request.id, note);
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
              Review {request.type === 'BORROW' ? '📥 Borrow' : '📤 Return'} Request
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>from <strong style={{ color: 'var(--text)' }}>{request.user_name}</strong></div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{request.book_title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{request.book_author}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              ['Student',    request.user_name],
              ['Student ID', request.student_id || 'N/A'],
              ['Shelf',      request.shelf_location || 'N/A'],
              ['Available',  request.available_copies + ' copies'],
              ['Requested',  new Date(request.created_at).toLocaleDateString()],
              ['Type',       request.type],
            ].map(([label, value]) => (
              <div key={label}>
                <span style={{ fontSize: 10, color: 'var(--subtle)' }}>{label}: </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{value}</span>
              </div>
            ))}
          </div>
          {request.note && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--surface)', borderRadius: 6, fontSize: 11, color: 'var(--muted)' }}>
              📝 Student note: {request.note}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Note to student (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder="e.g. Book is ready at the counter, please collect by tomorrow..."
            style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => handle('reject')} disabled={loading} style={{ flex: 1, padding: '10px', background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: 8, color: '#fb7185', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading && action === 'reject' ? 'Rejecting…' : '❌ Reject'}
          </button>
          <button onClick={() => handle('approve')} disabled={loading} style={{ flex: 1, padding: '10px', background: loading && action === 'approve' ? '#4338ca' : '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading && action === 'approve' ? 'Approving…' : '✅ Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LibrarianRequests() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('PENDING');
  const [typeFilter, setType]   = useState('ALL');
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && user && user.role === 'admin') router.push('/admin');
    if (!authLoading && user && user.role === 'student') router.push('/dashboard');
  }, [user, authLoading]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/requests');
      setRequests(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (user?.role === 'librarian') load(); }, [user]);

  const handleApprove = async (id, note) => {
    try {
      await api.put(`/requests/${id}/approve`, { admin_note: note });
      toast.success('✅ Request approved! Student has been notified.');
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Approval failed'); }
  };

  const handleReject = async (id, note) => {
    try {
      await api.put(`/requests/${id}/reject`, { admin_note: note || 'Request rejected by librarian' });
      toast.success('Request rejected. Student has been notified.');
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const pending  = requests.filter(r => r.status === 'PENDING');
  const pendingB = pending.filter(r => r.type === 'BORROW').length;
  const pendingR = pending.filter(r => r.type === 'RETURN').length;

  const filtered = requests.filter(r => {
    const matchStatus = filter === 'ALL' || r.status === filter;
    const matchType   = typeFilter === 'ALL' || r.type === typeFilter;
    const matchSearch = !search ||
      r.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.book_title?.toLowerCase().includes(search.toLowerCase()) ||
      r.student_id?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  if (authLoading || !user || user.role !== 'librarian') return null;

  return (
    <>
      <Head><title>Borrow Requests — LibraryOS Librarian</title></Head>
      <Layout>
        <div className="page-enter">
          {modal && <ReviewModal request={modal} onApprove={handleApprove} onReject={handleReject} onClose={() => setModal(null)} />}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 4 }}>Librarian / Borrow Requests</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}>Borrow Requests</h1>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Approve or reject student borrow and return requests</p>
              </div>
              {pending.length > 0 && (
                <div style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{pending.length}</div>
                  <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>PENDING</div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Pending Borrows', value: pendingB, color: '#818cf8', icon: '📥' },
              { label: 'Pending Returns', value: pendingR, color: '#fbbf24', icon: '📤' },
              { label: 'Approved Today',  value: requests.filter(r => r.status === 'APPROVED' && new Date(r.reviewed_at).toDateString() === new Date().toDateString()).length, color: '#34d399', icon: '✅' },
              { label: 'Total Requests',  value: requests.length, color: 'var(--muted)', icon: '📋' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
              {['PENDING','APPROVED','REJECTED','ALL'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 500, cursor: 'pointer', background: filter === f ? '#6366f1' : 'transparent', color: filter === f ? 'white' : 'var(--muted)', transition: 'all 0.15s' }}>
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
              {['ALL','BORROW','RETURN'].map(t => (
                <button key={t} onClick={() => setType(t)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 500, cursor: 'pointer', background: typeFilter === t ? '#8b5cf6' : 'transparent', color: typeFilter === t ? 'white' : 'var(--muted)', transition: 'all 0.15s' }}>
                  {t === 'ALL' ? 'All Types' : t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '7px 12px' }}>
              <span style={{ color: 'var(--subtle)', fontSize: 13 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student, ID, or book..." style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 12, flex: 1, outline: 'none' }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>✕</button>}
            </div>
          </div>

          {/* Request list */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                {filter === 'PENDING' ? 'No pending requests — all caught up! 🎉' : 'No requests found'}
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Students will appear here when they submit borrow or return requests</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(req => {
                const s = STATUS_STYLE[req.status] || STATUS_STYLE.PENDING;
                const isNew = req.status === 'PENDING' && (Date.now() - new Date(req.created_at)) < 3600000;
                return (
                  <div key={req.id} style={{ background: 'var(--surface)', border: req.status === 'PENDING' ? '1px solid rgba(251,191,36,0.25)' : '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {req.user_name?.slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{req.user_name}</span>
                              {req.student_id && <span style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>{req.student_id}</span>}
                              {isNew && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 100, background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 700 }}>NEW</span>}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                              wants to <strong style={{ color: req.type === 'BORROW' ? '#818cf8' : '#fbbf24' }}>{req.type === 'BORROW' ? 'borrow' : 'return'}</strong> — {req.book_title}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--subtle)', marginTop: 2 }}>
                              {req.book_author} · Shelf: {req.shelf_location || 'N/A'} · {req.available_copies} copies available · {new Date(req.created_at).toLocaleString()}
                            </div>
                          </div>
                          <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 100, fontWeight: 700, background: s.bg, color: s.color, flexShrink: 0 }}>
                            {s.icon} {req.status}
                          </span>
                        </div>
                        {req.note && (
                          <div style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--surface2)', borderRadius: 6, padding: '5px 8px', marginBottom: 6 }}>
                            📝 Student note: {req.note}
                          </div>
                        )}
                        {req.admin_note && (
                          <div style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--surface2)', borderRadius: 6, padding: '5px 8px' }}>
                            👤 Librarian note: {req.admin_note} · by {req.reviewed_by_name} on {new Date(req.reviewed_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {req.status === 'PENDING' && (
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => handleReject(req.id, '')} style={{ padding: '6px 16px', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: 7, color: '#fb7185', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          ❌ Reject
                        </button>
                        <button onClick={() => setModal(req)} style={{ padding: '6px 16px', background: '#6366f1', border: 'none', borderRadius: 7, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          📋 Review & Approve
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
