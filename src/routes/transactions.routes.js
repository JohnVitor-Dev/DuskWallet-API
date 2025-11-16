import express from "express";
import { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction } from "../controllers/transactions.controller.js";
import {
    validationCreateTransaction,
    validationUpdateTransaction,
    validationTransactionId,
    validate
} from "../middlewares/validation.js";

const router = express.Router();

router.post('/', validationCreateTransaction, validate, createTransaction);
router.get('/', getTransactions);
router.get('/:id', validationTransactionId, validate, getTransactionById);
router.put('/:id', validationUpdateTransaction, validate, updateTransaction);
router.delete('/:id', validationTransactionId, validate, deleteTransaction);

export default router;