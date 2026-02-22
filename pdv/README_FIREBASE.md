# Configuração do Firebase para Flokite PDV

Este sistema foi migrado para utilizar o Firebase Firestore como banco de dados em tempo real. Siga os passos abaixo para configurar o seu ambiente.

## 1. Criar Projeto no Firebase
1. Acesse [console.firebase.google.com](https://console.firebase.google.com).
2. Clique em "Adicionar projeto" e siga as instruções.
3. Desative o Google Analytics se não precisar (simplifica).

## 2. Configurar Firestore
1. No menu lateral, clique em **Criação** > **Firestore Database**.
2. Clique em "Criar banco de dados".
3. Escolha o local (ex: `nam5` ou `sa-east1` para Brasil).
4. Inicie no **Modo de Teste** (para desenvolvimento) ou **Modo de Produção** (configure regras depois).

## 3. Configurar Regras de Segurança
Vá na aba **Regras** do Firestore e cole o seguinte (básico para começar):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // PERIGO: Aberto para todos. Adicione Autenticação depois.
    }
  }
}
```

Para produção, configure Firebase Auth e restrinja: `allow read, write: if request.auth != null;`.

## 4. Obter Credenciais
1. Clique na engrenagem (Configurações do Projeto).
2. Em "Seus aplicativos", clique no ícone **Web (</>)**.
3. Registre o app (ex: "PDV Web").
4. Copie o objeto `firebaseConfig`.

## 5. Atualizar o Código
1. Abra o arquivo `pdv/js/firebase-config.js`.
2. Substitua o objeto `firebaseConfig` pelas suas credenciais copiadas.

## 6. Deploy (Hospedagem)
Para colocar online:
1. Instale Firebase CLI: `npm install -g firebase-tools`.
2. Login: `firebase login`.
3. Na pasta `pdv/`:
   ```bash
   firebase init hosting
   ```
   - Selecione seu projeto.
   - Pasta pública: `.` (ponto, ou diretório atual).
   - Configurar como SPA? Não (é um arquivo único, mas pode ser Sim se quiser rewrite).
4. Deploy:
   ```bash
   firebase deploy
   ```

## Migração de Dados Antigos
Se você já usava o sistema localmente:
1. Abra o sistema no navegador.
2. Abra o Console do Desenvolvedor (F12).
3. Execute: `FirestoreService.migrateFromLocalStorage()`.
4. Aguarde a mensagem "Migration Completed".
