import { dividend } from "../models/Dividend.js";
import XLSX from "xlsx"

class DividendController {

    static async readFile(req, res) {
        try {
            // Verifica se o arquivo foi enviado
            if (!req.file) {
                return res.status(400).json({ error: "Nenhum arquivo enviado." });
            }

            // Lê o arquivo XLSX da memória
            const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // Converte os dados da planilha para JSON
            let data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            let dataMapped

            // Renomeia as colunas para os nomes corretos e converte datas
            dataMapped = data.map(row => ({
                movimentacao: DividendController.convertExcelDate(row["Movimentação"] || row["__EMPTY"]),
                liquidacao: DividendController.convertExcelDate(row["Liquidação"] || row["__EMPTY_1"]),
                lancamento: row["Lançamento"] || row["__EMPTY_2"],
                valor: parseFloat(row["Valor (R$)"] || row["__EMPTY_4"]) || 0, // Converte para número
                ticker: DividendController.extractTicker(row["Lançamento"] || row["__EMPTY_2"]) // Extrai o ticker
            }));

            // Mapeamento de lançamentos permitidos para seus respectivos tickers
            const lancamentoToTicker = {
                "RETIRADA EM C/C": "TED RETIRADA",
                "RECEBIMENTO DE TED - SPB": "TED RECEBIDO",
                "Pgto Juros": "RENDIMENTO RENDA FIXA",
                "PIS E COFINS S/ MULTA": "PIS E COFINS",
                "MULTA S/ SALDO DEVEDOR EM C/C NO DIA ANTERIOR": "MULTA SALDO NEGATIVO",
                "Pagamento para BANCO XP S/A": "CARTAO DE CREDITO",
                "RESGATE Trend Investback FIC FIRF Simples": "CASHBACK CARTAO",
                "IOF S/RESGATE FUNDOS Trend Investback FIC FIRF Simples": "IOF CASHBACK CARTAO",
                "Transferência enviada para a conta digital": "TRANSF ENVIADA CONTA DIGITAL",
                "Transferência recebida da conta digital": "TRANSF RECEBIDA CONTA DIGITAL"
            };

            // Lista de tipos de lançamentos permitidos
            const allowedLancamentos = Object.keys(lancamentoToTicker);

            // Converte os dados da planilha para JSON e filtra apenas os lançamentos permitidos
            let otherData = dataMapped.filter(row => {
                const lancamento = (row["lancamento"] || row["__EMPTY_2"] || "").trim().toUpperCase(); // Normaliza o valor
                const matchedLancamento = allowedLancamentos.find(allowed => lancamento.includes(allowed.toUpperCase())); // Verifica se contém algum valor permitido
                if (matchedLancamento) {
                    row.ticker = lancamentoToTicker[matchedLancamento]; // Adiciona o ticker correspondente
                    return true;
                }
                return false;
            });

            // Filtra os dados para eliminar linhas que não contêm todos os campos necessários
            const dataFiltered = dataMapped.filter(row =>
                row.movimentacao &&
                row.lancamento &&
                row.valor &&
                row.ticker && // Certifica-se de que o ticker foi extraído
                row.movimentacao !== "Movimentação" && // Ignora cabeçalhos
                row.liquidacao !== "Liquidação" &&
                row.lancamento !== "Lançamento" &&
                row.valor !== "Valor (R$)" &&
                row.ticker !== "Ticker"
            )

            // Simula o req.body com dataFiltered
            const simulatedReq = { body: { stocksAndReits: dataFiltered } };

            // Chama o método saveData passando o simulatedReq
            const saveResult = await DividendController.saveData(simulatedReq);

            res.status(200).json({ saveResult })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao processar o arquivo." });
        }
    }

    // Função para converter datas do Excel para o formato legível
    static convertExcelDate(excelDate) {
        if (typeof excelDate === "number") {
            const date = XLSX.SSF.parse_date_code(excelDate);
            return `${date.d.toString().padStart(2, "0")}/${date.m.toString().padStart(2, "0")}/${date.y}`;
        }
        return excelDate; // Retorna o valor original se não for um número
    }

    // Função para extrair o ticker do campo "lancamento"
    static extractTicker(lancamento) {
        // Lista de palavras que não devem ser consideradas tickers
        const blacklist = ["CBLC", "IRRF", "FIRF"];

        // Regex para capturar tickers com ou sem números (ex.: "PETR4", "VALE", etc.)
        const tickerRegex = /\b[A-Z]{4}[0-9]{0,2}\b/g;

        // Procura todos os possíveis tickers na string
        const matches = lancamento.match(tickerRegex);

        if (matches) {
            // Retorna o primeiro ticker que não está na blacklist
            for (const match of matches) {
                if (!blacklist.includes(match)) {
                    return match; // Retorna o ticker válido
                }
            }
        }

        // Caso nenhum ticker seja encontrado, verifica o padrão "BR" seguido por letras e números
        const brTickerRegex = /BR([A-Z]{4}[0-9]{0,2})/;
        const brMatch = lancamento.match(brTickerRegex);
        if (brMatch) {
            return brMatch[1]; // Retorna o ticker encontrado após "BR"
        }

        return null; // Retorna null se nenhum ticker válido for encontrado
    }

    static async saveData(req, res) {
        try {
            const { stocksAndReits } = req.body;

            // Função para converter datas no formato dd/mm/yyyy para objetos Date
            const parseDate = (dateString) => {
                const [day, month, year] = dateString.split('/').map(Number);
                return new Date(year, month - 1, day);
            };

            const parsedData = stocksAndReits.map(item => ({
                ...item,
                movimentacao: parseDate(item.movimentacao), // Converte movimentacao para Date
                liquidacao: parseDate(item.liquidacao)     // Converte liquidacao para Date
            }));

            // Insere os dados diretamente no banco de dados
            const result = await dividend.insertMany(parsedData, { ordered: false });

            return { message: "Dados salvos com sucesso!", result: result };
        } catch (error) {
            console.error("Erro ao salvar os dados:", error);
            return { message: "Erro ao salvar os dados.", error: error.errorResponse.writeErrors.map(e => e.err.op) };
        }

    }

    static async getAllDividends(req, res) {
        try {
            const data = await dividend.find({});
            if (data.length === 0) {
                return res.status(404).json({ message: "Nenhum dado encontrado." });
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao buscar os dados." });
        }
    }

    static async getByTicker(req, res) {
        try {
            const { ticker } = req.params;
            const data = await dividend.find({ ticker: ticker });
            if (data.length === 0) {
                return res.status(404).json({ message: "Nenhum dado encontrado para o ticker fornecido." });
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao buscar os dados." });
        }
    }

    static async getByDate(req, res) {
        try {
            const { startDate, endDate } = req.query;

            // Verifica se as datas foram fornecidas
            if (!startDate || !endDate) {
                return res.status(400).json({ error: "As datas de início e fim são obrigatórias." });
            }

            // Converte as strings de datas para objetos Date
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Verifica se as datas são válidas
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: "As datas fornecidas são inválidas." });
            }

            // Busca os dados no banco de dados entre as datas fornecidas
            const data = await dividend.find({
                movimentacao: {
                    $gte: start.toISOString().split('T')[0], // Converte para formato YYYY-MM-DD
                    $lte: end.toISOString().split('T')[0]   // Converte para formato YYYY-MM-DD
                }
            });

            // Verifica se algum dado foi encontrado
            if (data.length === 0) {
                return res.status(404).json({ message: "Nenhum dado encontrado para o intervalo de datas fornecido." });
            }

            // Retorna os dados encontrados
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao buscar os dados." });
        }
    }

}

export default DividendController