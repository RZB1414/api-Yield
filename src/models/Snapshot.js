import mongoose from "mongoose";

const snapshotSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  symbol: { type: String, required: true, index: true },
  currency: { type: String, required: true },
  closePrice: { type: Number, required: true },
  dayChange: { type: Number, required: true },
  dayChangePercent: { type: Number, required: true },
  tradingDate: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

snapshotSchema.index({ userId: 1, symbol: 1, tradingDate: 1 }, { unique: true });

const Snapshot = mongoose.model("snapshots", snapshotSchema);

export { Snapshot, snapshotSchema };