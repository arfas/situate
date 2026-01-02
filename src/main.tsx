import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { SettingsProvider } from './contexts/SettingsContext.tsx';
import { EncryptionProvider } from './contexts/EncryptionContext.tsx';
import { initAnalytics } from './lib/analytics';
import './index.css';

// Initialize analytics
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <EncryptionProvider>
          <App />
        </EncryptionProvider>
      </AuthProvider>
    </SettingsProvider>
  </StrictMode>
);
