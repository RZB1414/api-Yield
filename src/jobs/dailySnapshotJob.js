import yahooFinance from "yahoo-finance2";
import CryptoJS from "crypto-js";
import { stock } from "../models/Stock.js";
import { Snapshot } from "../models/Snapshot.js";

const SECRET = process.env.CRYPTO_SECRET;

// Lógica reutilizável (não agenda aqui para poder ser chamada pelo GitHub Actions)
export async function runDailySnapshot() {
  const now = new Date();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) {
    console.log("[Snapshot] Weekend. Skipping.");
    return;
  }

  const tradingDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  try {
    const allPositions = await stock.find({});
    if (!allPositions.length) {
      console.log("[Snapshot] No positions found.");
      return;
    }

    const decryptedPositions = allPositions.map(p => {
      let symbol = p.symbol;
      let currency = p.currency;
      let averagePrice = p.averagePrice;
      let stocksQuantity = p.stocksQuantity;
      try {
        symbol = CryptoJS.AES.decrypt(symbol, SECRET).toString(CryptoJS.enc.Utf8) || symbol;
        currency = CryptoJS.AES.decrypt(currency, SECRET).toString(CryptoJS.enc.Utf8) || currency;
        averagePrice = CryptoJS.AES.decrypt(averagePrice, SECRET).toString(CryptoJS.enc.Utf8) || averagePrice;
        stocksQuantity = CryptoJS.AES.decrypt(stocksQuantity, SECRET).toString(CryptoJS.enc.Utf8) || stocksQuantity;
      } catch (e) {
        // ignore decryption errors; assume plain text
      }
      return {
        userId: p.userId,
        symbol,
        currency,
        averagePrice: parseFloat(averagePrice) || null,
        stocksQuantity: parseFloat(stocksQuantity) || null
      };
    });

    const uniqueSymbols = [...new Set(decryptedPositions.map(p => p.symbol).filter(Boolean))];
    const quotesMap = {};

    try {
      const batch = await yahooFinance.quote(uniqueSymbols);
      if (Array.isArray(batch)) {
        batch.forEach(q => { if (q && q.symbol) quotesMap[q.symbol] = q; });
      } else if (batch && batch.symbol) {
        quotesMap[batch.symbol] = batch;
      }
    } catch (err) {
      console.warn("[Snapshot] Batch quote fail, fallback one by one:", err.message);
      for (const sym of uniqueSymbols) {
        try {
          const q = await yahooFinance.quote(sym);
          if (q && q.symbol) quotesMap[q.symbol] = q;
        } catch (er) {
          console.warn(`[Snapshot] Failed quote ${sym}:`, er.message);
        }
      }
    }

    let created = 0;
    for (const pos of decryptedPositions) {
      const q = quotesMap[pos.symbol];
      if (!q) continue;

      const closePrice = q.regularMarketPrice;
      const dayChange = q.regularMarketChange;
      const dayChangePercent = q.regularMarketChangePercent;

      if (closePrice == null || dayChange == null || dayChangePercent == null) continue;
      if (q.regularMarketVolume === 0 || q.regularMarketVolume == null) continue; // possível feriado

      const exists = await Snapshot.findOne({ userId: pos.userId, symbol: pos.symbol, tradingDate }).lean();
      if (exists) continue;

      try {
        await Snapshot.create({
          userId: pos.userId,
          symbol: pos.symbol,
          currency: pos.currency,
          closePrice,
          dayChange,
          dayChangePercent,
          tradingDate
        });
        created++;
      } catch (createErr) {
        if (createErr.code !== 11000) {
          console.warn("[Snapshot] Create error:", createErr.message);
        }
      }
    }

    console.log(`[Snapshot] Done. New snapshots: ${created}`);
  } catch (error) {
    console.error("[Snapshot] General error:", error.message);
  }
}
