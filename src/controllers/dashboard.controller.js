import { prisma } from "../prismaClient.js";

export const getDashboardSummary = async (req, res, next) => {
    try {
        const userId = req.userID;
        const summary = await prisma.transaction.groupBy({
            by: ['type'],
            where: { userId },
            _sum: { amount: true },
        });

        let totalIncome = 0;
        let totalExpense = 0;

        const incomeData = summary.find(item => item.type === 'INCOME');
        if (incomeData) {
            totalIncome = incomeData._sum.amount || 0;
        }
        const expenseData = summary.find(item => item.type === 'EXPENSE');
        if (expenseData) {
            totalExpense = expenseData._sum.amount || 0;
        }

        const balance = totalIncome - totalExpense;
        res.status(200).json({ totalIncome, totalExpense, balance, summaryData: summary });
    } catch (error) {
        next(error);
    }
};