import 'dotenv/config';
import express from 'express';
import { prisma } from './prismaClient.js';
import { errorHandler } from './middlewares/errorHandler.js';

import authRoute from './routes/auth.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Usar JSON
app.use(express.json());

// Rotas
app.use('/api/auth', authRoute);

// Tratamento de erros
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;