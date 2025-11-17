import { prisma } from "../prismaClient.js";

export const createTransaction = async (req, res, next) => {
    const { description, amount, type, category, paymentMethod, date } = req.body;
    const userID = req.userID;

    if (!userID) {
        return res.status(401).json({ error: "Usuário não autenticado" });
    }

    try {
        const transaction = await prisma.transaction.create({
            data: {
                description,
                amount,
                type,
                category,
                paymentMethod,
                userId: userID,
                ...(date && { date: new Date(date) })
            }
        });

        res.status(201).json({ message: "Transação criada com sucesso", transaction });

    } catch (error) {
        next(error);
    }
};

export const getTransactions = async (req, res, next) => {
    const userID = req.userID;

    if (!userID) {
        return res.status(401).json({ error: "Usuário não autenticado" });
    }

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

    if (!userID) {
        return res.status(401).json({ error: "Usuário não autenticado" });
    }

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
    const { description, amount, type, category, paymentMethod, date } = req.body;
    const userID = req.userID;

    if (!userID) {
        return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = amount;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (date !== undefined) updateData.date = new Date(date);

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "Nenhum campo para atualizar foi fornecido" });
    }

    try {
        const transaction = await prisma.transaction.updateMany({
            where: { id: id, userId: userID },
            data: updateData
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

    if (!userID) {
        return res.status(401).json({ error: "Usuário não autenticado" });
    }

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

