import express from 'express'
import stocks from './stocksRoutes.js'
import brokers from './brokersRoutes.js'
import totalValueBrokers from './totalValueBrokersRoutes.js'
import encryptedDividends from './encryptedDividendsRoutes.js'
import users from './usersRoutes.js'
import creditCards from './creditCardsRoutes.js'
import btgDividends from './btgDividends.js'
import holdingsHistory from './holdingsHistoryRoutes.js'

const routes = (app) => {
    app.route('/').get((req, res) => res.status(200).send(
        'Yield. Management system.'
    ))

    app.use(express.json(), stocks, brokers, totalValueBrokers, encryptedDividends, users, creditCards, btgDividends, holdingsHistory)
}

export default routes