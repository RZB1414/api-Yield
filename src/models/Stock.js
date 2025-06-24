import mongoose from "mongoose"
import { userSchema } from "./User.js"

const stockSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    symbol: { type: String, required: true },
    currency: { type: String, required: true },
    averagePrice: { type: Number },
    stocksQuantity: { type: Number },
    userId: { type: userSchema, required: true }
})

const stock = mongoose.model("stocks", stockSchema)

export { stock, stockSchema }