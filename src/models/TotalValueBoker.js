import mongoose from "mongoose"
import { brokerSchema } from "./Broker.js"

const totalValueBrokerSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    date: { type: Date, required: true, default: Date.now },
    currency: { type: String, required: true },
    totalValueInUSD: { type: Number, required: true },
    totalValueInBRL: { type: Number, required: true },
    broker: brokerSchema
})

const totalValueBroker = mongoose.model("totalValueBrokers", totalValueBrokerSchema)
export { totalValueBroker, totalValueBrokerSchema }