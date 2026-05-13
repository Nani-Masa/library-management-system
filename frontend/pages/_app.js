import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function ToasterWithTheme() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: theme === 'dark' ? '#1e293b' : '#ffffff',
          color:      theme === 'dark' ? '#f1f5f9' : '#0f172a',
          border:     theme === 'dark'
            ? '1px solid rgba(148,163,184,0.2)'
            : '1px solid rgba(15,23,42,0.1)',
          borderRadius: '10px',
          fontSize: '13px',
          boxShadow: theme === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(15,23,42,0.1)',
        },
      }}
    />
  );
}

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
      <ToasterWithTheme />
    </ThemeProvider>
  );
}
