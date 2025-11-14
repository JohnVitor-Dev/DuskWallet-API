import { prisma } from "../prismaClient.js";

export const createTransaction = async (req, res, next) => {
    const { description, amount, type, category } = req.body;
    const userID = req.userID;

    if (!description || !amount || !type || !category) {
        return res.status(400).json({ error: "Descrição, valor, tipo e categoria são obrigatórios" });
    }

    try {
        const transaction = await prisma.transaction.create({
            data: {
                description,
                amount,
                type,
                category,
                userId: userID
            }
        });

        res.status(201).json({ message: "Transação criada com sucesso", transaction });

    } catch (error) {
        next(error);
    }
};

export const getTransactions = async (req, res, next) => {
    const userID = req.userID;

    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: userID },
            orderBy: { date: 'desc' }
        });

        res.status(200).json({ transactions });

    } catch (error) {
        next(error);
    }

};

export const getTransactionById = async (req, res, next) => {
    const { id } = req.params;
    const userID = req.userID;

    try {
        const transaction = await prisma.transaction.findFirst({
            where: { id: id, userId: userID }
        });

        if (!transaction) {
            return res.status(404).json({ error: "Transação não encontrada" });
        }

        res.status(200).json({ transaction });
    } catch (error) {
        next(error);
    }
};

export const updateTransaction = async (req, res, next) => {
    const { id } = req.params;
    const { description, amount, type, category } = req.body;
    const userID = req.userID;

    try {
        const transaction = await prisma.transaction.updateMany({
            where: { id: id, userId: userID },
            data: {
                description,
                amount,
                type,
                category
            }
        });

        if (transaction.count === 0) {
            return res.status(404).json({ error: "Transação não encontrada" });
        }

        res.status(200).json({ message: "Transação atualizada com sucesso" });

    } catch (error) {
        next(error);
    }
};

export const deleteTransaction = async (req, res, next) => {
    const { id } = req.params;
    const userID = req.userID;

    try {
        const transaction = await prisma.transaction.deleteMany({
            where: { id: id, userId: userID }
        });

        if (transaction.count === 0) {
            return res.status(404).json({ error: "Transação não encontrada" });
        }

        res.status(200).json({ message: "Transação deletada com sucesso" });
    } catch (error) {
        next(error);
    }
};

