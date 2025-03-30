import mongoose from "mongoose"

const stockSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    symbol: { type: String, required: true },
    currency: { type: String, required: true },
    avaragePrice: { type: Number, required: true }
})

const stock = mongoose.model("stocks", stockSchema)

export { stock, stockSchema }