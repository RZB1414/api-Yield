import mongoose from "mongoose"
import { userSchema } from "./User.js"

const brokerSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    broker: { type: String, required: true },
    currency: { type: String, required: true },
    userId: { type: userSchema, required: true }
})

const broker = mongoose.model("brokers", brokerSchema)

export { broker, brokerSchema }