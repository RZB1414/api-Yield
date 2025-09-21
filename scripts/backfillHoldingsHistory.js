import 'dotenv/config';
import CryptoJS from 'crypto-js';
import mongoose from 'mongoose';
import { dbConnection } from '../src/config/dbConnect.js';
import { stock } from '../src/models/Stock.js';
import { HoldingsHistory } from '../src/models/HoldingsHistory.js';

async function main() {
  await dbConnection();
  const SECRET = process.env.CRYPTO_SECRET;
  if (!SECRET) {
    console.error('CRYPTO_SECRET não definido. Abortando.');
    process.exit(1);
  }

  const all = await stock.find({});
  console.log(`[Backfill] Ações encontradas: ${all.length}`);

  let created = 0;
  for (const s of all) {
    try {
      // Descriptografar campos necessários
      let symbol = s.symbol;
      let qtyStr = s.stocksQuantity;
      let avgStr = s.averagePrice;
      try {
        symbol = CryptoJS.AES.decrypt(symbol, SECRET).toString(CryptoJS.enc.Utf8) || symbol;
        qtyStr = CryptoJS.AES.decrypt(qtyStr, SECRET).toString(CryptoJS.enc.Utf8) || qtyStr;
        avgStr = CryptoJS.AES.decrypt(avgStr, SECRET).toString(CryptoJS.enc.Utf8) || avgStr;
      } catch {}

      const upper = (symbol || '').toUpperCase().trim();
      if (!upper) {
        console.log('[Backfill] Ignorando registro sem símbolo');
        continue;
      }
      const symbolHash = CryptoJS.SHA256(upper).toString(CryptoJS.enc.Hex);

      const existingOpen = await HoldingsHistory.findOne({ userId: s.userId, symbolHash, validTo: null });
      if (existingOpen) {
        // Já existe período aberto — não criar duplicado
        continue;
      }

      // Cria um período vigente a partir de agora com a quantidade atual (pode ser zero)
      const encSymbol = CryptoJS.AES.encrypt(upper, SECRET).toString();
      const encQty = CryptoJS.AES.encrypt(String(qtyStr ?? ''), SECRET).toString();
      const encAvg = CryptoJS.AES.encrypt(String(avgStr ?? ''), SECRET).toString();
      await HoldingsHistory.create({
        userId: s.userId,
        symbol: encSymbol,
        symbolHash,
        quantity: encQty,
        averagePrice: encAvg,
        validFrom: new Date(),
        validTo: null
      });
      created++;
    } catch (err) {
      console.warn('[Backfill] Falha ao processar ação:', err.message);
    }
  }

  console.log(`[Backfill] Períodos criados: ${created}`);
  await mongoose.connection.close();
}

main().catch(err => {
  console.error('[Backfill] Erro geral:', err);
  process.exit(1);
});
