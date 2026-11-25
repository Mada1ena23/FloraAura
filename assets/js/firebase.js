import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCq0WVv-PKg8lyCiZ5iHWJCJo36TltofWQ',
  authDomain: 'floraaura-6d700.firebaseapp.com',
  projectId: 'floraaura-6d700',
  storageBucket: 'floraaura-6d700.firebasestorage.app',
  messagingSenderId: '447888314676',
  appId: '1:447888314676:web:35333c6457c935b757d561'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
