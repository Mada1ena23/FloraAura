import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import { auth } from '../firebase.js';
import { initializeUserData } from '../db.js';

function getAuthErrorMessage(error) {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'Este email já tem conta. Inicia sessão ou usa outro email.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email ou palavra-passe incorretos.';
    case 'auth/missing-email':
    case 'auth/invalid-email':
      return 'Introduz um endereço de email válido.';
    case 'auth/weak-password':
      return 'A palavra-passe deve ter pelo menos 6 caracteres.';
    case 'auth/operation-not-allowed':
      return 'Ativa Email/Password e Google em Authentication → Sign-in method na Firebase Console.';
    case 'auth/unauthorized-domain':
      return 'Adiciona o domínio desta aplicação à lista de domínios autorizados do Firebase.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'O início de sessão com Google foi cancelado.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela de início de sessão. Permite pop-ups e tenta novamente.';
    case 'auth/account-exists-with-different-credential':
      return 'Já existe uma conta com este email. Inicia sessão com o método usado anteriormente.';
    case 'auth/user-disabled':
      return 'Esta conta foi desativada. Contacta o suporte da aplicação.';
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
      return error?.message || 'Não foi possível ligar à Firebase. Tenta novamente.';
  }
}

export function setupAuthentication(onAuthenticated) {
  const panel = document.getElementById('auth-panel');
  const form = document.getElementById('auth-form');
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const confirmPasswordInput = document.getElementById('auth-confirm-password');
  const confirmPasswordLabel = document.getElementById('auth-confirm-password-label');
  const title = document.getElementById('auth-title');
  const description = document.querySelector('.auth-description');
  const submitButton = document.getElementById('auth-submit');
  const modeButton = document.getElementById('auth-mode-toggle');
  const googleButton = document.getElementById('auth-google');
  const resetPasswordButton = document.getElementById('auth-reset-password');
  const retryButton = document.getElementById('auth-retry');
  const status = document.getElementById('auth-status');
  const appElements = document.querySelectorAll('[data-auth-required]');
  const accountEmail = document.getElementById('account-email');
  const accountStatus = document.getElementById('account-status');
  const signOutButton = document.getElementById('auth-sign-out');
  if (
    !panel || !form || !emailInput || !passwordInput || !confirmPasswordInput ||
    !confirmPasswordLabel || !submitButton || !modeButton || !googleButton ||
    !resetPasswordButton || !retryButton || !status
  ) return;

  let isCreatingAccount = false;
  let isInitializing = false;
  let isAuthActionInProgress = false;
  let appStarted = false;

  const setStatus = (message, state = '') => {
    status.textContent = message;
    status.classList.toggle('auth-status--error', state === 'error');
    status.classList.toggle('auth-status--success', state === 'success');
  };

  const setAuthBusy = (busy) => {
    submitButton.disabled = busy;
    modeButton.disabled = busy;
    googleButton.disabled = busy;
    resetPasswordButton.disabled = busy;
  };

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
    setStatus('A ligar os teus dados guardados…');
    retryButton.hidden = true;
    try {
      await initializeUserData();
      if (auth.currentUser?.uid !== user.uid) return;
      appStarted = true;
      passwordInput.value = '';
      confirmPasswordInput.value = '';
      setAppVisible(user);
      setStatus('');
      onAuthenticated();
    } catch (error) {
      if (auth.currentUser?.uid !== user.uid) return;
      console.error('Não foi possível inicializar os dados Firebase:', error);
      setStatus(getAuthErrorMessage(error), 'error');
      retryButton.hidden = false;
    } finally {
      isInitializing = false;
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid !== user.uid && !appStarted) {
        void startApp(currentUser);
      }
    }
  };

  modeButton.addEventListener('click', () => {
    isCreatingAccount = !isCreatingAccount;
    submitButton.textContent = isCreatingAccount ? 'Criar conta' : 'Iniciar sessão';
    modeButton.textContent = isCreatingAccount ? 'Já tenho conta' : 'Criar conta';
    passwordInput.autocomplete = isCreatingAccount ? 'new-password' : 'current-password';
    confirmPasswordLabel.hidden = !isCreatingAccount;
    confirmPasswordInput.hidden = !isCreatingAccount;
    confirmPasswordInput.required = isCreatingAccount;
    confirmPasswordInput.value = '';
    resetPasswordButton.hidden = isCreatingAccount;
    retryButton.hidden = true;
    if (title) title.textContent = isCreatingAccount ? 'Cria a tua conta' : 'Entra na tua conta';
    if (description) {
      description.textContent = isCreatingAccount
        ? 'Cria uma conta para guardar e sincronizar os dados do teu jardim.'
        : 'Inicia sessão para guardar e sincronizar os dados do teu jardim.';
    }
    setStatus('');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isAuthActionInProgress) return;
    if (isCreatingAccount && passwordInput.value !== confirmPasswordInput.value) {
      setStatus('As palavras-passe não coincidem.', 'error');
      confirmPasswordInput.focus();
      return;
    }

    isAuthActionInProgress = true;
    setAuthBusy(true);
    setStatus(isCreatingAccount ? 'A criar a conta…' : 'A iniciar sessão…');
    try {
      if (isCreatingAccount) {
        await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
      } else {
        await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
      }
    } catch (error) {
      console.error('Erro de autenticação Firebase:', error);
      setStatus(getAuthErrorMessage(error), 'error');
    } finally {
      isAuthActionInProgress = false;
      setAuthBusy(false);
    }
  });

  googleButton?.addEventListener('click', async () => {
    if (isAuthActionInProgress) return;
    isAuthActionInProgress = true;
    setAuthBusy(true);
    setStatus('A ligar à Google…');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error('Erro ao iniciar sessão com Google:', error);
      setStatus(getAuthErrorMessage(error), 'error');
    } finally {
      isAuthActionInProgress = false;
      setAuthBusy(false);
    }
  });

  resetPasswordButton.addEventListener('click', async () => {
    if (isAuthActionInProgress) return;
    if (!emailInput.reportValidity()) {
      emailInput.focus();
      return;
    }

    isAuthActionInProgress = true;
    setAuthBusy(true);
    setStatus('A enviar o email para redefinir a palavra-passe…');
    try {
      await sendPasswordResetEmail(auth, emailInput.value.trim());
      setStatus('Se existir uma conta para este email, receberás instruções para redefinir a palavra-passe.', 'success');
    } catch (error) {
      console.error('Erro ao pedir redefinição da palavra-passe:', error);
      setStatus(getAuthErrorMessage(error), 'error');
    } finally {
      isAuthActionInProgress = false;
      setAuthBusy(false);
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
      retryButton.hidden = true;
      setStatus('');
      return;
    }
    void startApp(user);
  }, (error) => {
    console.error('Erro ao verificar a sessão Firebase:', error);
    setAppVisible(null);
    setStatus(getAuthErrorMessage(error), 'error');
  });
}
