import yahooFinance from "yahoo-finance2"
import { stock } from "../models/Stock.js"

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
                console.log(`Stock data for ${stock}:`, stockData);
                               
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
                const stocks = await stock.find({ userId: id })
                return res.status(200).json(stocks)
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
                const newStock = await stock.create({ symbol, currency, averagePrice, stocksQuantity, userId });
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
        if (!averagePrice) {
            return res.status(200).json({ aviso: 'Average price is required' });
        }
        if (isNaN(averagePrice)) {
            return res.status(200).json({ aviso: 'Average price must be a number' });
        }
        if (!stocksQuantity || isNaN(stocksQuantity)) {
            return res.status(200).json({ aviso: 'Stocks quantity must be a number' });
        }
        let attempt = 0;
        while (attempt < 2) {
            try {
                const stockExists = await stock.findById(id)
                if (!stockExists) {
                    return res.status(200).json({ aviso: 'Stock not found' });
                }
                const updatedStock = await stock.findByIdAndUpdate(id, { averagePrice, stocksQuantity }, { new: true })
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