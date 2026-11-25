# Configuração Firebase

A aplicação usa Firebase Authentication (email/palavra-passe) e Cloud Firestore. O SDK é carregado como módulos de navegador; não é necessário instalar `firebase-tools` para executar a aplicação.

## Ativar os serviços

1. Na Firebase Console, abre o projeto `floraaura-6d700`.
2. Em **Authentication → Sign-in method**, ativa **Email/Password**.
3. Em **Firestore Database**, cria a base de dados e escolhe a região mais próxima dos utilizadores.
4. Em **Firestore Database → Rules**, publica o conteúdo de [`firestore.rules`](./firestore.rules).
5. Em **Authentication → Settings → Authorized domains**, confirma que o domínio usado para testar a aplicação está permitido (por exemplo, `localhost`).
6. Abre a aplicação por HTTPS ou por um servidor local. A ligação não funciona de forma fiável ao abrir `index.html` diretamente como `file://`.
7. Usa **Criar conta** na página de entrada. Cada conta acede apenas aos documentos em `users/{uid}`.

Os dados antigos guardados no navegador são importados para a primeira conta que iniciar sessão nesse navegador. Os registos do jardim, favoritos e catálogo pessoal ficam no Firestore; as preferências de notificações de rega continuam locais ao dispositivo.

Os registos ficam em `users/{uid}/plants` e as preferências em `users/{uid}/settings/app`. A configuração Web fica no código do cliente e não é uma chave de conta de serviço; nunca coloques uma chave de conta de serviço na aplicação.

## Publicar regras pela linha de comandos (opcional)

O projeto inclui `firebase.json` e `.firebaserc`. Se Node.js e Firebase CLI estiverem instalados e autenticados, as regras podem ser publicadas com:

```powershell
firebase deploy --only firestore:rules
```

Também é possível publicar as regras diretamente pela Firebase Console, sem instalar o CLI.
