import { setupNavigation, renderUserPlants, setupModal } from './modules/UI.js';

// Registo do Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('FloraAura Service Worker registado com sucesso:', reg.scope);
    } catch (err) {
      console.error('Erro ao registar o Service Worker:', err);
    }
  });
}

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupModal();
  renderUserPlants();
});