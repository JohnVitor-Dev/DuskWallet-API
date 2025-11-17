import { PrismaClient } from '@prisma/client';

// Singleton para evitar múltiplas instâncias em serverless
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Tratamento de desconexão graceful
if (process.env.NODE_ENV !== 'production') {
    const gracefulShutdown = async () => {
        await prisma.$disconnect();
        process.exit(0);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
}

export { prisma };