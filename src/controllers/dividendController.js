
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

           // Renomeia as colunas para os nomes corretos e converte datas
           data = data.map(row => ({
            movimentacao: DividendController.convertExcelDate(row["Movimentação"] || row["__EMPTY"]),
            liquidacao: DividendController.convertExcelDate(row["Liquidação"] || row["__EMPTY_1"]),
            lancamento: row["Lançamento"] || row["__EMPTY_2"],
            valor: row["Valor (R$)"] || row["__EMPTY_4"],
            saldo: row["Saldo (R$)"] || row["__EMPTY_5"]
        }));

            // Retorna os dados como JSON
            res.status(200).json(data);
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
}

export default DividendController