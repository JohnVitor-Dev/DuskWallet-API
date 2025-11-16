<p align="center">
  <img src="DUSKWALLET.svg" alt="DuskWallet API Banner" width="800">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Versão-1.0.0-blue?style=for-the-badge" alt="Versão">
  <img src="https://img.shields.io/badge/Licença-MIT-green?style=for-the-badge" alt="Licença">
  <img src="https://img.shields.io/github/stars/JohnVitor-Dev/DuskWallet-API?style=for-the-badge" alt="Stars">
</p>

---

## 📖 Descrição

**DuskWallet API** é uma API REST completa para gerenciamento de finanças pessoais, permitindo que usuários controlem suas receitas e despesas de forma inteligente e segura. A API oferece funcionalidades de autenticação, CRUD de transações financeiras, dashboard com resumos automáticos e análise inteligente de gastos utilizando IA (Google Gemini).

### Problema que resolve

Muitas pessoas têm dificuldade em controlar suas finanças pessoais e entender para onde o dinheiro está indo. A DuskWallet API oferece:

- ✅ Controle completo de receitas e despesas
- ✅ Categorização automática de transações
- ✅ Análises inteligentes com insights personalizados
- ✅ Dashboard com visão geral financeira
- ✅ Segurança robusta com autenticação JWT
- ✅ Validação e sanitização de dados

### Endpoints Principais

- **Autenticação**: Registro e login de usuários
- **Transações**: CRUD completo de transações financeiras
- **Dashboard**: Resumo automático de finanças
- **Análise**: Insights inteligentes gerados por IA

---

## 🚀 Status do Projeto

```
🚧 API em desenvolvimento ativo 🚧
```

**Versão atual**: 1.0.0  
**Última atualização**: Novembro 2025

---

## ⚡ Funcionalidades

### 🔐 Autenticação e Segurança
- [x] Registro de novos usuários com hash de senha (bcrypt)
- [x] Login com geração de token JWT
- [x] Middleware de autenticação para rotas protegidas
- [x] Rate limiting para prevenir ataques de força bruta
- [x] Sanitização de dados contra injeção NoSQL
- [x] Headers de segurança com Helmet.js

### 💳 Gerenciamento de Transações
- [x] Criar transações de receita ou despesa
- [x] Buscar transação específica por ID
- [x] Atualizar informações de transações
- [x] Excluir transações
- [x] Categorização (14 categorias disponíveis)
- [x] Suporte a múltiplos métodos de pagamento (Dinheiro, PIX, Crédito)

### 📊 Dashboard e Relatórios
- [x] Resumo financeiro automático
- [x] Total de receitas e despesas
- [x] Saldo atual
- [x] Gastos por categoria
- [x] Distribuição por método de pagamento
- [x] Últimas transações

### 🤖 Análise Inteligente com IA
- [x] Análise de padrões de gastos
- [x] Insights personalizados gerados por Google Gemini AI
- [x] Recomendações de economia
- [x] Alertas sobre categorias com gastos elevados

### 🛡️ Recursos de Segurança
- [x] Validação rigorosa de dados com Express Validator
- [x] Limite de taxa de requisições (Rate Limiting)
- [x] Variáveis de ambiente para dados sensíveis
- [x] Tokens JWT com expiração configurável

---

## 📚 Documentação de Endpoints

### Autenticação

#### **POST** `/api/auth/register`

Registra um novo usuário no sistema.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senhaSegura123"
}
```

**Resposta de Sucesso (201):**
```json
{
  "message": "Usuário registrado com sucesso",
  "user": "joao@example.com",
  "name": "João Silva"
}
```

**Observação:** O endpoint de registro **não** retorna um token JWT. Para obter o token, é necessário fazer login através do endpoint `/api/auth/login`.

**Erros Possíveis:**
- `400` - Dados inválidos ou email já cadastrado
- `500` - Erro interno do servidor

---

#### **POST** `/api/auth/login`

Autentica um usuário existente.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "joao@example.com",
  "password": "senhaSegura123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Usuário logado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros Possíveis:**
- `401` - Credenciais inválidas
- `429` - Muitas tentativas de login (Rate Limit)
- `500` - Erro interno do servidor

---

### Transações

> **Nota:** Todas as rotas de transações requerem autenticação via token JWT no header.

**Header obrigatório:**
```
Authorization: Bearer {seu_token_jwt}
```

---

#### **POST** `/api/transactions`

Cria uma nova transação financeira.

**Body:**
```json
{
  "description": "Compra no supermercado",
  "amount": 150.75,
  "type": "EXPENSE",
  "category": "MERCADO",
  "paymentMethod": "CREDITO",
  "date": "2025-11-16T10:30:00Z"
}
```

**Campos:**
- `description` (string, obrigatório): Descrição da transação
- `amount` (number, obrigatório): Valor da transação
- `type` (enum, obrigatório): `INCOME` ou `EXPENSE`
- `category` (enum, obrigatório): Uma das 14 categorias disponíveis
- `paymentMethod` (enum, obrigatório): `DINHEIRO`, `PIX` ou `CREDITO`
- `date` (string ISO, opcional): Data da transação (padrão: agora)

**Categorias disponíveis:**
- `MORADIA`, `CONTAS`, `MERCADO`, `COMIDA_FORA`, `TRANSPORTE`
- `SAUDE`, `EDUCACAO`, `LAZER`, `COMPRAS`, `DIVIDAS`
- `INVESTIMENTOS`, `SALARIO`, `OUTRAS_RECEITAS`, `OUTROS`

**Resposta de Sucesso (201):**
```json
{
  "message": "Transação criada com sucesso",
  "transaction": {
    "id": "clxy9876543210fedcba",
    "description": "Compra no supermercado",
    "amount": 150.75,
    "type": "EXPENSE",
    "category": "MERCADO",
    "paymentMethod": "CREDITO",
    "date": "2025-11-16T10:30:00.000Z",
    "userId": "clxy1234567890abcdef"
  }
}
```

**Erros Possíveis:**
- `400` - Dados inválidos
- `401` - Token inválido ou ausente
- `500` - Erro interno do servidor

---

#### **GET** `/api/transactions`

Lista todas as transações do usuário autenticado, ordenadas por data (mais recentes primeiro).

**Resposta de Sucesso (200):**
```json
{
  "transactions": [
    {
      "id": "clxy9876543210fedcba",
      "description": "Compra no supermercado",
      "amount": 150.75,
      "type": "EXPENSE",
      "category": "MERCADO",
      "paymentMethod": "CREDITO",
      "date": "2025-11-16T10:30:00.000Z",
      "userId": "clxy1234567890abcdef"
    },
    {
      "id": "clxy5555666777778888",
      "description": "Salário mensal",
      "amount": 5000.00,
      "type": "INCOME",
      "category": "SALARIO",
      "paymentMethod": "PIX",
      "date": "2025-11-05T09:00:00.000Z",
      "userId": "clxy1234567890abcdef"
    }
  ]
}
```

**Erros Possíveis:**
- `401` - Token inválido ou ausente
- `500` - Erro interno do servidor

---

#### **GET** `/api/transactions/:id`

Busca uma transação específica por ID.

**Parâmetros:**
- `id` (string): ID da transação

**Resposta de Sucesso (200):**
```json
{
  "transaction": {
    "id": "clxy9876543210fedcba",
    "description": "Compra no supermercado",
    "amount": 150.75,
    "type": "EXPENSE",
    "category": "MERCADO",
    "paymentMethod": "CREDITO",
    "date": "2025-11-16T10:30:00.000Z",
    "userId": "clxy1234567890abcdef"
  }
}
```

**Erros Possíveis:**
- `401` - Token inválido ou ausente
- `404` - Transação não encontrada
- `500` - Erro interno do servidor

---

#### **PUT** `/api/transactions/:id`

Atualiza uma transação existente.

**Parâmetros:**
- `id` (string): ID da transação

**Body (todos os campos opcionais):**
```json
{
  "description": "Compra no mercado - atualizado",
  "amount": 175.50,
  "category": "MERCADO",
  "paymentMethod": "PIX"
}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Transação atualizada com sucesso"
}
```

**Erros Possíveis:**
- `400` - Dados inválidos ou nenhum campo para atualizar foi fornecido
- `401` - Token inválido ou ausente
- `404` - Transação não encontrada
- `500` - Erro interno do servidor

---

#### **DELETE** `/api/transactions/:id`

Exclui uma transação.

**Parâmetros:**
- `id` (string): ID da transação

**Resposta de Sucesso (200):**
```json
{
  "message": "Transação deletada com sucesso"
}
```

**Erros Possíveis:**
- `401` - Token inválido ou ausente
- `404` - Transação não encontrada
- `500` - Erro interno do servidor

---

### Dashboard

#### **GET** `/api/dashboard`

Retorna um resumo completo das finanças do usuário autenticado.

**Headers:**
```
Authorization: Bearer {seu_token_jwt}
```

**Resposta de Sucesso (200):**
```json
{
  "totalIncome": 5000.00,
  "totalExpense": 2345.50,
  "balance": 2654.50,
  "summaryData": [
    {
      "type": "INCOME",
      "_sum": {
        "amount": 5000.00
      }
    },
    {
      "type": "EXPENSE",
      "_sum": {
        "amount": 2345.50
      }
    }
  ]
}
```

**Erros Possíveis:**
- `401` - Token inválido ou ausente
- `500` - Erro interno do servidor

---

### Análise Inteligente

#### **GET** `/api/analysis`

Gera uma análise inteligente dos padrões de gastos do usuário utilizando Google Gemini AI.

**Headers:**
```
Authorization: Bearer {seu_token_jwt}
```

**Resposta de Sucesso (200):**
```json
{
  "analysis": {
    "resumo": "Você teve 15 transações nos últimos 60 dias, com total de gastos de R$ 2.345,50 e receitas de R$ 5.000,00, resultando em saldo positivo de R$ 2.654,50.",
    "ponto_positivo": "Seu saldo está positivo e você mantém controle regular das suas finanças.",
    "ponto_de_atencao": "Gastos com MERCADO representam 27% do total, considere revisar esse padrão.",
    "analise_de_padroes": [
      "Gastos concentrados em MERCADO (35% do total de despesas)",
      "Uso frequente de cartão de crédito em pequenas compras",
      "Padrão de gastos estável ao longo do período"
    ],
    "conselhos": [
      "Planeje compras de mercado semanalmente para evitar idas frequentes e gastos extras",
      "Considere usar PIX para compras menores para melhor controle do fluxo de caixa",
      "Aproveite o saldo positivo para começar uma reserva de emergência"
    ],
    "plano_de_emergencia": [
      "Esta semana: revise todos os gastos com cartão de crédito e cancele assinaturas não utilizadas",
      "Próximas 2 semanas: reduza em 20% os gastos com COMIDA_FORA fazendo mais refeições em casa",
      "Resto do mês: estabeleça um limite diário de R$ 50 para gastos variáveis"
    ]
  }
}
```

**Observações:**
- A análise é baseada nas transações dos **últimos 60 dias**
- Se não houver transações, retorna: `{ "message": "Nenhuma transação encontrada nos últimos 60 dias." }`
- O formato JSON é gerado por IA (Google Gemini 2.5 Flash) e pode variar ligeiramente

**Erros Possíveis:**
- `401` - Token inválido ou ausente
- `500` - Erro ao gerar análise ou erro interno do servidor

---

### Screenshots

> 📸

---

## 🚀 Como Executar

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **PostgreSQL** (versão 14 ou superior)
- **Git**
- **Conta no Google AI Studio** (para obter GEMINI_API_KEY)

### Scripts disponíveis

```bash
npm run dev                    # Inicia em modo desenvolvimento (nodemon)
npm run prisma:generate        # Gera o Prisma Client
npm run prisma:migrate         # Executa migrações do banco
npm run prisma:studio          # Abre interface visual do banco
npm run prisma:status          # Verifica status das migrações
npm run generate:transactions  # Gera transações de exemplo
```

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **[Node.js](https://nodejs.org/)** - Runtime JavaScript
- **[Express.js](https://expressjs.com/)** - Framework web minimalista
- **[Prisma ORM](https://www.prisma.io/)** - ORM moderno para Node.js e TypeScript

### Banco de Dados
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional

### Autenticação e Segurança
- **[JWT (jsonwebtoken)](https://github.com/auth0/node-jsonwebtoken)** - Autenticação via tokens
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Hash de senhas
- **[Helmet.js](https://helmetjs.github.io/)** - Segurança de headers HTTP
- **[express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)** - Rate limiting
- **[express-mongo-sanitize](https://github.com/fiznool/express-mongo-sanitize)** - Sanitização de dados

### Validação
- **[Express Validator](https://express-validator.github.io/)** - Validação de requisições

### IA e Análise
- **[Google Generative AI](https://ai.google.dev/)** - API do Google Gemini para análises inteligentes

### Utilitários
- **[dotenv](https://github.com/motdotla/dotenv)** - Gerenciamento de variáveis de ambiente
- **[nodemon](https://nodemon.io/)** - Auto-reload em desenvolvimento

---

## 📝 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  Desenvolvido com ☕ por <a href="https://github.com/JohnVitor-Dev">John Vitor</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
</p>
