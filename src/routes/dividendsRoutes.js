import express from 'express'
import DividendController from '../controllers/dividendController.js'
import upload from '../middlewares/uploadMiddleware.js'

const routes = express.Router()

routes.post('/auth/readFile', upload.single("file"), DividendController.readFile)
routes.get('/auth/getAllDividends', DividendController.getAllDividends)
routes.get('/auth/getByTicker/:ticker', DividendController.getByTicker)
routes.get('/auth/getByDate', DividendController.getByDate)

export default routes