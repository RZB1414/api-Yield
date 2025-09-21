import mongoose from "mongoose";

const holdingsHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  symbol: { type: String, required: true }, // encrypted
  symbolHash: { type: String, required: true },
  quantity: { type: String, required: true }, // encrypted numeric as string
  averagePrice: { type: String, required: true }, // encrypted numeric as string
  validFrom: { type: Date, required: true },
  validTo: { type: Date, default: null }, // null = vigente até o presente
  createdAt: { type: Date, default: Date.now }
});

holdingsHistorySchema.index({ userId: 1, symbolHash: 1, validFrom: 1 });
holdingsHistorySchema.index({ userId: 1, symbolHash: 1, validTo: 1 });

const HoldingsHistory = mongoose.model("holdings_history", holdingsHistorySchema);

export { HoldingsHistory, holdingsHistorySchema };
