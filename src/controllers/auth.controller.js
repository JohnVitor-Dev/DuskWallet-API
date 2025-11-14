import bcrypt from "bcryptjs";
import { prisma } from "../prismaClient.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res, next) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, senha e nome são obrigatórios" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword
            },
        });

        res.status(201).json({ message: "Usuário registrado com sucesso", user: newUser.email, name: newUser.name });

    } catch (error) {
        next(error);
    }

};

export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ error: "Email ou senha inválidos" });
        }

        const passwordIsValid = await bcrypt.compare(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({ error: "Email ou senha inválidos" });
        }

        const payload = { userID: user.id };
        const secret = process.env.JWT_SECRET;
        const token = jwt.sign(payload, secret, { expiresIn: "1h" });

        res.json({
            message: "Usuário logado com sucesso",
            token: token
        });

    } catch (error) {
        next(error);
    }
}