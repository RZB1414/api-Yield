import express from 'express'
import stocks from './stocksRoutes.js'

const routes = (app) => {
    app.route('/').get((req, res) => res.status(200).send(
        'Yield. Management system.'
    ))

    app.use(express.json(), stocks)
}

export default routes