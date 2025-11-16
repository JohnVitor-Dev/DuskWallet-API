import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tratamento de desconexão graceful
const gracefulShutdown = async () => {
    await prisma.$disconnect();
    process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});

export { prisma };