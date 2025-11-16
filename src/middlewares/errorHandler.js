export const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.error('Erro detalhado:', err);
    } else {
        console.error('Erro:', err.message);
    }

    // Erros do Prisma
    if (err.code === 'P2002') {
        const field = err.meta?.target?.[0] || 'campo';
        return res.status(400).json({
            error: `${field} já está em uso.`
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            error: 'Registro não encontrado.'
        });
    }

    // Erros de validação
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Dados inválidos fornecidos.'
        });
    }

    // Erros de JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Token inválido.'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expirado.'
        });
    }

    // Erro genérico
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Erro interno do servidor'
    });
};