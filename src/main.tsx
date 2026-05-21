import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { registerServiceWorker } from './registerServiceWorker.ts';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);

registerServiceWorker();
