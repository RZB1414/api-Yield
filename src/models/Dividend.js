import mongoose from "mongoose"

const dividendSchema = new mongoose.Schema({
    movimentacao: { type: String, required: true },
    liquidacao: { type: String, required: true },
    lancamento: { type: String, required: true },
    valor: { type: Number, required: true },
    ticker: { type: String, required: true }
})

// Define um índice único para evitar duplicação
dividendSchema.index(
    { movimentacao: 1, liquidacao: 1, lancamento: 1, valor: 1, ticker: 1 },
    { unique: true }
);

const dividend = mongoose.model("dividends", dividendSchema)

export { dividend, dividendSchema }