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

    // Garante que índices (incluindo o único) estejam inicializados antes dos upserts
    try {
      await Snapshot.init();
    } catch (idxErr) {
      console.warn('[Snapshot] Warn initializing indexes:', idxErr.message);
    }

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
      const originalSymbol = pos.symbol.toUpperCase().trim(); // normaliza para consistência
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

      // Armazena sempre o símbolo normalizado em uppercase (sem .SA) para evitar duplicados case-sensitive
      // Mantemos o símbolo do usuário sem o sufixo .SA (se adicionamos apenas para consulta) assumindo que o cadastro original foi sem .SA.
      const storedSymbol = originalSymbol.endsWith('.SA') ? originalSymbol.replace('.SA', '') : originalSymbol;
      const filter = { userId: pos.userId, symbol: storedSymbol, tradingDate };
      const update = {
        $setOnInsert: {
          userId: pos.userId,
          symbol: storedSymbol,
          currency: pos.currency,
          closePrice,
          dayChange,
          dayChangePercent,
          tradingDate,
          createdAt: new Date()
        }
      };
      try {
        const res = await Snapshot.updateOne(filter, update, { upsert: true });
        if (res.upsertedCount === 1 || (res.upserted && res.upserted.length)) {
          created++;
        } else {
          // já existia; opcionalmente poderíamos atualizar preços, mas mantemos histórico congelado
        }
      } catch (upErr) {
        if (upErr.code === 11000) {
          // corrida vencida por outra operação; ignorar
        } else {
          console.warn('[Snapshot] Upsert error:', upErr.message);
        }
      }
    }

    console.log(`[Snapshot] Done. New snapshots: ${created}`);
  } catch (error) {
    console.error("[Snapshot] General error:", error.message);
  }
}
