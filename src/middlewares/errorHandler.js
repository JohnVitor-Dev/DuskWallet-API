export const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err.code === 'P2002') {
        const field = err.meta?.target?.[0] || 'campo';

        return res.status(400).json({
            error: `${field} já está em uso.`
        });

    } else {
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};