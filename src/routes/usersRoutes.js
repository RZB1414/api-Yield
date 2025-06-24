import express from 'express'
import UserController from '../controllers/userController.js'

const routes = express.Router()

routes.post('/auth/createUser', UserController.createUser)
routes.post('/auth/login', UserController.login)
routes.post('/auth/refreshToken', UserController.refreshToken)
routes.get('/auth/getAllUsers', UserController.getAllUsers)
routes.get('/auth/getUser/:id', UserController.getUserById)
routes.get('/auth/me', UserController.getMe)

export default routes