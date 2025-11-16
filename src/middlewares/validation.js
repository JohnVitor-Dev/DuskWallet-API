import { body, param, query, validationResult } from 'express-validator';

// Validações de Autenticação
export const validationRegisterUser = [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('name').notEmpty().isString().withMessage('Nome é obrigatório')
];

export const validationLoginUser = [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória')
];

// Validações de Transações
export const validationCreateTransaction = [
    body('description')
        .notEmpty().withMessage('Descrição é obrigatória')
        .isString().withMessage('Descrição deve ser texto')
        .trim()
        .isLength({ min: 3, max: 200 }).withMessage('Descrição deve ter entre 3 e 200 caracteres'),

    body('amount')
        .notEmpty().withMessage('Valor é obrigatório')
        .isFloat({ gt: 0 }).withMessage('Valor deve ser um número positivo maior que zero'),

    body('type')
        .notEmpty().withMessage('Tipo é obrigatório')
        .isIn(['INCOME', 'EXPENSE']).withMessage('Tipo deve ser INCOME ou EXPENSE'),

    body('category')
        .notEmpty().withMessage('Categoria é obrigatória')
        .isIn([
            'MORADIA', 'CONTAS', 'MERCADO', 'COMIDA_FORA', 'TRANSPORTE',
            'SAUDE', 'EDUCACAO', 'LAZER', 'COMPRAS', 'DIVIDAS',
            'INVESTIMENTOS', 'SALARIO', 'OUTRAS_RECEITAS', 'OUTROS'
        ]).withMessage('Categoria inválida'),

    body('paymentMethod')
        .notEmpty().withMessage('Forma de pagamento é obrigatória')
        .isIn(['DINHEIRO', 'PIX', 'CREDITO']).withMessage('Forma de pagamento deve ser DINHEIRO, PIX ou CREDITO')
];

export const validationUpdateTransaction = [
    param('id')
        .notEmpty().withMessage('ID da transação é obrigatório')
        .isString().withMessage('ID deve ser uma string válida'),

    body('description')
        .optional()
        .isString().withMessage('Descrição deve ser texto')
        .trim()
        .isLength({ min: 3, max: 200 }).withMessage('Descrição deve ter entre 3 e 200 caracteres'),

    body('amount')
        .optional()
        .isFloat({ gt: 0 }).withMessage('Valor deve ser um número positivo maior que zero'),

    body('type')
        .optional()
        .isIn(['INCOME', 'EXPENSE']).withMessage('Tipo deve ser INCOME ou EXPENSE'),

    body('category')
        .optional()
        .isIn([
            'MORADIA', 'CONTAS', 'MERCADO', 'COMIDA_FORA', 'TRANSPORTE',
            'SAUDE', 'EDUCACAO', 'LAZER', 'COMPRAS', 'DIVIDAS',
            'INVESTIMENTOS', 'SALARIO', 'OUTRAS_RECEITAS', 'OUTROS'
        ]).withMessage('Categoria inválida'),

    body('paymentMethod')
        .optional()
        .isIn(['DINHEIRO', 'PIX', 'CREDITO']).withMessage('Forma de pagamento deve ser DINHEIRO, PIX ou CREDITO')
];

export const validationTransactionId = [
    param('id')
        .notEmpty().withMessage('ID da transação é obrigatório')
        .isString().withMessage('ID deve ser uma string válida')
];

export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const extractedErrors = {};
        errors.array().map(err => {
            extractedErrors[err.path] = err.msg;
        });
        return res.status(400).json({ errors: extractedErrors });
    }

    next();
}