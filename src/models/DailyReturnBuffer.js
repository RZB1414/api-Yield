import mongoose from "mongoose";

const dailyReturnBufferSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  symbol: { type: String, required: true }, // criptografado
  symbolHash: { type: String, required: true, index: true },
  currency: { type: String }, // criptografado
  closePrice: { type: String }, // criptografado numérico como string
  dayChange: { type: String }, // criptografado
  dayChangePercent: { type: String }, // criptografado
  tradingDate: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

dailyReturnBufferSchema.index({ userId: 1, symbolHash: 1, tradingDate: 1 }, { unique: true });

const DailyReturnBuffer = mongoose.model("daily_return_buffer", dailyReturnBufferSchema);

export { DailyReturnBuffer, dailyReturnBufferSchema };
