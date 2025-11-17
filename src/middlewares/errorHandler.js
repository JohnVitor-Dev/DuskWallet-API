export const errorHandler = (err, req, res, next) => {
    // Log detalhado do erro
    console.error('==================== ERRO ====================');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Path:', req.path);
    console.error('Method:', req.method);
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    console.error('==============================================');

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