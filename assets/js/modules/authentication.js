import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import { auth } from '../firebase.js';
import { initializeUserData } from '../db.js';

function getAuthErrorMessage(error) {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Este email já tem conta. Inicia sessão ou usa outro email.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Email ou palavra-passe incorretos.';
    case 'auth/invalid-email':
      return 'Introduz um endereço de email válido.';
    case 'auth/weak-password':
      return 'A palavra-passe deve ter pelo menos 6 caracteres.';
    case 'auth/operation-not-allowed':
      return 'Ativa o método Email/Password nas definições de Authentication do Firebase.';
    case 'auth/unauthorized-domain':
      return 'Adiciona o domínio desta aplicação à lista de domínios autorizados do Firebase.';
    case 'auth/too-many-requests':
      return 'Foram feitas demasiadas tentativas. Tenta novamente mais tarde.';
    case 'auth/network-request-failed':
    case 'unavailable':
      return 'Sem ligação à internet. Verifica a ligação e tenta novamente.';
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'O Firestore recusou o acesso. Verifica se as regras de segurança foram publicadas.';
    case 'failed-precondition':
      return 'A base de dados Firestore ainda não está configurada neste projeto.';
    default:
      return error.message || 'Não foi possível ligar à Firebase. Tenta novamente.';
  }
}

export function setupAuthentication(onAuthenticated) {
  const panel = document.getElementById('auth-panel');
  const form = document.getElementById('auth-form');
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const title = document.getElementById('auth-title');
  const description = document.querySelector('.auth-description');
  const submitButton = document.getElementById('auth-submit');
  const modeButton = document.getElementById('auth-mode-toggle');
  const retryButton = document.getElementById('auth-retry');
  const status = document.getElementById('auth-status');
  const appElements = document.querySelectorAll('[data-auth-required]');
  const accountEmail = document.getElementById('account-email');
  const accountStatus = document.getElementById('account-status');
  const signOutButton = document.getElementById('auth-sign-out');
  if (!panel || !form || !emailInput || !passwordInput || !submitButton || !modeButton || !retryButton || !status) return;

  let isCreatingAccount = false;
  let isInitializing = false;
  let appStarted = false;

  const setAppVisible = (user) => {
    panel.hidden = Boolean(user);
    appElements.forEach((element) => {
      element.hidden = !user;
    });
    if (accountEmail) accountEmail.textContent = user?.email ?? '';
    if (accountStatus) accountStatus.textContent = '';
  };

  const startApp = async (user) => {
    if (appStarted || isInitializing) return;
    isInitializing = true;
    status.textContent = 'A ligar os teus dados guardados…';
    retryButton.hidden = true;
    try {
      await initializeUserData();
      if (auth.currentUser?.uid !== user.uid) return;
      appStarted = true;
      passwordInput.value = '';
      setAppVisible(user);
      status.textContent = '';
      onAuthenticated();
    } catch (error) {
      console.error('Não foi possível inicializar os dados Firebase:', error);
      status.textContent = getAuthErrorMessage(error);
      retryButton.hidden = false;
    } finally {
      isInitializing = false;
    }
  };

  modeButton.addEventListener('click', () => {
    isCreatingAccount = !isCreatingAccount;
    submitButton.textContent = isCreatingAccount ? 'Criar conta' : 'Iniciar sessão';
    modeButton.textContent = isCreatingAccount ? 'Já tenho conta' : 'Criar conta';
    passwordInput.autocomplete = isCreatingAccount ? 'new-password' : 'current-password';
    if (title) title.textContent = isCreatingAccount ? 'Cria a tua conta' : 'Entra na tua conta';
    if (description) {
      description.textContent = isCreatingAccount
        ? 'Cria uma conta para guardar e sincronizar os dados do teu jardim.'
        : 'Inicia sessão para guardar e sincronizar os dados do teu jardim.';
    }
    status.textContent = '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    modeButton.disabled = true;
    status.textContent = isCreatingAccount ? 'A criar a conta…' : 'A iniciar sessão…';
    try {
      if (isCreatingAccount) {
        await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
      } else {
        await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
      }
    } catch (error) {
      console.error('Erro de autenticação Firebase:', error);
      status.textContent = getAuthErrorMessage(error);
    } finally {
      submitButton.disabled = false;
      modeButton.disabled = false;
    }
  });

  retryButton.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) void startApp(user);
  });

  signOutButton?.addEventListener('click', async () => {
    signOutButton.disabled = true;
    try {
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao terminar sessão Firebase:', error);
      if (accountStatus) accountStatus.textContent = getAuthErrorMessage(error);
      signOutButton.disabled = false;
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      appStarted = false;
      setAppVisible(null);
      status.textContent = '';
      return;
    }
    void startApp(user);
  }, (error) => {
    console.error('Erro ao verificar a sessão Firebase:', error);
    setAppVisible(null);
    status.textContent = getAuthErrorMessage(error);
  });
}
