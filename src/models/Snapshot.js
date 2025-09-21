import mongoose from "mongoose";

const snapshotSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  symbol: { type: String, required: true }, // encrypted
  symbolHash: { type: String, required: true },
  currency: { type: String, required: true }, // encrypted
  closePrice: { type: String, required: true }, // encrypted numeric as string
  dayChange: { type: String, required: true }, // encrypted numeric as string
  dayChangePercent: { type: String, required: true }, // encrypted numeric as string
  tradingDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

snapshotSchema.index({ userId: 1, symbolHash: 1, tradingDate: 1 }, { unique: true });

const Snapshot = mongoose.model("snapshots", snapshotSchema);

export { Snapshot, snapshotSchema };