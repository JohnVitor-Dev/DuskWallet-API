import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Token de autenticação não fornecido" });
    }

    // Validar formato do header
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Formato de token inválido. Use: Bearer <token>" });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token.trim() === '') {
        return res.status(401).json({ error: "Token de autenticação inválido" });
    }

    try {
        const secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        req.userID = decoded.userID;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token de autenticação inválido" });
    }
}