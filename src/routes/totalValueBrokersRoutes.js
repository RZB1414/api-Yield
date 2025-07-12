import express from 'express'
import TotalValueBrokerController from '../controllers/totalValueBrokerController.js'
import { authenticateToken } from '../middlewares/authMiddleware.js'

const routes = express.Router()

routes.post('/auth/createTotalValueBroker', authenticateToken, TotalValueBrokerController.createTotalValueBroker)
routes.get('/auth/getAllTotalValueBrokers/:id', authenticateToken, TotalValueBrokerController.getAllTotalValueBrokers)
routes.get('/auth/getTotalValueBroker/:id', authenticateToken, TotalValueBrokerController.getTotalValueBrokerById)
routes.put('/auth/updateTotalValueBroker/', authenticateToken, TotalValueBrokerController.updateTotalValueBroker)
routes.delete('/auth/deleteTotalValueBroker/:id', authenticateToken, TotalValueBrokerController.deleteTotalValueBroker)

export default routes