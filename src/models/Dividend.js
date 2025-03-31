import mongoose from "mongoose"

const dividendSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    symbol: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true }
})

const dividend = mongoose.model("dividends", dividendSchema)

export { dividend, dividendSchema }