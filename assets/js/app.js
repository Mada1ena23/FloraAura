import { setupNavigation, renderUserPlants, setupModal } from './modules/UI.js';
import { setupCatalog } from './modules/catalog.js';

let deferredInstallPrompt;
const installButton = document.getElementById('pwa-install-btn');

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installButton) installButton.hidden = false;
});

installButton?.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;

  installButton.disabled = true;
  try {
    await deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') installButton.hidden = true;
    deferredInstallPrompt = null;
  } catch (err) {
    console.error('Erro ao iniciar a instalação da FloraAura:', err);
  } finally {
    installButton.disabled = false;
  }
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if (installButton) installButton.hidden = true;
});

// Registo do Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const workerUrl = new URL('../../sw.js', import.meta.url);
      const reg = await navigator.serviceWorker.register(workerUrl);
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
  setupCatalog();
});