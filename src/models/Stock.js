import mongoose from "mongoose"

const stockSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    symbol: { type: String, required: true },
    currency: { type: String, required: true },
<<<<<<< HEAD
    averagePrice: { type: Number, required: true }
=======
    avaragePrice: { type: Number, required: true }
>>>>>>> 25454c4819959b4b786f4306c5993e2bdc488ef2
})

const stock = mongoose.model("stocks", stockSchema)

export { stock, stockSchema }