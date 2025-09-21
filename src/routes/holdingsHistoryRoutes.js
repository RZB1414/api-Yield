import express from "express";
import CryptoJS from "crypto-js";
import { HoldingsHistory } from "../models/HoldingsHistory.js";

const router = express.Router();

// GET /auth/holdings/history?userId=...&symbol=OPTIONAL
router.get("/auth/holdings/history", async (req, res) => {
  const { userId, symbol } = req.query;
  if (!userId) {
    return res.status(200).json({ aviso: "userId é obrigatório" });
  }
  try {
    const SECRET = process.env.CRYPTO_SECRET;
    let filter = { userId };
    if (symbol) {
      const hash = CryptoJS.SHA256(symbol.toUpperCase().trim()).toString(CryptoJS.enc.Hex);
      filter = { ...filter, symbolHash: hash };
    }
    const docs = await HoldingsHistory.find(filter).sort({ validFrom: 1 });
    const decrypted = docs.map(d => {
      let sym = d.symbol;
      let qty = d.quantity;
      let avg = d.averagePrice;
      try {
        sym = CryptoJS.AES.decrypt(sym, SECRET).toString(CryptoJS.enc.Utf8) || sym;
        qty = CryptoJS.AES.decrypt(qty, SECRET).toString(CryptoJS.enc.Utf8) || qty;
        avg = CryptoJS.AES.decrypt(avg, SECRET).toString(CryptoJS.enc.Utf8) || avg;
      } catch {}
      return {
        symbol: sym,
        quantity: qty,
        averagePrice: avg,
        validFrom: d.validFrom,
        validTo: d.validTo,
      };
    });
    return res.status(200).json(decrypted);
  } catch (err) {
    console.warn("[HoldingsHistory] Falha ao obter histórico:", err.message);
    return res.status(200).json({ aviso: "Não foi possível obter o histórico no momento." });
  }
});

// GET /auth/holdings/atDate?userId=...&symbol=...&date=YYYY-MM-DD
router.get("/auth/holdings/atDate", async (req, res) => {
  const { userId, symbol, date } = req.query;
  if (!userId) {
    return res.status(200).json({ aviso: "userId é obrigatório" });
  }
  if (!symbol) {
    return res.status(200).json({ aviso: "symbol é obrigatório" });
  }
  if (!date) {
    return res.status(200).json({ aviso: "date é obrigatório (YYYY-MM-DD)" });
  }
  try {
    // Normaliza data para 23:59:59.999 no fuso horário do Brasil (America/Sao_Paulo, UTC-03:00)
    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) {
      return res.status(200).json({ aviso: "date inválido, formato esperado YYYY-MM-DD" });
    }
    // Calcula o final do dia em horário local do Brasil e converte para UTC (UTC = local + 3h)
    const BRAZIL_TZ_OFFSET_MIN = 3 * 60; // -03:00 (sem horário de verão)
    const localEndMs = Date.UTC(y, m - 1, d, 23, 59, 59, 999);
    const endOfDayUtc = new Date(localEndMs + BRAZIL_TZ_OFFSET_MIN * 60 * 1000);

    const symbolHash = CryptoJS.SHA256(symbol.toUpperCase().trim()).toString(CryptoJS.enc.Hex);
    // Encontrar o período vigente naquela data: validFrom <= endOfDay && (validTo == null || validTo > endOfDay)
    const period = await HoldingsHistory.findOne({
      userId,
      symbolHash,
      validFrom: { $lte: endOfDayUtc },
      $or: [{ validTo: null }, { validTo: { $gt: endOfDayUtc } }]
    }).sort({ validFrom: -1 });

    if (!period) {
      return res.status(200).json({ aviso: "Sem quantidade vigente na data especificada" });
    }

    const SECRET = process.env.CRYPTO_SECRET;
    let sym = period.symbol;
    let qty = period.quantity;
    let avg = period.averagePrice;
    try {
      sym = CryptoJS.AES.decrypt(sym, SECRET).toString(CryptoJS.enc.Utf8) || sym;
      qty = CryptoJS.AES.decrypt(qty, SECRET).toString(CryptoJS.enc.Utf8) || qty;
      avg = CryptoJS.AES.decrypt(avg, SECRET).toString(CryptoJS.enc.Utf8) || avg;
    } catch {}

    return res.status(200).json({ symbol: sym, quantity: qty, averagePrice: avg, validFrom: period.validFrom, validTo: period.validTo });
  } catch (err) {
    console.warn("[HoldingsHistory] Falha ao obter quantidade por data:", err.message);
    return res.status(200).json({ aviso: "Não foi possível obter a quantidade na data informada." });
  }
});

export default router;
