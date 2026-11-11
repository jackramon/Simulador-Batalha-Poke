import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Carregamento de testes sob demanda para evitar dependências circulares na inicialização
(window as any).loadAndRunTests = async () => {
  console.log('⏳ Carregando módulo de testes...');
  try {
    const testModule = await import('./tests/testRunner');
    testModule.runTests();
  } catch (error) {
    console.error('Falha ao carregar testes:', error);
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Não foi possível encontrar o elemento root para montar a aplicação");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);