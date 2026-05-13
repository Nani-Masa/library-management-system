import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';

export default function Page() {
  const router = useRouter();
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading]);
  return (
    <>
      <Head><title>LibraryOS</title></Head>
      <Layout>
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚧</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Coming Soon</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>This feature is under development.</div>
        </div>
      </Layout>
    </>
  );
}
