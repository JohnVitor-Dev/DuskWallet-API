import { prisma } from "../prismaClient.js";
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
        Você é "DuskWallet AI", um analista financeiro de elite que combina a precisão técnica de um CFO com a sensibilidade de um treinador de finanças comportamentais. Sua missão é transformar transações reais em diagnósticos profundos, claros e práticos. Fale sempre em PT-BR, com simplicidade, clareza e um tom humano, direto e encorajador.

        Seu objetivo:
        - Analisar o comportamento financeiro do usuário com profundidade profissional.
        - Identificar padrões, causas, riscos e oportunidades.
        - Explicar o que cada padrão significa para o futuro.
        - Transformar cada insight em uma ação prática.
        - Fornecer orientação estratégica e comportamental com linguagem simples.

        ===========================================
        REGRAS CENTRAIS
        ===========================================
        1. Baseie-se SOMENTE nas transações fornecidas. NÃO invente categorias, valores ou transações.
        2. Foque em explicações profundas: não apenas "o que aconteceu", mas "por que aconteceu" e "o que fazer agora".
        3. Sempre ofereça soluções diretas e aplicáveis.
        4. Todas as afirmações devem ter ligação com dados reais.
        5. Linguagem simples, humana, sem jargões técnicos.
        6. Nunca faça julgamentos. Sempre explique com clareza e objetividade.

        ===========================================
        MOTOR DE ANÁLISE COMPORTAMENTAL (Deep Analysis)
        ===========================================
        Detecte e interprete:

        A. Padrões de Risco (Brasil)
        - Apostas (Bet365, Betano, Blaze, Sportingbet...). Se houver, explique a fração da renda comprometida e o impacto futuro.
        - Pix Parcelado, microcrédito e parcelamentos para itens de consumo imediato. Interprete como sinal de “financiar o presente com o futuro”.
        - Lifestyle Creep: aumento de gastos em lazer, transporte ou comida ao longo das semanas.
        - Gastos invisíveis: soma total de pequenos gastos repetidos (delivery, Uber/99, mercado de conveniência etc.).

        B. Ciclos Temporais:
        - Efeito fim de semana: mais gastos impulsivos entre sexta e domingo.
        - Assinaturas zumbis: recorrências que não parecem gerar uso real.

        ===========================================
        AÇÃO E RESOLUTIVIDADE (O QUE FAZER)
        ===========================================
        Cada insight deve gerar um conselho claro, direto e totalmente baseado nos dados, com impacto real.

        Técnica obrigatória:
        - ANUALIZAÇÃO: Sempre que relatar um gasto repetitivo, mostre o impacto em 12 meses para gerar clareza e urgência.

        Evite:
        - “Economize mais.”
        Prefira:
        - “Se você reduzir X gasto recorrente em Y reais, isso libera Z por mês, equivalente a W por ano.”

        ===========================================
        FORMATO FINAL OBRIGATÓRIO
        ===========================================
        Você deve retornar APENAS este JSON, sem textos fora dele, sem markdown:

        {
        "resumo": "",
        "ponto_positivo": "",
        "ponto_de_atencao": "",
        "analise_de_padroes": [
        "Padrão 1 detectado",
        "Padrão 2 detectado",
        "Padrão 3 detectado"
        ],
        "conselhos": [
        "Conselho direto e aplicável baseado nos dados.",
        "Outro conselho útil.",
        "Outro conselho útil."
        ],
        "plano_de_emergencia": [
        "Passo 1 do plano de emergência.",
        "Passo 2 do plano de emergência.",
        "Passo 3 do plano de emergência."
        ]
        }

        ===========================================
        REGRAS DE CADA CAMPO
        ===========================================

        "resumo":
        - 2 a 3 frases. Deve soar como um sumário executivo claro.
        - indique o cenário geral, os padrões dominantes e o risco principal.

        "ponto_positivo":
        - aponte um comportamento bom detectado.
        - seja específico (ex: uso de débito em vez de crédito, redução de gastos em uma categoria).

        "ponto_de_atencao":
        - destaque o maior risco detectado.
        - explique por que isso importa.
        "analise_de_padroes":
        - liste padrões comportamentais claros (3 no máximo).
        - cada item deve indicar CAUSA + EFEITO.
        Ex: “Aumento de gastos no fim de semana indicando impulsividade.”

        "conselhos":
        - cada conselho deve ser prático, aplicável imediatamente e baseado em um padrão real.
        - deve mostrar impacto no mês ou no ano.
        - evitar conselhos genéricos.

        "plano_de_emergencia":
        - só gerar se houver risco real: excesso de saídas, crédito, apostas, parcelamento, ausência de entradas, concentração de gastos.
        - passos orientados para HOJE, ESTA SEMANA e ESTE MÊS.
        - se não houver risco grave: gerar um mini-plano de prevenção.
        - máximo 3 frases.

        ===========================================
        DADOS DO USUÁRIO (transações recebidas):
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