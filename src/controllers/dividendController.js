import { dividend } from "../models/dividend.js";
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

            // Agrupa os dados pelo campo "ticker" e soma os valores de "valor"
            // Soma valores de Ações e Fiis com o mesmo ticker
            const groupedData = {};
            dataFiltered.forEach(row => {
                // Remove números do final do ticker para normalizar
                const normalizedTicker = row.ticker.replace(/[0-9]+$/, "");

                if (!groupedData[normalizedTicker]) {
                    groupedData[normalizedTicker] = {
                        ticker: normalizedTicker,
                        valor: 0 // Inicializa o valor como 0
                    };
                }
                // Soma os valores e limita as casas decimais a 2
                groupedData[normalizedTicker].valor = parseFloat(
                    (groupedData[normalizedTicker].valor + row.valor).toFixed(2)
                );
            });

            // Converte o objeto agrupado de volta para um array
            const groupedArray = Object.values(groupedData);

            // Chama o método saveData para salvar os dados processados
            const saveResult = await DividendController.saveData({
                body: {
                    otherData: otherData,
                    stocksAndReits: dataFiltered
                }
            });

            // Retorna os dados como JSON
            res.status(200).json({ message: saveResult, otherData: otherData, stocksAndReits: dataFiltered });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Erro ao processar o arquivo." });
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
            const { otherData, stocksAndReits } = req.body;

            // Salva os dados no banco de dados
            await dividend.insertMany(otherData, { ordered: false }); // `ordered: false` permite continuar mesmo se houver duplicados
            await dividend.insertMany(stocksAndReits, { ordered: false });

            return{ message: "Dados salvos com sucesso!" };
        } catch (error) {
            console.error(error);
            return ("Erro ao salvar os dados.", error);
        }
    }

}

export default DividendController