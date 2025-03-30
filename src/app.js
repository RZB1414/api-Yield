import express from 'express'
import routes from './routes/index.js'
import cors from 'cors'

const app = express()

app.use(cors({
    origin: '*', // Allow all origins
    credentials: true,
<<<<<<< HEAD
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
=======
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
>>>>>>> 25454c4819959b4b786f4306c5993e2bdc488ef2
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 300
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
    req.setTimeout(20000, () => { 
        res.status(504).send('app.js error: Request has timed out.')
    })
    next()
})

routes(app)

export default app