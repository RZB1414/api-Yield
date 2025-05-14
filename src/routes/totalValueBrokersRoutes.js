import express from 'express'
import TotalValueBrokerController from '../controllers/totalValueBrokerController.js'

const routes = express.Router()

routes.post('/auth/createTotalValueBroker', TotalValueBrokerController.createTotalValueBroker)
routes.get('/auth/getAllTotalValueBrokers', TotalValueBrokerController.getAllTotalValueBrokers)
routes.get('/auth/getTotalValueBroker/:id', TotalValueBrokerController.getTotalValueBrokerById)
routes.put('/auth/updateTotalValueBroker/', TotalValueBrokerController.updateTotalValueBroker)
routes.delete('/auth/deleteTotalValueBroker/:id', TotalValueBrokerController.deleteTotalValueBroker)

export default routes