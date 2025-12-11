import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n'; 
import './style/styles.css';
import './style/colors.css';
import './style/theme.css';
import './style/fonts.css';
import App from './App.jsx';
import { HashRouter } from 'react-router-dom';

console.log('Elemento root encontrado:', document.getElementById('root'));

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Elemento com id "root" não encontrado no DOM');

  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ff4444; color: white; padding: 20px; text-align: center; z-index: 10000;';
  errorDiv.textContent = 'Erro: Elemento com id "root" não encontrado. Verifique o console para mais detalhes.';
  document.body.appendChild(errorDiv);
} else {
  try {
    const root = createRoot(rootElement);
    console.log('React está sendo montado no elemento root');
    root.render(
      <StrictMode>
        <I18nextProvider i18n={i18n}>
          <Suspense fallback={<div>Loading...</div>}>
            <HashRouter>
              <App />
            </HashRouter>
          </Suspense>
        </I18nextProvider>
      </StrictMode>,
    );
  } catch (error) {
    console.error('Erro ao renderizar o React:', error);

    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ff4444; color: white; padding: 20px; text-align: center; z-index: 10000; white-space: pre;';
    errorDiv.textContent = `ERROR: Render React: ${error.message}\n\n`;
    document.body.appendChild(errorDiv);
  }
}
