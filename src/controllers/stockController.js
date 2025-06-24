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

    static async getStocksList(req, res) {
        try {
            const stocks = await stock.find()
            res.status(200).json(stocks)
        } catch (error) {
            res.status(500).json({ msg: "Error fetching stock list", error: error.message })
        }
    }

    static async getStockById(req, res) {
        const { id } = req.params

        if (!id) {
            return res.status(400).send('ID is required')
        }

        try {
            const stockData = await stock.findById(id)
            if (!stockData) {
                return res.status(400).send('Stock not found')
            }
            res.status(200).json(stockData)
        } catch (error) {
            res.status(500).json({ msg: "Error fetching stock data", error: error.message })
        }
    }

    static async addStock(req, res) {
        const { symbol, currency, averagePrice, userId } = req.body

        if (!symbol) {
            return res.status(400).send('Symbol is required')
        }

        if (!currency) {
            return res.status(400).send('Currency is required')
        }
        
        if (isNaN(averagePrice)) {
            return res.status(400).send('Average price must be a number')
        }
        

        try {
            const stockExists = await stock.findOne({ symbol: symbol })
            if (stockExists) {
                return res.status(200).send('Stock already exists')
            }

            const newStock = await stock.create({ symbol, currency, averagePrice, userId })
            res.status(201).json({ msg: 'Stock created successfully', newStock })
        } catch (error) {
            res.status(500).json({ msg: "Something went wrong in the server", error: error.message })
        }
        
    }

    static async deleteStock(req, res) {
        const { id } = req.params

        if (!id) {
            return res.status(400).send('ID is required')
        }

        try {
            const stockExists = await stock.findById(id)
            if (!stockExists) {
                return res.status(400).send('Stock not found')
            }

            await stock.deleteOne({ _id: id })
            res.status(200).json({ msg: 'Stock deleted successfully' })
        } catch (error) {
            res.status(500).json({ msg: "Something went wrong in the server", error: error.message })
        }
    }

    static async updateStock(req, res) {
        const { id } = req.params
        const { averagePrice, stocksQuantity } = req.body

        if (!id) {
            return res.status(400).send('ID is required')
        }
        if (!averagePrice) {
            return res.status(400).send('Average price is required')
        }
        if (isNaN(averagePrice)) {
            return res.status(400).send('Average price must be a number')
        }
        if (!stocksQuantity || isNaN(stocksQuantity)) {
            return res.status(400).send('Stocks quantity must be a number');
        }
        try {
            const stockExists = await stock.findById(id)
            if (!stockExists) {
                return res.status(400).send('Stock not found')
            }

            const updatedStock = await stock.findByIdAndUpdate(id, { averagePrice, stocksQuantity }, { new: true })
            res.status(200).json({ msg: 'Stock updated successfully', updatedStock })
        } catch (error) {
            res.status(500).json({ msg: "Something went wrong in the server", error: error.message })
        }
        
    }
}

export default StockController