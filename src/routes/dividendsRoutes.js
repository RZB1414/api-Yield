import express from 'express'
import DividendController from '../controllers/dividendController.js'
import upload from '../middlewares/uploadMiddleware.js'

const routes = express.Router()

routes.post('/auth/readFile', upload.single("file"), DividendController.readFile)

export default routes