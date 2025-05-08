import express from 'express'
import BrokerController from '../controllers/brokerController.js'

const routes = express.Router()

routes.post('/auth/createBroker', BrokerController.createBroker)
routes.get('/auth/getBrokers', BrokerController.getBrokers)
routes.get('/auth/getBroker/:id', BrokerController.getBrokerById)

export default routes