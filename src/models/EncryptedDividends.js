import mongoose from "mongoose"

const encryptedDividendsSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    encryptedData: { type: String, required: true },
    salt: { type: String, required: true },
    iv: { type: String, required: true },
    hash: { type: String, required: true, unique: true }
})

// Define um índice único para evitar duplicação
encryptedDividendsSchema.index(
    { userId: 1, hash: 1 },
    { unique: true }
)

const encryptedDividends = mongoose.model("encryptedDividends", encryptedDividendsSchema)

export { encryptedDividends, encryptedDividendsSchema }