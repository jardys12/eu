# Configuração de Autenticação Firebase

Este documento descreve como configurar e utilizar o sistema de autenticação do Flokite PDV.

## 1. Habilitar Métodos de Login
1. Acesse o Console do Firebase (Authentication > Sign-in method).
2. Habilite **Email/Password**.
3. Habilite **Google** (configure o ID do cliente se necessário, mas o padrão funciona para testes locais se `localhost` estiver autorizado).

## 2. Autorizar Domínios
1. Em Authentication > Settings > Authorized domains.
2. Adicione seu domínio de produção (ex: `pdv.flokite.com.br`).
3. `localhost` já vem autorizado.

## 3. Configuração do SDK
Certifique-se de que o arquivo `pdv/js/firebase-config.js` contém as credenciais corretas do seu projeto.

## 4. Testes
Abra `pdv/test-auth.html` para executar testes de login/registro/logout.

## 5. Fluxos Implementados

### Login
- Usuário insere email e senha.
- Sistema valida formato.
- Chama `auth.signInWithEmailAndPassword`.
- Redireciona para Dashboard.

### Registro
- Usuário insere email e senha.
- Validação de senha forte (8+ chars, maiúscula, minúscula, número, especial).
- Chama `auth.createUserWithEmailAndPassword`.
- Loga automaticamente após sucesso.

### Recuperação de Senha
- Usuário insere email.
- Sistema envia link de redefinição.
- Usuário redefine senha via link enviado pelo Firebase (página padrão ou customizada no console).

### Logout
- Limpa sessão local.
- Redireciona para Login.
