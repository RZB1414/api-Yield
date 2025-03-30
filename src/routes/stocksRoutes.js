import express from "express"
import StockController from "../controllers/stockController.js"

const routes = express.Router()

routes.get('/auth/searchStocks', StockController.searchStocks)
routes.get('/auth/getStockData', StockController.getStockData)
routes.get('/auth/getStocksList', StockController.getStocksList)
routes.get('/auth/getStock/:id', StockController.getStockById)
routes.post('/auth/addStock', StockController.addStock)
routes.put('/auth/updateStock/:id', StockController.updateStock)
routes.delete('/auth/deleteStock/:id', StockController.deleteStock)

export default routes