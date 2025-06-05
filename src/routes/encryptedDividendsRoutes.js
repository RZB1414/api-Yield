import  express from 'express'
import EncryptedDividendsController from '../controllers/encryptedDividendsController.js'

const routes = express.Router()

routes.post('/auth/save', EncryptedDividendsController.save)
routes.get('/auth/getAllEncrytedDividends', EncryptedDividendsController.findAll)
routes.get('/auth/getDividendsById/:id', EncryptedDividendsController.findByUserId)
routes.delete('/auth/deleteDividendsById/:id', EncryptedDividendsController.deleteByUserId)

export default routes