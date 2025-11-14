import { prisma } from "../prismaClient.js";

export const getAnalysis = async (req, res, next) => {
    try {
        const userId = req.userID;
        const date60DaysAgo = new Date();
        date60DaysAgo.setDate(date60DaysAgo.getDate() - 60);

        const recentTransactions = await prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: date60DaysAgo
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        if (recentTransactions.length === 0) {
            return res.status(200).json({ message: "Nenhuma transação encontrada nos últimos 60 dias." });
        }

        const analysisIA = `
Aqui está sua análise dos últimos 60 dias:

1.  **Visão Geral:** Você teve ${recentTransactions.length} transações recentes.
2.  **Padrão:** (Aqui a IA identificaria um padrão, ex: "Muitos gastos em Alimentação").
3.  **Conselho:** (Aqui a IA daria um conselho, ex: "Tente focar em reduzir X").
        `;

        res.status(200).json({ analysis: analysisIA });

    } catch (error) {
        next(error);
    }
};