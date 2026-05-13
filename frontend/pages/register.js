import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();

  const [accountType, setAccountType] = useState('student');
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [studentId, setStudentId]     = useState('');
  const [staffRole, setStaffRole]     = useState('admin');
  const [staffId, setStaffId]         = useState('');
  const [staffIdError, setStaffIdError] = useState('');
  const [loading, setLoading]         = useState(false);

  // Validate staff ID format
  const validateStaffId = (id, role) => {
    if (role === 'admin') {
      if (!id.startsWith('Ad')) return 'Admin ID must start with "Ad"';
      const nums = id.slice(2);
      if (!nums || !/^\d+$/.test(nums)) return 'Admin ID format: Ad followed by numbers (e.g. Ad1001)';
    }
    if (role === 'librarian') {
      if (!id.startsWith('Lib')) return 'Librarian ID must start with "Lib"';
      const nums = id.slice(3);
      if (!nums || !/^\d+$/.test(nums)) return 'Librarian ID format: Lib followed by numbers (e.g. Lib1001)';
    }
    return '';
  };

  const handleStaffIdChange = (val) => {
    setStaffId(val);
    if (val) setStaffIdError(validateStaffId(val, staffRole));
    else setStaffIdError('');
  };

  const handleStaffRoleChange = (role) => {
    setStaffRole(role);
    setStaffId('');
    setStaffIdError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Validate staff ID
    if (accountType === 'staff') {
      const err = validateStaffId(staffId, staffRole);
      if (err) { setStaffIdError(err); return; }
    }

    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        role: accountType === 'staff' ? staffRole : 'student',
        student_id: accountType === 'student' ? studentId : staffId,
      };
      const user = await register(payload);
      toast.success(`Account created! Welcome to LibraryOS 🎉`);
      router.push(user.role === 'admin' || user.role === 'librarian' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', background: 'var(--bg)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: 8, padding: '9px 12px',
    fontSize: 13, color: '#f1f5f9',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const inputErrorStyle = {
    ...inputStyle,
    border: '1px solid rgba(251,113,133,0.5)',
  };

  const labelStyle = {
    fontSize: 12, fontWeight: 500,
    color: '#94a3b8', display: 'block', marginBottom: 5,
  };

  const passStrength = password.length >= 12 ? 'Strong'
    : password.length >= 8 ? 'Good' : 'Too short';
  const passColor = password.length >= 12 ? '#34d399'
    : password.length >= 8 ? '#fbbf24' : '#fb7185';
  const passWidth = password.length >= 12 ? '100%'
    : password.length >= 8 ? '60%' : '30%';

  return (
    <>
      <Head><title>Create Account — LibraryOS</title></Head>
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid rgba(148,163,184,0.15)',
          borderRadius: 20, padding: '32px 28px',
          width: '100%', maxWidth: 380,
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📚</div>
              <span style={{ fontWeight: 700, fontSize: 16 }}>LibraryOS</span>
            </div>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>Create your account</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 24 }}>Join your university library</p>

          {/* Account Type Toggle */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Account type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { value: 'student', icon: '🎓', label: 'Student' },
                { value: 'staff',   icon: '🏛️', label: 'Staff' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setAccountType(opt.value); setStaffId(''); setStaffIdError(''); setStudentId(''); }}
                  style={{
                    padding: '10px 8px',
                    background: accountType === opt.value ? 'rgba(99,102,241,0.15)' : '#0f172a',
                    border: accountType === opt.value
                      ? '1px solid rgba(99,102,241,0.5)'
                      : '1px solid rgba(148,163,184,0.15)',
                    borderRadius: 10, cursor: 'pointer',
                    color: accountType === opt.value ? '#818cf8' : '#94a3b8',
                    fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}>
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off">

            {/* Full Name */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Full name</label>
              <input
                type="text" placeholder="e.g. John Smith"
                value={name} onChange={e => setName(e.target.value)}
                required autoComplete="off" style={inputStyle}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Email address</label>
              <input
                type="email" placeholder="you@university.edu"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="off" style={inputStyle}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 16,
                  color: '#64748b', padding: 0, lineHeight: 1,
                }} title={showPass ? 'Hide' : 'Show'}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 3, borderRadius: 100, background: '#293548', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 100, width: passWidth, background: passColor, transition: 'all 0.3s' }} />
                  </div>
                  <div style={{ fontSize: 10, marginTop: 3, color: passColor }}>{passStrength} password</div>
                </div>
              )}
            </div>

            {/* ── STUDENT FIELDS ── */}
            {accountType === 'student' && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Student ID <span style={{ color: '#64748b' }}>(optional)</span></label>
                <input
                  type="text" placeholder="e.g. STU2024001"
                  value={studentId} onChange={e => setStudentId(e.target.value)}
                  autoComplete="off" style={inputStyle}
                />
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  Your university-issued student ID number
                </div>
              </div>
            )}

            {/* ── STAFF FIELDS ── */}
            {accountType === 'staff' && (
              <div style={{
                background: 'var(--bg)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12, padding: 14, marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#818cf8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Staff Details
                </div>

                {/* Role radio buttons */}
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Staff role <span style={{ color: '#fb7185' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { value: 'admin',     icon: '👑', label: 'Admin',     desc: 'Full system access' },
                      { value: 'librarian', icon: '📖', label: 'Librarian', desc: 'Book & user management' },
                    ].map(opt => (
                      <label key={opt.value} style={{
                        flex: 1, display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '10px 10px',
                        background: staffRole === opt.value ? 'rgba(99,102,241,0.12)' : '#1e293b',
                        border: staffRole === opt.value
                          ? '1px solid rgba(99,102,241,0.45)'
                          : '1px solid rgba(148,163,184,0.12)',
                        borderRadius: 10, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}>
                        <input
                          type="radio"
                          name="staffRole"
                          value={opt.value}
                          checked={staffRole === opt.value}
                          onChange={() => handleStaffRoleChange(opt.value)}
                          style={{ marginTop: 2, accentColor: '#6366f1' }}
                        />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: staffRole === opt.value ? '#818cf8' : '#f1f5f9' }}>
                            {opt.icon} {opt.label}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Staff ID field */}
                <div>
                  <label style={labelStyle}>
                    {staffRole === 'admin' ? 'Admin' : 'Librarian'} ID
                    <span style={{ color: '#fb7185' }}> *</span>
                    <span style={{
                      marginLeft: 6, fontSize: 10, fontWeight: 400,
                      color: '#64748b',
                    }}>
                      {staffRole === 'admin' ? '(starts with "Ad" + numbers)' : '(starts with "Lib" + numbers)'}
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder={staffRole === 'admin' ? 'e.g. Ad1001' : 'e.g. Lib1001'}
                    value={staffId}
                    onChange={e => handleStaffIdChange(e.target.value)}
                    required
                    autoComplete="off"
                    style={staffIdError ? inputErrorStyle : inputStyle}
                  />
                  {/* Live format hint */}
                  {!staffIdError && staffId && (
                    <div style={{ fontSize: 10, color: '#34d399', marginTop: 4 }}>
                      ✓ Valid {staffRole} ID format
                    </div>
                  )}
                  {staffIdError && (
                    <div style={{ fontSize: 10, color: '#fb7185', marginTop: 4 }}>
                      ✕ {staffIdError}
                    </div>
                  )}
                  {!staffId && (
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                      {staffRole === 'admin'
                        ? 'Format: Ad followed by numbers — e.g. Ad1001, Ad2025'
                        : 'Format: Lib followed by numbers — e.g. Lib1001, Lib2025'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (accountType === 'staff' && !!staffIdError)}
              style={{
                width: '100%', padding: '10px',
                background: loading ? '#4338ca' : '#6366f1',
                border: 'none', borderRadius: 8,
                color: 'white', fontSize: 13,
                fontWeight: 600,
                cursor: (loading || (accountType === 'staff' && !!staffIdError))
                  ? 'not-allowed' : 'pointer',
                opacity: (accountType === 'staff' && !!staffIdError) ? 0.6 : 1,
                transition: 'all 0.15s',
              }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 20 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#818cf8', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
