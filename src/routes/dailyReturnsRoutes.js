import express from 'express';
import CryptoJS from 'crypto-js';
import { DailyReturnBuffer } from '../models/DailyReturnBuffer.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();
const SECRET = process.env.CRYPTO_SECRET;

const encrypt = (val) => {
  if (val == null) return null;
  try { return CryptoJS.AES.encrypt(String(val), SECRET).toString(); } catch { return String(val); }
};
const sha = (s) => CryptoJS.SHA256(s).toString(CryptoJS.enc.Hex);

const normalizeStoredSymbol = (symbol, currency) => {
  if (!symbol) return '';
  const up = symbol.toUpperCase().trim();
  if (currency && currency.toUpperCase() === 'BRL' && up.endsWith('.SA')) return up.slice(0, -3);
  return up;
};

// POST /daily-returns (aceita 1 ou N itens)
// item: { symbol, currency, closePrice, dayChange, dayChangePercent, prevClose? }
router.post('/daily-returns', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const items = Array.isArray(req.body) ? req.body : [req.body];

    const now = new Date();
    const tradingDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const ops = items.map((b) => {
      const symbol = normalizeStoredSymbol(b.symbol, b.currency);
      const currency = b.currency;
      const closePrice = b.closePrice != null ? Number(b.closePrice) : null;
      const dayChange = b.dayChange != null ? Number(b.dayChange) : (closePrice != null && b.prevClose != null ? closePrice - Number(b.prevClose) : null);
      const dayChangePercent = b.dayChangePercent != null ? Number(b.dayChangePercent) : (dayChange != null && b.prevClose ? (dayChange / Number(b.prevClose)) * 100 : null);

      if (!symbol || closePrice == null || dayChange == null || dayChangePercent == null) return null;

      const symbolHash = sha(symbol);

      return {
        updateOne: {
          filter: { userId, symbolHash, tradingDate },
          update: {
            $set: {
              userId,
              symbol: encrypt(symbol),
              symbolHash,
              currency: encrypt(currency),
              closePrice: encrypt(closePrice),
              dayChange: encrypt(dayChange),
              dayChangePercent: encrypt(dayChangePercent),
              tradingDate
            },
            $setOnInsert: { createdAt: new Date() }
          },
          upsert: true
        }
      };
    }).filter(Boolean);

    if (!ops.length) return res.status(400).json({ error: 'payload inválido' });

    const result = await DailyReturnBuffer.bulkWrite(ops, { ordered: false });
    res.json({ ok: true, upserted: result.upsertedCount || 0, modified: result.modifiedCount || 0 });
  } catch (e) {
    console.error('[daily-returns] post error', e);
    res.status(500).json({ error: 'Erro ao registrar daily returns' });
  }
});

export default router;
