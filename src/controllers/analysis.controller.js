import { prisma } from "../prismaClient.js";
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export const getAnalysis = async (req, res, next) => {
    const userId = req.userID;

    const rollbackIncrement = async () => {
        if (req.userAiData && req.userAiData.incrementedInMiddleware && !req.userAiData.hasSubscription) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    aiAnalysisCount: {
                        decrement: 1
                    }
                }
            });
        }
    };

    try {
        const date60DaysAgo = new Date();
        date60DaysAgo.setDate(date60DaysAgo.getDate() - 60);

        const recentTransactions = await prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: date60DaysAgo
                }
            },
            orderBy: {
                date: 'desc'
            },
            select: {
                description: true,
                amount: true,
                type: true,
                category: true,
                paymentMethod: true,
                date: true
            }

        });

        if (recentTransactions.length === 0) {
            await rollbackIncrement();
            return res.status(200).json({ message: "Nenhuma transação encontrada nos últimos 60 dias." });
        }

        const transactionsText = recentTransactions.map(t => {
            return `Descrição: ${t.description}, Valor: ${t.amount}, Tipo: ${t.type}, Categoria: ${t.category}, Data: ${t.date.toISOString().split('T')[0]}`;
        }).join('\n');

        const prompt = `
        Você é a "DuskWallet AI", uma assistente financeira que explica tudo em português BR claro, simples e direto, como se estivesse conversando com um amigo. Nada de texto difícil, nada de termos técnicos. Frases curtas, diretas e fáceis de ler.

        ===========================================
        INSTRUÇÕES IMPORTANTES
        ===========================================
        1. Use SOMENTE as transações recebidas. Não invente dados.
        2. Explique sempre em linguagem simples, sem jargões.
        3. Seja direto: diga o que está bom, o que preocupa e o que o usuário pode fazer agora.
        4. Não julgue o usuário. Seja neutra e acolhedora.
        5. As respostas devem ser curtas e objetivas. Evite parágrafos muito longos.

        ===========================================
        PADRÕES QUE VOCÊ DEVE PROCURAR
        ===========================================
        - Gastos com apostas (Bet365, Betano, Blaze, Sportingbet etc.).
        - Pix parcelado, microcrédito ou parcelamentos para consumo imediato.
        - Aumento de gastos em lazer, transporte ou comida com o tempo.
        - Muitos pequenos gastos repetidos (delivery, Uber/99, mercado de conveniência).
        - Mais gastos no fim de semana (sexta a domingo).
        - Assinaturas recorrentes que parecem desnecessárias.

        Sempre que falar de gastos repetidos, mostre o impacto aproximado em 12 meses (ANUALIZAÇÃO), com números simples.

        ===========================================
        FORMATO EXATO DA RESPOSTA
        ===========================================
        Responda APENAS com um JSON VÁLIDO, sem texto antes ou depois. Não use markdown, não use blocos de código.

        O JSON deve ter EXATAMENTE esta estrutura:

        {
        "resumo": "Resumo em 2 ou 3 frases, simples e diretas, explicando a situação geral.",
        "ponto_positivo": "Um comportamento financeiro bom que você identificou, explicado de forma simples.",
        "ponto_de_atencao": "O maior ponto de atenção ou risco, explicado de forma simples.",
        "analise_de_padroes": [
            "Padrão 1: descrição simples de causa e efeito.",
            "Padrão 2: descrição simples de causa e efeito.",
            "Padrão 3: descrição simples de causa e efeito."
        ],
        "conselhos": [
            "Conselho prático 1, com exemplo de impacto mensal ou anual.",
            "Conselho prático 2, fácil de aplicar.",
            "Conselho prático 3, fácil de aplicar."
        ],
        "plano_de_emergencia": [
            "Passo 1 para hoje ou para esta semana.",
            "Passo 2 para esta semana.",
            "Passo 3 para este mês."
        ]
        }

        Regras:
        - Se não houver risco grave, o campo "plano_de_emergencia" deve ser um mini plano de prevenção (3 passos simples).
        - Se não houver muito o que falar em algum campo, escreva algo curto, mas nunca deixe o campo vazio.
        - Não adicione NENHUMA outra chave além das listadas acima.
        - Não use quebras de linha desnecessárias dentro das strings. Priorize frases curtas.

        ===========================================
        DADOS DO USUÁRIO (transações):
        ${transactionsText}
        `;

        const maxRetries = 3;
        let jsonAnalysis = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                let analysisText = response.text();

                analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

                jsonAnalysis = JSON.parse(analysisText);
                break;

            } catch (parseError) {
                console.error(`Tentativa ${attempt} falhou ao parsear JSON da IA`);

                if (attempt === maxRetries) {
                    console.error("Resposta da IA após todas as tentativas:", parseError.message);
                    await rollbackIncrement();
                    next(new Error("Não foi possível obter uma resposta válida da IA após múltiplas tentativas."));
                    return;
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (!jsonAnalysis) {
            await rollbackIncrement();
            next(new Error("Erro inesperado ao gerar análise"));
            return;
        }

        await prisma.analysis.create({
            data: {
                userId: userId,
                resumo: jsonAnalysis.resumo,
                pontoPositivo: jsonAnalysis.ponto_positivo,
                pontoDeAtencao: jsonAnalysis.ponto_de_atencao,
                analiseDePadroes: jsonAnalysis.analise_de_padroes,
                conselhos: jsonAnalysis.conselhos,
                planoDeEmergencia: jsonAnalysis.plano_de_emergencia
            }
        });

        const response = {
            analysis: jsonAnalysis
        };

        if (req.userAiData && !req.userAiData.hasSubscription) {
            const aiAnalysisRemaining = 2 - (req.userAiData.currentCount + 1);
            response.aiAnalysisRemaining = aiAnalysisRemaining;
            response.message = aiAnalysisRemaining === 0
                ? "Esta foi sua última análise gratuita da semana."
                : `Você tem ${aiAnalysisRemaining} análise(s) gratuita(s) restante(s) esta semana.`;
        }

        res.status(200).json(response);

    } catch (error) {
        await rollbackIncrement();
        next(error);
    }
};

export const getLastAnalysis = async (req, res, next) => {
    try {
        const userId = req.userID;

        const lastAnalysis = await prisma.analysis.findFirst({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!lastAnalysis) {
            return res.status(404).json({
                message: "Nenhuma análise encontrada. Gere sua primeira análise!"
            });
        }

        const response = {
            analysis: {
                resumo: lastAnalysis.resumo,
                ponto_positivo: lastAnalysis.pontoPositivo,
                ponto_de_atencao: lastAnalysis.pontoDeAtencao,
                analise_de_padroes: lastAnalysis.analiseDePadroes,
                conselhos: lastAnalysis.conselhos,
                plano_de_emergencia: lastAnalysis.planoDeEmergencia
            },
            createdAt: lastAnalysis.createdAt,
            isFromCache: true
        };

        res.status(200).json(response);

    } catch (error) {
        next(error);
    }
};

export const getAnalysisStatus = async (req, res, next) => {
    try {
        const userId = req.userID;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                hasSubscription: true,
                aiAnalysisCount: true,
                lastAnalysisReset: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        if (user.hasSubscription) {
            return res.status(200).json({
                hasSubscription: true,
                analysisRemaining: "unlimited",
                message: "Você tem acesso ilimitado às análises! ⭐"
            });
        }

        const now = new Date();
        const daysSinceReset = Math.floor((now - new Date(user.lastAnalysisReset)) / (1000 * 60 * 60 * 24));

        let analysisRemaining;
        let daysUntilReset;

        if (daysSinceReset >= 7) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    aiAnalysisCount: 0,
                    lastAnalysisReset: now
                }
            });
            analysisRemaining = 2;
            daysUntilReset = 0;
        } else {
            analysisRemaining = Math.max(0, 2 - user.aiAnalysisCount);
            daysUntilReset = 7 - daysSinceReset;
        }

        res.status(200).json({
            hasSubscription: false,
            analysisRemaining: analysisRemaining,
            maxAnalysisPerWeek: 2,
            daysUntilReset: daysUntilReset,
            message: analysisRemaining === 0
                ? `Limite atingido. Próximo reset em ${daysUntilReset} dia(s).`
                : `Você tem ${analysisRemaining} análise(s) gratuita(s) restante(s) esta semana.`
        });

    } catch (error) {
        next(error);
    }
};

export const getAnalysisHistory = async (req, res, next) => {
    try {
        const userId = req.userID;
        const limit = parseInt(req.query.limit) || 10; // Padrão: últimas 10 análises

        const analyses = await prisma.analysis.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            select: {
                id: true,
                createdAt: true,
                resumo: true // Apenas resumo para preview
            }
        });

        res.status(200).json({
            count: analyses.length,
            analyses: analyses
        });

    } catch (error) {
        next(error);
    }
};

export const getAnalysisById = async (req, res, next) => {
    try {
        const userId = req.userID;
        const { id } = req.params;

        const analysis = await prisma.analysis.findFirst({
            where: {
                id: id,
                userId: userId // Garante que só busca análises do próprio usuário
            }
        });

        if (!analysis) {
            return res.status(404).json({
                message: "Análise não encontrada."
            });
        }

        const response = {
            analysis: {
                resumo: analysis.resumo,
                ponto_positivo: analysis.pontoPositivo,
                ponto_de_atencao: analysis.pontoDeAtencao,
                analise_de_padroes: analysis.analiseDePadroes,
                conselhos: analysis.conselhos,
                plano_de_emergencia: analysis.planoDeEmergencia
            },
            createdAt: analysis.createdAt
        };

        res.status(200).json(response);

    } catch (error) {
        next(error);
    }
};