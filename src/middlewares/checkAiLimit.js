import { prisma } from "../prismaClient.js";

export const checkAiLimit = async (req, res, next) => {
    try {
        const userId = req.userID;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                hasSubscription: true,
                aiAnalysisCount: true,
                lastAnalysisReset: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        if (user.hasSubscription) {
            return next();
        }

        const now = new Date();
        const daysSinceReset = Math.floor((now - new Date(user.lastAnalysisReset)) / (1000 * 60 * 60 * 24));

        if (daysSinceReset >= 7) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    aiAnalysisCount: 0,
                    lastAnalysisReset: now
                }
            });

            return next();
        }

        if (user.aiAnalysisCount >= 2) {
            const daysUntilReset = 7 - daysSinceReset;
            return res.status(403).json({
                message: "Limite de análises por IA atingido.",
                details: `Você já utilizou suas 2 análises gratuitas desta semana. Aguarde ${daysUntilReset} dia(s) para novas análises ou considere assinar o plano premium para acesso ilimitado.`,
                limitReached: true,
                daysUntilReset: daysUntilReset
            });
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                aiAnalysisCount: {
                    increment: 1
                }
            }
        });

        req.aiAnalysisRemaining = 2 - (user.aiAnalysisCount + 1);

        next();
    } catch (error) {
        next(error);
    }
};
