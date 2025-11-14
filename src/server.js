import 'dotenv/config';
import express from 'express';
import { prisma } from './prismaClient.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authMiddleware } from './middlewares/authMiddleware.js';

import authRoute from './routes/auth.routes.js';
import transactionRoute from './routes/transactions.routes.js';
import dashboardRoute from './routes/dashboard.routes.js';
import analysisRoute from './routes/analysis.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Usar JSON
app.use(express.json());

// Rotas
app.use('/api/auth', authRoute);
app.use('/api/transactions', authMiddleware, transactionRoute);
app.use('/api/dashboard', authMiddleware, dashboardRoute)
app.use('/api/analysis', authMiddleware, analysisRoute);

// Tratamento de erros
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;