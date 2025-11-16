import { prisma } from "../prismaClient.js";
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const getAnalysis = async (req, res, next) => {
    try {
        const userId = req.userID;
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
            return res.status(200).json({ message: "Nenhuma transação encontrada nos últimos 60 dias." });
        }

        const transactionsText = recentTransactions.map(t => {
            return `Descrição: ${t.description}, Valor: ${t.amount}, Tipo: ${t.type}, Categoria: ${t.category}, Data: ${t.date.toISOString().split('T')[0]}`;
        }).join('\n');

        const prompt = `
        Você é "DuskWallet", um assistente financeiro especialista em análise comportamental com personalidade amigável baseado em transações reais. Fale como alguém próximo, que entende a rotina do usuário e explica tudo de forma simples, direta e leve, sem formalidade excessiva.

        Seu papel:
        - Interpretar as transações do usuário como um consultor financeiro.
        - Identificar padrões, riscos, pontos positivos e oportunidades.
        - Comentar os padrões de comportamento financeiro de forma humana e prática.
        - Ser objetivo, direto, prático e 100% coerente com os dados fornecidos.
        - Ensinar o usuário como melhorar de forma simples e útil.
        - Basear cada afirmação, alerta ou elogio em um dado real da lista.
        - NUNCA inventar valores, categorias ou transações.

        IMPORTANTE:
        Retorne EXCLUSIVAMENTE um JSON válido, seguindo este formato:

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

        REGRAS DA ANÁLISE:
        1. Baseie seu texto exclusivamente nas transações fornecidas.
        2. Observe:
        - categorias que mais aparecem
        - gastos pequenos repetidos ("gastos invisíveis")
        - picos de gasto em sequência
        - períodos sem gastos
        - equilíbrio entre entradas e saídas
        - uso de crédito vs PIX/débito
        - frequência de gastos por tipo de categoria
        - valores incomuns (muito altos ou baixos)
        - tendências de crescimento/queda em categorias

        3. NÃO USE MARKDOWN.
        4. NÃO USE tópicos numerados fora do JSON.
        5. Os conselhos devem ser praticáveis, simples e específicos.
        6. Não dê respostas genéricas como "controle seus gastos".
        7. Sempre relacione o conselho a algum comportamento real detectado.
        8. Seja conciso. Máximo 2–3 frases por campo.
        9. Não fale como “o usuário”. Fale como “você”, sempre.
        10. Evite linguagem técnica demais.
        11. O tom deve ser: amigável, leve, direto

        REGRAS PARA O PLANO DE EMERGÊNCIA:
        - Só gere o plano se houver sinais de desequilíbrio (muitas saídas, uso forte de crédito, ausência de entradas, gastos muito concentrados, risco de fatura, etc.).
        - O plano deve ter 3–4 passos curtos, diretos e totalmente baseados nas transações.
        - Cada passo deve explicar exatamente o que fazer HOJE, nesta semana e no resto do mês.
        - O texto deve ser simples, prático e completamente conectado aos comportamentos encontrados.
        - Deve citar informações reais das transações, como categorias, frequência, valores aproximados ou uso de crédito/debito.
        - Se não houver sinal de dívida, gere um plano de prevenção pequeno.
        - Não ultrapassar 3 frases no total.

        Aqui estão as transações do usuário:
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
                    next(new Error("Não foi possível obter uma resposta válida da IA após múltiplas tentativas."));
                    return;
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (!jsonAnalysis) {
            next(new Error("Erro inesperado ao gerar análise"));
            return;
        }

        res.status(200).json({ analysis: jsonAnalysis });

    } catch (error) {
        next(error);
    }
};