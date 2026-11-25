import { setupNavigation, renderUserPlants, setupModal, setupWateringReminders } from './modules/UI.js';
import { setupCatalog } from './modules/catalog.js';
import { setupGardenBackup } from './modules/backup.js';
import { setupHomeFeatures } from './modules/home-features.js';
import { setupAuthentication } from './modules/authentication.js';
import { watchUserPlants } from './db.js';

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
  setupAuthentication(() => {
    setupNavigation();
    setupModal();
    setupWateringReminders();
    setupGardenBackup();
    setupHomeFeatures();
    watchUserPlants((plants) => {
      void renderUserPlants(plants);
    }, (error) => {
      console.error('Erro ao sincronizar plantas com o Firestore:', error);
      const container = document.getElementById('user-plants-grid');
      if (container) {
        const message = document.createElement('p');
        message.className = 'empty-state error-state';
        message.setAttribute('role', 'alert');
        message.textContent = 'A sincronização com o Firestore falhou. Verifica a ligação e tenta atualizar a página.';
        container.replaceChildren(message);
      }
    });
    void renderUserPlants();
    void setupCatalog();
  });
});