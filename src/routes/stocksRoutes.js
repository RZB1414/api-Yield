import express from "express"
import StockController from "../controllers/stockController.js"

const routes = express.Router()

routes.get('/auth/searchStocks', StockController.searchStocks)
routes.get('/auth/getStockData', StockController.getStockData)
routes.post('/auth/addStock', StockController.addStock)

export default routes