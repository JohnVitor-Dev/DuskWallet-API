import { body, validationResult } from 'express-validator';

export const validationRegisterUser = [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('name').notEmpty().isString().withMessage('Nome é obrigatório')
];

export const validationLoginUser = [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória')
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