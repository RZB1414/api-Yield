import express from 'express'
import stocks from './stocksRoutes.js'
import dividends from './dividendsRoutes.js'
import brokers from './brokersRoutes.js'
import totalValueBrokers from './totalValueBrokersRoutes.js'
import encryptedDividends from './encryptedDividendsRoutes.js'
import users from './usersRoutes.js'

const routes = (app) => {
    app.route('/').get((req, res) => res.status(200).send(
        'Yield. Management system.'
    ))

    app.use(express.json(), stocks, dividends, brokers, totalValueBrokers, encryptedDividends, users)
}

export default routes