import express from 'express'
import stocks from './stocksRoutes.js'
import dividends from './dividendsRoutes.js'

const routes = (app) => {
    app.route('/').get((req, res) => res.status(200).send(
        'Yield. Management system.'
    ))

    app.use(express.json(), stocks, dividends)
}

export default routes