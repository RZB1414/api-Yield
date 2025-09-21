import yahooFinance from "yahoo-finance2"
import { stock } from "../models/Stock.js"
import { HoldingsHistory } from "../models/HoldingsHistory.js"
import CryptoJS from "crypto-js"

class StockController {

    static async searchStocks(req, res) {
        const { stock } = req.body
        if (!stock) {
            return res.status(200).json({ aviso: 'Stock name is required' });
        }
        let attempt = 0;
        while (attempt < 2) {
            try {
                const results = await yahooFinance.search(stock, { quotesCount: 5 });
                const filteredResults = results.quotes.filter((quote) => {
                    return (
                        quote.exchDisp === "NASDAQ" ||
                        quote.exchDisp === "NYSE" ||
                        quote.exchDisp === "São Paulo"
                    )
                })
                return res.status(200).json(filteredResults);
            } catch (error) {
                attempt++;
                if (attempt === 2) {
                    console.warn("Aviso: Falha ao buscar dados de ações:", error.message);
                    return res.status(200).json({ aviso: "Não foi possível buscar os dados da ação no momento. Tente novamente mais tarde." });
                }
            }
        }
    }

    static async getStockData(req, res) {
        const { stock } = req.body
        if (!stock) {
            return res.status(200).json({ aviso: 'Stock name is required' });
        }
        let attempt = 0;
        while (attempt < 2) {
            try {
                const stockData = await yahooFinance.quoteSummary(stock); 
                               
                if (!stockData || !stockData.price) {
                    return res.status(200).json({ aviso: "Stock not found or data unavailable" });
                }
                const stockInfo = {
                    symbol: stockData.price.symbol,
                    name: stockData.price.longName || stockData.price.shortName,
                    exchange: stockData.price.exchangeName,
                    currency: stockData.price.currency,
                    currentPrice: stockData.price.regularMarketPrice,
                    dayPriceChangePercent: stockData.price.regularMarketChangePercent,
                }
                
                return res.status(200).json({'stock info: ' : stockInfo});
            } catch (error) {
                attempt++;
                if (attempt === 2) {
                    console.warn("Aviso: Falha ao buscar dados detalhados da ação:", error.message);
                    return res.status(200).json({ aviso: "Não foi possível buscar os dados detalhados da ação no momento. Tente novamente mais tarde." });
                }
            }
        }
    }

    static async getStocksList(req, res) {
        const { id } = req.params
        let attempt = 0;
        while (attempt < 2) {
            try {
                const secretKey = process.env.CRYPTO_SECRET;
                const stocks = await stock.find({ userId: id });
                const decryptedStocks = stocks.map(item => {
                    let symbol = item.symbol;
                    let currency = item.currency;
                    let averagePrice = item.averagePrice;
                    let stocksQuantity = item.stocksQuantity;
                    let userId = item.userId;
                    try {
                        symbol = CryptoJS.AES.decrypt(symbol, secretKey).toString(CryptoJS.enc.Utf8);
                        currency = CryptoJS.AES.decrypt(currency, secretKey).toString(CryptoJS.enc.Utf8);
                        averagePrice = CryptoJS.AES.decrypt(averagePrice, secretKey).toString(CryptoJS.enc.Utf8);
                        stocksQuantity = CryptoJS.AES.decrypt(stocksQuantity, secretKey).toString(CryptoJS.enc.Utf8)
                    } catch (e) {
                        // Se falhar, retorna os dados como estão
                    }
                    return {
                        _id: item._id,
                        symbol,
                        currency,
                        averagePrice,
                        stocksQuantity,
                        userId
                    };
                });
                
                return res.status(200).json(decryptedStocks)
            } catch (error) {
                attempt++;
                if (attempt === 2) {
                    console.warn("Aviso: Falha ao buscar lista de ações:", error.message);
                    return res.status(200).json({ aviso: "Não foi possível buscar a lista de ações no momento. Tente novamente mais tarde." });
                }
            }
        }
    }

    static async getStockById(req, res) {
        const { id } = req.params
        if (!id) {
            return res.status(200).json({ aviso: 'ID is required' });
        }
        let attempt = 0;
        while (attempt < 2) {
            try {
                const stockData = await stock.findById(id)
                if (!stockData) {
                    return res.status(200).json({ aviso: 'Stock not found' });
                }
                return res.status(200).json(stockData)
            } catch (error) {
                attempt++;
                if (attempt === 2) {
                    console.warn("Aviso: Falha ao buscar ação por ID:", error.message);
                    return res.status(200).json({ aviso: "Não foi possível buscar a ação no momento. Tente novamente mais tarde." });
                }
            }
        }
    }

    static async addStock(req, res) {
        const { symbol, currency, averagePrice, stocksQuantity, userId } = req.body;
        if (!symbol) {
            return res.status(200).json({ aviso: 'Symbol is required' });
        }
        if (!currency) {
            return res.status(200).json({ aviso: 'Currency is required' });
        }
        if (!userId) {
            return res.status(200).json({ aviso: 'userId is required in body' });
        }
        let attempt = 0;
        while (attempt < 2) {
            try {
                const stockExists = await stock.findOne({ symbol: symbol });
                if (stockExists) {
                    return res.status(200).json({ aviso: 'Stock already exists' });
                }

                const secretKey = process.env.CRYPTO_SECRET;
                const encryptedSymbol = CryptoJS.AES.encrypt(symbol, secretKey).toString();
                const encryptedCurrency = CryptoJS.AES.encrypt(currency, secretKey).toString();
                const encryptedAveragePrice = CryptoJS.AES.encrypt(averagePrice.toString(), secretKey).toString();
                const encryptedStocksQuantity = CryptoJS.AES.encrypt(stocksQuantity.toString(), secretKey).toString();
                const newStock = await stock.create({
                    symbol: encryptedSymbol,
                    currency: encryptedCurrency,
                    averagePrice: encryptedAveragePrice,
                    stocksQuantity: encryptedStocksQuantity,
                    userId: userId
                });

                // Criar histórico inicial de holdings
                try {
                    const upperSymbol = symbol.toUpperCase().trim();
                    const symbolHash = CryptoJS.SHA256(upperSymbol).toString(CryptoJS.enc.Hex);
                    if (stocksQuantity !== undefined && stocksQuantity !== null && !isNaN(Number(stocksQuantity))) {
                        await HoldingsHistory.create({
                            userId,
                            symbol: encryptedSymbol,
                            symbolHash,
                            quantity: encryptedStocksQuantity,
                            averagePrice: encryptedAveragePrice,
                            validFrom: new Date(),
                            validTo: null
                        });
                    }
                } catch (histErr) {
                    console.warn('[HoldingsHistory] Erro ao criar histórico inicial:', histErr.message);
                }
                return res.status(201).json({ msg: 'Stock created successfully', newStock });
            } catch (error) {
                attempt++;
                if (attempt === 2) {
                    console.warn("Aviso: Falha ao adicionar ação:", error.message);
                    return res.status(200).json({ aviso: "Não foi possível adicionar a ação no momento. Tente novamente mais tarde." });
                }
            }
        }
    }

    static async deleteStock(req, res) {
        const { id } = req.params
        if (!id) {
            return res.status(200).json({ aviso: 'ID is required' });
        }
        let attempt = 0;
        while (attempt < 2) {
            try {
                const stockExists = await stock.findById(id)
                if (!stockExists) {
                    return res.status(200).json({ aviso: 'Stock not found' });
                }
                // Fecha histórico vigente antes de deletar
                try {
                    const secretKey = process.env.CRYPTO_SECRET;
                    let decryptedSymbol = stockExists.symbol;
                    try {
                        decryptedSymbol = CryptoJS.AES.decrypt(stockExists.symbol, secretKey).toString(CryptoJS.enc.Utf8) || stockExists.symbol;
                    } catch {}
                    const symbolHash = CryptoJS.SHA256(decryptedSymbol.toUpperCase().trim()).toString(CryptoJS.enc.Hex);
                    await HoldingsHistory.updateOne(
                        { userId: stockExists.userId, symbolHash, validTo: null },
                        { $set: { validTo: new Date() } }
                    );
                } catch (histErr) {
                    console.warn('[HoldingsHistory] Erro ao fechar histórico na deleção:', histErr.message);
                }
                await stock.deleteOne({ _id: id })
                return res.status(200).json({ msg: 'Stock deleted successfully' });
            } catch (error) {
                attempt++;
                if (attempt === 2) {
                    console.warn("Aviso: Falha ao deletar ação:", error.message);
                    return res.status(200).json({ aviso: "Não foi possível deletar a ação no momento. Tente novamente mais tarde." });
                }
            }
        }
    }

    static async updateStock(req, res) {
        const { id } = req.params
        const { averagePrice, stocksQuantity } = req.body
        if (!id) {
            return res.status(200).json({ aviso: 'ID is required' });
        }
        if (averagePrice === undefined || averagePrice === null || averagePrice === "") {
            return res.status(200).json({ aviso: 'Average price is required' });
        }
        if (isNaN(averagePrice)) {
            return res.status(200).json({ aviso: 'Average price must be a number' });
        }
        if (stocksQuantity === undefined || stocksQuantity === null || isNaN(stocksQuantity)) {
            return res.status(200).json({ aviso: 'Stocks quantity must be a number' });
        }
        let attempt = 0;
        while (attempt < 2) {
            try {
                const stockExists = await stock.findById(id)
                if (!stockExists) {
                    return res.status(200).json({ aviso: 'Stock not found' });
                }
                const secretKey = process.env.CRYPTO_SECRET;
                const encryptedAveragePrice = CryptoJS.AES.encrypt(averagePrice.toString(), secretKey).toString();
                const encryptedStocksQuantity = CryptoJS.AES.encrypt(stocksQuantity.toString(), secretKey).toString();

                // Detecta mudança de quantidade e atualiza histórico
                try {
                    let decryptedSymbol = stockExists.symbol;
                    let prevQtyStr = stockExists.stocksQuantity;
                    try {
                        decryptedSymbol = CryptoJS.AES.decrypt(stockExists.symbol, secretKey).toString(CryptoJS.enc.Utf8) || stockExists.symbol;
                        prevQtyStr = CryptoJS.AES.decrypt(stockExists.stocksQuantity, secretKey).toString(CryptoJS.enc.Utf8) || stockExists.stocksQuantity;
                    } catch {}
                    const prevQty = Number(prevQtyStr);
                    const newQty = Number(stocksQuantity);
                    if (!isNaN(newQty) && newQty !== prevQty) {
                        const upperSymbol = decryptedSymbol.toUpperCase().trim();
                        const symbolHash = CryptoJS.SHA256(upperSymbol).toString(CryptoJS.enc.Hex);
                        const now = new Date();
                        // Fecha o período anterior ainda aberto
                        await HoldingsHistory.updateOne(
                            { userId: stockExists.userId, symbolHash, validTo: null },
                            { $set: { validTo: now } }
                        );
                        // Abre novo período
                        await HoldingsHistory.create({
                            userId: stockExists.userId,
                            symbol: CryptoJS.AES.encrypt(upperSymbol, secretKey).toString(),
                            symbolHash,
                            quantity: encryptedStocksQuantity,
                            averagePrice: encryptedAveragePrice,
                            validFrom: now,
                            validTo: null
                        });
                    }
                } catch (histErr) {
                    console.warn('[HoldingsHistory] Erro ao atualizar histórico:', histErr.message);
                }

                const updatedStock = await stock.findByIdAndUpdate(
                    id,
                    { averagePrice: encryptedAveragePrice, stocksQuantity: encryptedStocksQuantity },
                    { new: true }
                );
                return res.status(200).json({ msg: 'Stock updated successfully', updatedStock });
            } catch (error) {
                attempt++;
                if (attempt === 2) {
                    console.warn("Aviso: Falha ao atualizar ação:", error.message);
                    return res.status(200).json({ aviso: "Não foi possível atualizar a ação no momento. Tente novamente mais tarde." });
                }
            }
        }
    }
}

export default StockController