import mongoose from "mongoose"
import { brokerSchema } from "./Broker.js"
import { userSchema } from "./User.js"

const totalValueBrokerSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    date: { type: Date, required: true, default: Date.now },
    currency: { type: String, required: true },
    totalValueInUSD: { type: Number },
    totalValueInBRL: { type: Number },
    broker: brokerSchema,
    userId: { type: userSchema, required: true }
})

// Índice único para garantir apenas uma entrada por corretora e mês
totalValueBrokerSchema.index(
    { "broker._id": 1, date: 1 },
    { unique: true }
)

const totalValueBroker = mongoose.model("totalValueBrokers", totalValueBrokerSchema)
export { totalValueBroker, totalValueBrokerSchema }