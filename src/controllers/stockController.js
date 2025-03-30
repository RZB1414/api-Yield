import yahooFinance from "yahoo-finance2"
import { stock } from "../models/Stock.js"

class StockController {

    static async searchStocks(req, res) {
        const { stock } = req.body

        if (!stock) {
            return res.status(400).send('Stock name is required')
        }
        try {

            const results = await yahooFinance.search(stock, { quotesCount: 5 });

            const filteredResults = results.quotes.filter((quote) => {
                return (
                    quote.exchDisp === "NASDAQ" || // EUA - NASDAQ
                    quote.exchDisp === "NYSE" ||  // EUA - NYSE
                    quote.exchDisp === "São Paulo"    // Brasil - B3 (Bolsa de Valores do Brasil)
                )
            })

            res.status(200).json(filteredResults)
        } catch (error) {
            res.status(500).json({ msg: "Error fetching stock data", error: error.message });
        }
    }

    static async getStockData(req, res) {
        const { stock } = req.body

        try {
            if (!stock) {
                return res.status(400).send('Stock name is required')
            }
                
        const stockData = await yahooFinance.quoteSummary(stock);

        if (!stockData || !stockData.price) {
            return res.status(200).json({ msg: "Stock not found or data unavailable" });
        }

        const stockInfo = {
            symbol: stockData.price.symbol,
            name: stockData.price.longName || stockData.price.shortName,
            exchange: stockData.price.exchangeName,
            currency: stockData.price.currency,
            currentPrice: stockData.price.regularMarketPrice,
            marketTime: stockData.price.regularMarketTime,
        }

        res.status(200).json({'stock info: ' : stockInfo})       
    } catch (error) {
            res.status(200).json({ msg: "Error fetching stock data", error: error.message });
        }
    }

    static async addStock(req, res) {
        const { symbol, currency, avaragePrice } = req.body

        if (!symbol || !currency || !avaragePrice) {
            return res.status(400).send('All fields are required')
        }
        try {
            const stockExists = await stock.findOne({ symbol: symbol })
            if (stockExists) {
                return res.status(400).send('Stock already exists')
            }

            const newStock = await stock.create({ symbol, currency, avaragePrice })
            res.status(201).json({ msg: 'Stock created successfully', newStock })
        } catch (error) {
            res.status(500).json({ msg: "Something went wrong in the server", error: error.message })
        }
        
    }
}

export default StockController