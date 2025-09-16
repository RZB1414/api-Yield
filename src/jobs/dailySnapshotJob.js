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

    // Normalização de símbolos BRL (B3) adicionando sufixo .SA para consulta,
    // mas mantendo o símbolo original salvo no snapshot.
    const symbolMapping = {}; // originalSymbol -> apiSymbol
    const apiSymbols = decryptedPositions.map(p => {
      if (!p.symbol) return null;
      const upper = p.symbol.toUpperCase().trim();
      if (p.currency && p.currency.toUpperCase() === 'BRL') {
        if (!upper.endsWith('.SA')) {
          symbolMapping[upper] = upper + '.SA';
          return upper + '.SA';
        }
      }
      symbolMapping[upper] = upper; // sem alteração
      return upper;
    }).filter(Boolean);

    const uniqueSymbols = [...new Set(apiSymbols)];
    const quotesMap = {}; // apiSymbol -> quote

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
      if (!pos.symbol) {
        console.log('[Snapshot] Skip: symbol vazio');
        continue;
      }
      const originalSymbol = pos.symbol.toUpperCase().trim();
      const apiSymbol = symbolMapping[originalSymbol];
      const q = quotesMap[apiSymbol];
      if (!q) {
        console.log(`[Snapshot] Skip: quote não encontrado para ${originalSymbol} (apiSymbol=${apiSymbol})`);
        continue;
      }

      let closePrice = q.regularMarketPrice;
      let dayChange = q.regularMarketChange;
      let dayChangePercent = q.regularMarketChangePercent;

      // Fallback: se variação vier null mas temos previousClose
      if ((dayChange == null || dayChangePercent == null) && q.regularMarketPreviousClose != null && closePrice != null) {
        if (dayChange == null) dayChange = closePrice - q.regularMarketPreviousClose;
        if (dayChangePercent == null && q.regularMarketPreviousClose !== 0) {
          dayChangePercent = (dayChange / q.regularMarketPreviousClose) * 100;
        }
      }

      if (closePrice == null) {
        console.log(`[Snapshot] Skip: closePrice null ${originalSymbol}`);
        continue;
      }
      if (dayChange == null || dayChangePercent == null) {
        console.log(`[Snapshot] Skip: sem variação calculável ${originalSymbol}`);
        continue;
      }

      const exists = await Snapshot.findOne({ userId: pos.userId, symbol: pos.symbol, tradingDate }).lean();
      if (exists) {
        // já existe
        continue;
      }

      try {
        await Snapshot.create({
          userId: pos.userId,
          symbol: pos.symbol, // mantém símbolo original cadastrado pelo usuário
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
