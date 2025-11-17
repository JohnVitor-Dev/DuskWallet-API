import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { errorHandler } from './middlewares/errorHandler.js';
import { authMiddleware } from './middlewares/authMiddleware.js';

import authRoute from './routes/auth.routes.js';
import transactionRoute from './routes/transactions.routes.js';
import dashboardRoute from './routes/dashboard.routes.js';
import analysisRoute from './routes/analysis.routes.js';

// Validar variáveis de ambiente (não usar process.exit na Vercel)
if (!process.env.JWT_SECRET) {
    console.error('❌ ERRO CRÍTICO: JWT_SECRET não está definido no arquivo .env');
}

if (!process.env.DATABASE_URL) {
    console.error('❌ ERRO CRÍTICO: DATABASE_URL não está definido no arquivo .env');
}

if (!process.env.GEMINI_API_KEY) {
    console.error('❌ ERRO CRÍTICO: GEMINI_API_KEY não está definido no arquivo .env');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Headers HTTP
app.use(helmet());

// Rate Limiting - Geral
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requisições por IP
    message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate Limiting - Rotas de autenticação
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas por IP
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicar rate limiter geral
app.use(generalLimiter);

// Sanitização de dados
app.use(mongoSanitize());

// Usar JSON com limite de tamanho
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rotas
app.use('/api/auth', authLimiter, authRoute);
app.use('/api/transactions', authMiddleware, transactionRoute);
app.use('/api/dashboard', authMiddleware, dashboardRoute)
app.use('/api/analysis', authMiddleware, analysisRoute);

// Tratamento de erros
app.use(errorHandler);

// Apenas inicia o servidor se não estiver na Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`✅ Server is running on http://localhost:${PORT}`);
        console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

export default app;